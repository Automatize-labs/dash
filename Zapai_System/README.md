# Zapai System

This is the standalone repository for the Zapai System, separated from the generic agent framework.

## Directory Structure

- **`zapai-dashboard/`**: The Next.js Frontend Dashboard.
- **`agent-server/`**: The local Python API Server (FastAPI).
- **`src/`**: Core Python logic, including the Orchestrator and Agent Engine.
- **`control-panel/`**: Legacy dashboard files (kept for reference).
- **`modal_app.py`**: The entry point for deploying the agent backend to Modal.com.

## specific Files

- `*.py`: Various utility scripts for database inspection, debugging, and testing.
- `*.sql`: Database setup and update scripts.

## Getting Started

### Dashboard
1. Navigate to `zapai-dashboard`.
2. Run `npm install` (if moving to a new machine).
3. Run `npm run dev` to start the local development server.

### Backend (Local)
1. Navigate to `agent-server`.
2. Ensure you have a virtual environment set up.
3. Install dependencies: `pip install -r ../requirements.txt`.
4. Run the server (refer to `agent-server/README.md`).

### Deployment
- **Frontend**: Deploy `zapai-dashboard` to Vercel/Netlify.
- **Backend**: Deploy using `modal deploy modal_app.py`.
