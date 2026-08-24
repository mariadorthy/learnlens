
# LearnLens — Deployment

## 1. Overview

LearnLens is deployed as a web-based MVP with separate frontend and backend components.

```text
User
 ↓
React + Vite
 ↓
FastAPI Backend
 ↓
SQLite + Google GenAI
````

## 2. Frontend

The frontend is built with React + Vite and deployed on Vercel.

* Live Application: [https://learnlens-eight.vercel.app](https://learnlens-eight.vercel.app)
* Build Tool: Vite
* Communication: HTTP API requests to the backend

## 3. Backend

The backend uses FastAPI and Uvicorn.

It provides APIs for:

* Learning and assessments
* Learner attempts and progress
* Code execution
* AI-assisted analysis

The frontend backend URL is configured through environment variables.

## 4. Database

The MVP uses SQLite with SQLAlchemy.

```text
FastAPI
 ↓
SQLAlchemy
 ↓
SQLite
```

The database stores concepts, attempts, assessment results, and learning progress.

> SQLite is used for the hackathon MVP. A managed database such as PostgreSQL can be used for production scaling.

## 5. Environment Variables

The required environment variables are configured through `.env` files.

```env
GEMINI_API_KEY=
VITE_API_URL=
FRONTEND_URL=
```

Only variables required by the current implementation should be configured.

## 6. Deployment Flow

```text
GitHub Repository
 ↓
Frontend Build
 ↓
Vercel
 ↓
Live Application
 ↓
FastAPI Backend
 ↓
Database + AI Analysis
```

## 7. Deployment Status

The LearnLens MVP is deployed for hackathon demonstration and evaluation.

The deployed application demonstrates the core workflow:

```text
Learn
 ↓
Attempt
 ↓
Evidence
 ↓
Analysis
 ↓
Adapt
 ↓
Proof-of-Learn
```

Production-scale infrastructure and managed database services are considered future scope.

---