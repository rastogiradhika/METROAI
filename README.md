# METROAI

## AI-Assisted Metro Platform Crowd Detection, Short-Term Prediction, Passenger Reporting & Alert System

MetroPulse AI is an integrated platform designed for commuter guidance and transit operations:
- **Backend**: FastAPI REST API with Pydantic v2 schemas and modular service architecture (`MetroPulse-AI/backend`).
- **Frontend**: Passenger Dashboard & Admin Operations Portal built with React, TypeScript, and Vite (`MetroPulse-AI/frontend`).
- **ML Detection**: Ultralytics YOLO11 model integration for person detection and crowd estimation (`MetroPulse-AI/ml` & `metro-ai`).
- **ML Prediction**: Scikit-Learn Random Forest and Linear Regression models for 5, 10, and 15-minute crowd forecasts (`MetroPulse-AI/ml/trained_models`).
- **Static & GTFS Data**: Delhi Metro static stations, routes, and DMRC accessibility pathways (`MetroPulse-AI/data`).

### Quick Start

#### 1. Backend Server
```bash
cd MetroPulse-AI/backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
Interactive docs at http://127.0.0.1:8000/docs

#### 2. Frontend Dashboard
```bash
cd MetroPulse-AI/frontend
npm install
npm run dev
```
Accessible at http://127.0.0.1:5173/user/home
