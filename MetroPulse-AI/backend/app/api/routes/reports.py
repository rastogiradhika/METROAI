"""Passenger Reporting API routes."""

from typing import List
from fastapi import APIRouter, Query, status
from app.schemas.report import PassengerReportCreateSchema, PassengerReportSchema, ReportListResponse
from app.services.report_service import report_service


router = APIRouter(prefix="/reports", tags=["Passenger Reports"])


@router.post("", response_model=PassengerReportSchema, status_code=status.HTTP_201_CREATED)
async def submit_passenger_report(report_in: PassengerReportCreateSchema):
    """Submit a crowd observation report from a commuter."""
    report = await report_service.submit_report(report_in)
    return report


@router.get("", response_model=ReportListResponse)
async def list_passenger_reports(
    limit: int = Query(50, ge=1, le=100, description="Max reports to return")
):
    """List recent passenger crowd reports."""
    reports = await report_service.get_all_reports(limit=limit)
    return reports
