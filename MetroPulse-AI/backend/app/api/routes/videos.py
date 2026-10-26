"""Video Processing and CCTV Analysis API routes."""

from typing import Dict, Any
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.services.video_service import video_service
from app.utils.validation import validate_identifier


router = APIRouter(prefix="/videos", tags=["Video Processing"])


@router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_video_for_analysis(
    file: UploadFile = File(...),
    station_id: str = Form(..., alias="stationId"),
    platform_id: str = Form(..., alias="platformId")
):
    """Upload a recorded metro platform video stream for bounded YOLO crowd estimation."""
    clean_sid = validate_identifier(station_id, "station_id")
    clean_pid = validate_identifier(platform_id, "platform_id")

    job = await video_service.create_upload_job(
        file=file,
        station_id=clean_sid,
        platform_id=clean_pid
    )

    return {
        "status": "queued",
        "jobId": job.job_id,
        "message": "Video accepted and queued for AI crowd analysis.",
        "pollUrl": f"/api/videos/{job.job_id}"
    }


@router.get("/{job_id}")
async def get_video_job_status(job_id: str):
    """Check processing status and crowd count result for an uploaded video."""
    clean_jid = validate_identifier(job_id, "job_id")
    job_info = video_service.get_job_status(clean_jid)
    if not job_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Video processing job '{job_id}' was not found."
        )
    return job_info
