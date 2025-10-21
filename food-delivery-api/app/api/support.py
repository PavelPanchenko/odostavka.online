from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.db.database import get_db
from app.models.support_settings import SupportSettings
from app.schemas.support_settings import (
    SupportSettingsResponse,
    SupportSettingsCreate,
    SupportSettingsUpdate
)

router = APIRouter(prefix="/support", tags=["support"])


@router.get("/settings", response_model=SupportSettingsResponse)
def get_support_settings(db: Session = Depends(get_db)):
    """
    Получить активные настройки поддержки
    """
    settings = db.query(SupportSettings).filter(
        SupportSettings.is_active == True
    ).first()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Настройки поддержки не найдены")
    
    return settings


@router.post("/settings", response_model=SupportSettingsResponse)
def create_support_settings(
    settings_data: SupportSettingsCreate,
    db: Session = Depends(get_db)
):
    """
    Создать настройки поддержки (только для админов)
    """
    # Деактивировать все предыдущие настройки
    db.query(SupportSettings).update({"is_active": False})
    
    # Создать новые настройки
    new_settings = SupportSettings(**settings_data.model_dump())
    db.add(new_settings)
    db.commit()
    db.refresh(new_settings)
    
    return new_settings


@router.put("/settings/{settings_id}", response_model=SupportSettingsResponse)
def update_support_settings(
    settings_id: int,
    settings_data: SupportSettingsUpdate,
    db: Session = Depends(get_db)
):
    """
    Обновить настройки поддержки (только для админов)
    """
    settings = db.query(SupportSettings).filter(
        SupportSettings.id == settings_id
    ).first()
    
    if not settings:
        raise HTTPException(status_code=404, detail="Настройки не найдены")
    
    # Обновить только переданные поля
    update_data = settings_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    
    return settings


@router.get("/settings/all", response_model=list[SupportSettingsResponse])
def get_all_support_settings(db: Session = Depends(get_db)):
    """
    Получить все настройки поддержки (для админов)
    """
    return db.query(SupportSettings).all()

