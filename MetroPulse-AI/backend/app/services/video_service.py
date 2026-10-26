"""Video Processing Service for MetroPulse AI Backend.

Adheres to Section 13:
- Controlled processing of recorded video feeds.
- In-process asynchronous job queue (queued, processing, completed, failed).
- Bounded CPU processing with YOLO frame sampling.
- Persists validated crowd observations on completion.
"""

import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
import uuid
from fastapi import HTTPException, status, UploadFile
from app.core.config import settings
from app.core.logging import logger
from app.utils.validation import sanitize_filename, validate_file_size, validate_video_content
from app.utils.timestamps import now_iso
from app.integrations.ml_client import ml_client
from app.services.crowd_service import crowd_service
from app.services.alert_service import alert_service
from app.services.station_service import station_service


class VideoJob:
    def __init__(self, job_id: str, station_id: str, platform_id: str, video_path: Path):
        self.job_id = job_id
        self.station_id = station_id
        self.platform_id = platform_id
        self.video_path = video_path
        self.status: str = "queued"
        self.created_at: str = now_iso()
        self.completed_at: Optional[str] = None
        self.result: Optional[Dict[str, Any]] = None
        self.error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "jobId": self.job_id,
            "stationId": self.station_id,
            "platformId": self.platform_id,
            "status": self.status,
            "createdAt": self.created_at,
            "completedAt": self.completed_at,
            "result": self.result,
            "error": self.error
        }


class VideoService:
    def __init__(self):
        self._jobs: Dict[str, VideoJob] = {}

    async def create_upload_job(
        self,
        file: UploadFile,
        station_id: str,
        platform_id: str
    ) -> VideoJob:
        """Save uploaded video file, validate integrity, and enqueue processing."""
        # 1. Validate station and platform
        stn = await station_service.get_station_by_id(station_id)
        if not stn:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Station '{station_id}' not found."
            )

        platform_match = next((p for p in stn.platforms if p.id == platform_id), None)
        if not platform_match:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Platform '{platform_id}' not found at station '{stn.name}'."
            )

        # 2. Secure file save
        safe_name = sanitize_filename(file.filename or "video.mp4")
        save_path = settings.UPLOAD_DIR / safe_name

        total_bytes = 0
        try:
            with open(save_path, "wb") as buffer:
                while chunk := await file.read(1024 * 1024):  # 1MB chunks
                    total_bytes += len(chunk)
                    validate_file_size(total_bytes)
                    buffer.write(chunk)
        except HTTPException:
            if save_path.exists():
                save_path.unlink()
            raise
        except Exception as e:
            if save_path.exists():
                save_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save upload: {e}"
            )

        # 3. Verify video stream decodability
        validate_video_content(save_path)

        # 4. Create and register job
        job_id = f"job-{uuid.uuid4().hex[:10]}"
        job = VideoJob(
            job_id=job_id,
            station_id=station_id,
            platform_id=platform_id,
            video_path=save_path
        )
        self._jobs[job_id] = job

        # 5. Launch in-process background worker
        asyncio.create_task(self._process_video_task(job, stn.name, platform_match.name))

        return job

    async def _process_video_task(self, job: VideoJob, station_name: str, platform_name: str):
        """Asynchronous worker executing bounded YOLO detection on CPU."""
        job.status = "processing"
        logger.info(f"Started video processing job {job.job_id} for {station_name} {platform_name}")

        try:
            # Run CPU inference in thread pool to avoid blocking the event loop
            loop = asyncio.get_running_loop()
            ml_res = await loop.run_in_executor(
                None,
                ml_client.process_video_file,
                job.video_path,
                job.station_id,
                job.platform_id,
                settings.MAX_PROCESSING_FRAMES,
                settings.FRAME_SAMPLE_RATE
            )

            if ml_res.get("processing_status") == "processed" and ml_res.get("person_count") is not None:
                person_count = ml_res["person_count"]
                # Store validated observation
                obs = await crowd_service.record_observation(
                    station_id=job.station_id,
                    platform_id=job.platform_id,
                    person_count=person_count,
                    source="ml_pipeline",
                    source_name="Local Video Analysis (YOLO11n)"
                )

                # Check if high/critical alert should trigger
                await alert_service.trigger_crowd_alert_if_needed(
                    station_id=job.station_id,
                    platform_id=job.platform_id,
                    station_name=station_name,
                    platform_name=platform_name,
                    crowd_level=obs.crowd_level,
                    person_count=person_count
                )

                job.status = "completed"
                job.result = {
                    "estimatedPersonCount": person_count,
                    "crowdLevel": obs.crowd_level,
                    "processingDurationSec": ml_res.get("processing_duration_sec"),
                    "sampledFrames": ml_res.get("sampled_frames"),
                    "observationId": obs.id
                }
            else:
                job.status = "failed"
                job.error = ml_res.get("error", "Video processing failed")

        except Exception as e:
            logger.error(f"Error in video worker for job {job.job_id}: {e}")
            job.status = "failed"
            job.error = str(e)
        finally:
            job.completed_at = now_iso()
            # Clean up local file after processing
            try:
                if job.video_path.exists():
                    job.video_path.unlink()
            except Exception as e:
                logger.warning(f"Failed to remove temp video file: {e}")

    def get_job_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve current status of a video processing job."""
        job = self._jobs.get(job_id)
        if not job:
            return None
        return job.to_dict()


video_service = VideoService()
