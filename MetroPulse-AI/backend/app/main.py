"""MetroPulse AI - Primary FastAPI Application.

Adheres to Section 7:
- Initialized FastAPI application with lifespans, CORS, logging, and error handling.
- Implements health endpoints at both /health and /api/health.
- Registers modular routers for stations, journeys, crowd, predictions, reports, alerts, videos.
- Never leaks internal stack traces, DB credentials, or file paths in client responses.
"""

from contextlib import asynccontextmanager
import time
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.api.routes import stations, journeys, crowd, predictions, reports, alerts, videos
from app.integrations.supabase_client import supabase_manager
from app.integrations.ml_client import ml_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")
    logger.info(f"Supabase status: {'CONNECTED' if supabase_manager.is_configured else 'LOCAL PROTOTYPE MODE'}")
    logger.info(f"ML inference device: {settings.ML_DEVICE}")

    # Pre-check ML assets
    ml_client.load_prediction_models()

    yield

    # Shutdown
    logger.info(f"Shutting down {settings.APP_NAME}...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI-assisted metro platform crowd detection, short-term prediction, passenger reporting, and alert system API.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request timing & logging middleware
@app.middleware("http")
async def add_process_time_and_log(request: Request, call_next):
    start_time = time.time()
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        return response
    except Exception as exc:
        process_time = time.time() - start_time
        logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred. Please try again later."
            }
        )


# Global Exception Handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": f"HTTP_{exc.status_code}",
            "message": exc.detail
        }
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = " -> ".join([str(x) for x in err.get("loc", [])])
        msg = err.get("msg", "Invalid value")
        errors.append({"field": loc, "message": msg})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": errors
        }
    )


# Health Endpoints
@app.get("/health", tags=["Health"])
@app.get(f"{settings.API_PREFIX}/health", tags=["Health"])
async def health_check():
    """Health check endpoint exposing system status, version, and database readiness."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "supabase" if supabase_manager.is_configured else "local_store",
        "ml": {
            "device": settings.ML_DEVICE,
            "yolo": "ready" if settings.YOLO_MODEL_PATH.exists() or settings.FALLBACK_YOLO_PATH.exists() else "unloaded",
            "predictions": "ready" if len(ml_client._prediction_models) > 0 else "unloaded"
        }
    }


# Register API Routers
app.include_router(stations.router, prefix=settings.API_PREFIX)
app.include_router(journeys.router, prefix=settings.API_PREFIX)
app.include_router(crowd.router, prefix=settings.API_PREFIX)
app.include_router(predictions.router, prefix=settings.API_PREFIX)
app.include_router(reports.router, prefix=settings.API_PREFIX)
app.include_router(alerts.router, prefix=settings.API_PREFIX)
app.include_router(videos.router, prefix=settings.API_PREFIX)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
