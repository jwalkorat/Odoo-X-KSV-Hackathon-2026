from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import ActivityLog
from ..schemas import ActivityLogResponse
from ..auth import get_current_user

router = APIRouter(prefix="/api/logs", tags=["Activity Logs"])

@router.get("/", response_model=List[ActivityLogResponse])
def get_logs(limit: int = 50, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Simple log fetcher
    return db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).limit(limit).all()

def log_activity(db: Session, user_id: int, action: str, entity_type: str, entity_id: Optional[int] = None, metadata_str: Optional[str] = None):
    log_entry = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        metadata_json=metadata_str
    )
    db.add(log_entry)
    db.commit()
