"""
Agent Logs API for flow visualization.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from app.database import get_db
from app.models import AgentLog, User
from app.api.auth import get_active_user

router = APIRouter(prefix="/api/agents", tags=["agents"])


class AgentLogResponse(BaseModel):
    id: int
    run_id: str
    agent_name: str
    model_used: str
    input_summary: Optional[str]
    output_summary: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    duration_ms: Optional[int]
    status: str
    error_message: Optional[str]
    parent_log_id: Optional[int]
    sequence_order: int
    
    class Config:
        from_attributes = True


class FlowRunResponse(BaseModel):
    run_id: str
    started_at: datetime
    total_duration_ms: int
    agent_count: int
    status: str
    agents: List[AgentLogResponse]


class ModelConfigResponse(BaseModel):
    agent_type: str
    model: str
    provider: str


def _scoped_query(db: Session, current_user: Optional[User]):
    """Return an AgentLog query scoped to the current user."""
    query = db.query(AgentLog)
    if current_user:
        query = query.filter(AgentLog.user_id == current_user.id)
    return query


@router.get("/logs", response_model=List[AgentLogResponse])
def get_agent_logs(
    limit: int = 50,
    agent_name: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_active_user),
):
    """Get recent agent execution logs."""
    query = _scoped_query(db, current_user)
    
    if agent_name:
        query = query.filter(AgentLog.agent_name == agent_name)
    if status:
        query = query.filter(AgentLog.status == status)
    
    logs = query.order_by(desc(AgentLog.started_at)).limit(limit).all()
    return logs


@router.get("/flows", response_model=List[FlowRunResponse])
def get_flow_runs(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_active_user),
):
    """Get grouped flow runs (each run_id is a flow)."""
    base_query = _scoped_query(db, current_user)
    
    # Get unique run_ids with aggregated data
    subquery = base_query.with_entities(
        AgentLog.run_id,
        func.min(AgentLog.started_at).label("started_at"),
        func.sum(AgentLog.duration_ms).label("total_duration_ms"),
        func.count(AgentLog.id).label("agent_count")
    ).group_by(AgentLog.run_id).order_by(
        desc(func.min(AgentLog.started_at))
    ).limit(limit).subquery()
    
    runs = db.query(subquery).all()
    
    result = []
    for run in runs:
        agents_query = db.query(AgentLog).filter(AgentLog.run_id == run.run_id)
        if current_user:
            agents_query = agents_query.filter(AgentLog.user_id == current_user.id)
        agents = agents_query.order_by(AgentLog.sequence_order, AgentLog.started_at).all()
        
        statuses = [a.status for a in agents]
        if "error" in statuses:
            overall_status = "error"
        elif "running" in statuses or "pending" in statuses:
            overall_status = "running"
        else:
            overall_status = "success"
        
        result.append(FlowRunResponse(
            run_id=run.run_id,
            started_at=run.started_at,
            total_duration_ms=run.total_duration_ms or 0,
            agent_count=run.agent_count,
            status=overall_status,
            agents=[AgentLogResponse.model_validate(a) for a in agents]
        ))
    
    return result


@router.get("/flows/{run_id}", response_model=FlowRunResponse)
def get_flow_run(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_active_user),
):
    """Get details of a specific flow run."""
    query = db.query(AgentLog).filter(AgentLog.run_id == run_id)
    if current_user:
        query = query.filter(AgentLog.user_id == current_user.id)
    
    agents = query.order_by(AgentLog.sequence_order, AgentLog.started_at).all()
    
    if not agents:
        return {"error": "Run not found"}
    
    total_duration = sum(a.duration_ms or 0 for a in agents)
    statuses = [a.status for a in agents]
    
    if "error" in statuses:
        overall_status = "error"
    elif "running" in statuses or "pending" in statuses:
        overall_status = "running"
    else:
        overall_status = "success"
    
    return FlowRunResponse(
        run_id=run_id,
        started_at=agents[0].started_at,
        total_duration_ms=total_duration,
        agent_count=len(agents),
        status=overall_status,
        agents=[AgentLogResponse.model_validate(a) for a in agents]
    )


@router.get("/config", response_model=List[ModelConfigResponse])
def get_model_config():
    """Get current model configuration for each agent type."""
    from app.services.ai_engine import MODEL_CONFIG
    
    return [
        ModelConfigResponse(
            agent_type=agent,
            model=model,
            provider=model.split("/")[0]
        )
        for agent, model in MODEL_CONFIG.items()
    ]


@router.get("/stats")
def get_agent_stats(
    days: int = 7,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_active_user),
):
    """Get agent execution statistics."""
    since = datetime.utcnow() - timedelta(days=days)
    
    base = _scoped_query(db, current_user).filter(AgentLog.started_at >= since)
    
    total_runs = db.query(func.count(func.distinct(AgentLog.run_id))).select_from(
        base.subquery()
    ).scalar()
    
    # Re-create scoped + filtered queries for each stat
    def scoped_since():
        q = _scoped_query(db, current_user).filter(AgentLog.started_at >= since)
        return q
    
    agent_counts = scoped_since().with_entities(
        AgentLog.agent_name,
        func.count(AgentLog.id).label("count")
    ).group_by(AgentLog.agent_name).all()
    
    success_count = scoped_since().filter(AgentLog.status == "success").count()
    total_executions = scoped_since().count()
    
    avg_durations = scoped_since().filter(
        AgentLog.status == "success"
    ).with_entities(
        AgentLog.agent_name,
        func.avg(AgentLog.duration_ms).label("avg_ms")
    ).group_by(AgentLog.agent_name).all()
    
    return {
        "period_days": days,
        "total_runs": total_runs,
        "total_executions": total_executions,
        "success_rate": round(success_count / total_executions * 100, 1) if total_executions > 0 else 0,
        "by_agent": {agent: count for agent, count in agent_counts},
        "avg_duration_ms": {agent: round(avg or 0) for agent, avg in avg_durations}
    }
