from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.auth import get_current_user
from app.models import User
from app.schemas import Notification
from app.crud import (
    get_user_notifications, mark_notification_as_read, get_unread_notification_count
)

router = APIRouter()


@router.get("/", response_model=List[Notification])
async def get_my_notifications(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get user notifications
    """
    notifications = get_user_notifications(db, current_user.id, skip=skip, limit=limit)
    return notifications


@router.get("/unread-count")
async def get_unread_notifications_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get count of unread notifications
    """
    count = get_unread_notification_count(db, current_user.id)
    return {"unread_count": count}


@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark notification as read
    """
    notification = mark_notification_as_read(db, notification_id, current_user.id)
    if notification:
        return {"message": "Notification marked as read"}
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Notification not found"
    )


@router.put("/mark-all-read")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications as read
    """
    # This would be implemented in crud.py
    from sqlalchemy import update
    from app.models import Notification
    
    db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    db.commit()
    
    return {"message": "All notifications marked as read"}
