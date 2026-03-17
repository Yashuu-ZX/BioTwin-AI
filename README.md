# BioTwin AI

BioTwin AI is an end-to-end personalized medicine platform that creates a digital twin of a patient, simulates treatment strategies, explains risk drivers, and learns from real-world outcomes.

## What works

- Layer 1: patient intake form with structured medical profile creation
- Layer 2: digital twin simulation engine with treatment comparison and trajectory generation
- Layer 3: clinical dashboard with metrics, recommendations, and simulation history
- Layer 4: feedback loop that updates learning weights from actual outcomes
- Layer 5: mock EHR and wearable integrations through secure API endpoints
- Layer 6: explainable AI insights and what-if scenario analysis

## Project structure

- `frontend/` - React + Vite clinical dashboard and intake experience
- `backend/` - Express API, mock persistence, simulation services, and learning engine

## Run locally

### Backend

```bash
cd backend
npm install
npm start
```

Backend runs on `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Main API endpoints

- `POST /api/patient/intake` - create digital health profile
- `GET /api/patient/:id` - fetch patient twin
- `POST /api/simulate` - run treatment simulation
- `GET /api/simulate/:patientId/history` - fetch simulation history
- `GET /api/predict/:patientId` - baseline risk prediction
- `POST /api/learning/feedback` - submit actual outcomes
- `GET /api/learning/status` - learning engine status
- `POST /api/explain/insights` - explainable AI feature importance
- `POST /api/explain/what-if` - preventive scenario simulation
- `GET /api/external/ehr-data/:patientId` - mock EHR sync
- `POST /api/external/wearable-stream` - mock wearable ingestion

## Notes

- MongoDB is optional for local use. If it is unavailable, the backend now falls back to in-memory storage.
- Frontend API base URL defaults to `http://localhost:5000/api` and can be overridden with `VITE_API_BASE_URL`.
