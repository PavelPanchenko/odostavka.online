from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.delivery_service import DeliveryService
from app.schemas.delivery_settings import (
    DeliverySettingsResponse, 
    DeliverySettingsUpdate,
    DeliveryCostCalculation
)
from app.core.config import settings
from typing import Optional

router = APIRouter()

@router.get("/delivery/settings", response_model=DeliverySettingsResponse)
async def get_delivery_settings(db: Session = Depends(get_db)):
    """Получить текущие настройки доставки"""
    delivery_service = DeliveryService(db)
    settings = delivery_service.get_delivery_settings()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки доставки не найдены"
        )
    
    return DeliverySettingsResponse.from_orm(settings)

@router.get("/delivery/calculate")
async def calculate_delivery_cost(
    order_amount: float,
    delivery_zone: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Рассчитать стоимость доставки для заказа"""
    delivery_service = DeliveryService(db)
    
    if order_amount < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Сумма заказа не может быть отрицательной"
        )
    
    return delivery_service.calculate_delivery_cost(order_amount, delivery_zone)

@router.get("/delivery/available")
async def check_delivery_availability(db: Session = Depends(get_db)):
    """Проверить доступность доставки"""
    delivery_service = DeliveryService(db)
    
    return {
        "is_available": delivery_service.is_delivery_available_now(),
        "zones": delivery_service.get_delivery_zones()
    }

@router.get("/delivery/zones")
async def get_delivery_zones(db: Session = Depends(get_db)):
    """Получить доступные зоны доставки"""
    delivery_service = DeliveryService(db)
    zones = delivery_service.get_delivery_zones()
    
    return {"zones": zones}

@router.get("/delivery/working-hours")
async def get_delivery_working_hours(db: Session = Depends(get_db)):
    """Получить рабочие часы доставки"""
    delivery_service = DeliveryService(db)
    settings = delivery_service.get_delivery_settings()
    
    if not settings:
        return {"is24_7": False, "days": {}}
    
    if settings.delivery_working_hours:
        try:
            import json
            working_hours = json.loads(settings.delivery_working_hours)
            return working_hours
        except (json.JSONDecodeError, TypeError):
            pass
    
    return {"is24_7": False, "days": {}}

@router.put("/delivery/working-hours")
async def update_delivery_working_hours(
    working_hours_data: dict,
    db: Session = Depends(get_db)
):
    """Обновить рабочие часы доставки"""
    delivery_service = DeliveryService(db)
    
    # Получаем текущие настройки
    settings = delivery_service.get_delivery_settings()
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки доставки не найдены"
        )
    
    # Обновляем рабочие часы
    # Передаём dict — сериализация произойдёт в сервисе, избегаем двойного JSON
    updated_settings = delivery_service.update_delivery_settings(
        {"delivery_working_hours": working_hours_data},
        admin_id=1  # Временно хардкод
    )
    
    return {"message": "Рабочие часы обновлены", "working_hours": working_hours_data}

# Удален legacy-эндпоинт /delivery/availability; используйте /delivery/available
