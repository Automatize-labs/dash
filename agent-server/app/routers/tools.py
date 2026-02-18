from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from typing import List
from app.db import get_session
from app.models import ToolConfig

router = APIRouter(prefix="/tools", tags=["Tools"])

@router.post("/", response_model=ToolConfig)
def create_tool(tool: ToolConfig, session: Session = Depends(get_session)):
    session.add(tool)
    session.commit()
    session.refresh(tool)
    return tool

@router.get("/", response_model=List[ToolConfig])
def read_tools(session: Session = Depends(get_session)):
    tools = session.exec(select(ToolConfig)).all()
    return tools

@router.patch("/{tool_id}", response_model=ToolConfig)
def update_tool(tool_id: int, tool_update: ToolConfig, session: Session = Depends(get_session)):
    db_tool = session.get(ToolConfig, tool_id)
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    tool_data = tool_update.model_dump(exclude_unset=True)
    for key, value in tool_data.items():
        setattr(db_tool, key, value)
        
    session.add(db_tool)
    session.commit()
    session.refresh(db_tool)
    return db_tool
