from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.db import get_session
from app.models import AgentConfig

router = APIRouter(prefix="/agents", tags=["Agents"])

@router.post("/", response_model=AgentConfig)
def create_agent(agent: AgentConfig, session: Session = Depends(get_session)):
    session.add(agent)
    session.commit()
    session.refresh(agent)
    return agent

@router.get("/", response_model=List[AgentConfig])
def read_agents(session: Session = Depends(get_session)):
    agents = session.exec(select(AgentConfig)).all()
    return agents

@router.get("/{agent_id}", response_model=AgentConfig)
def read_agent(agent_id: int, session: Session = Depends(get_session)):
    agent = session.get(AgentConfig, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.patch("/{agent_id}", response_model=AgentConfig)
def update_agent(agent_id: int, agent_update: AgentConfig, session: Session = Depends(get_session)):
    db_agent = session.get(AgentConfig, agent_id)
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    agent_data = agent_update.model_dump(exclude_unset=True)
    for key, value in agent_data.items():
        setattr(db_agent, key, value)
        
    session.add(db_agent)
    session.commit()
    session.refresh(db_agent)
    return db_agent

@router.delete("/{agent_id}")
def delete_agent(agent_id: int, session: Session = Depends(get_session)):
    agent = session.get(AgentConfig, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    session.delete(agent)
    session.commit()
    return {"ok": True}
