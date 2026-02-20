from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import List, Optional
from app.db import get_session
from app.models import InteractionLog

router = APIRouter(prefix="/logs", tags=["Logs"])

@router.get("/", response_model=List[InteractionLog])
def read_logs(
    lead_id: Optional[str] = None,
    agent_id: Optional[int] = None,
    session: Session = Depends(get_session),
    limit: int = 50,
    offset: int = 0
):
    query = select(InteractionLog).order_by(InteractionLog.timestamp.desc())
    
    if lead_id:
        query = query.where(InteractionLog.lead_id == lead_id)
    if agent_id:
        query = query.where(InteractionLog.agent_id == agent_id)
        
    query = query.offset(offset).limit(limit)
    return session.exec(query).all()
