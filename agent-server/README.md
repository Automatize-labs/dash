# Agent Server

AI Agent Server for WhatsApp integration via n8n.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure environment:
   Copy `.env.example` to `.env` and fill in your API keys.

3. Run server:
   ```bash
   uvicorn app.main:app --reload
   ```
