from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class DeliveryZone(BaseModel):
    name: str = Field(..., description="Название зоны")
    cost: float = Field(..., description="Стоимость доставки в зоне")
    min_order_amount: Optional[float] = Field(None, description="Минимальная сумма заказа")
    free_delivery_threshold: Optional[float] = Field(None, description="Сумма для бесплатной доставки в зоне")
    delivery_time: str = Field(..., description="Время доставки (например: '30-60 мин')")

class DayWorkingHours(BaseModel):
    enabled: bool = Field(True, description="Включен ли день")
    start: str = Field("09:00", description="Время начала работы")
    end: str = Field("22:00", description="Время окончания работы")

class WorkingHours(BaseModel):
    is24_7: bool = Field(False, description="Режим 24/7")
    days: Dict[str, DayWorkingHours] = Field(
        default_factory=lambda: {
            "monday": DayWorkingHours(),
            "tuesday": DayWorkingHours(),
            "wednesday": DayWorkingHours(),
            "thursday": DayWorkingHours(),
            "friday": DayWorkingHours(),
            "saturday": DayWorkingHours(),
            "sunday": DayWorkingHours()
        },
        description="Рабочие часы по дням недели"
    )

class DeliverySettingsBase(BaseModel):
    base_delivery_cost: float = Field(150.0, description="Базовая стоимость доставки")
    free_delivery_threshold: float = Field(2000.0, description="Сумма для бесплатной доставки")
    delivery_zones: Optional[Dict[str, Any]] = Field(None, description="Зоны доставки")
    delivery_time_min: int = Field(30, description="Минимальное время доставки")
    delivery_time_max: int = Field(60, description="Максимальное время доставки")
    is_delivery_available: bool = Field(True, description="Доступна ли доставка")
    delivery_working_hours: Optional[WorkingHours] = Field(None, description="Рабочие часы доставки")
    max_products_per_order: int = Field(50, description="Максимум товаров в заказе")

class DeliverySettingsCreate(DeliverySettingsBase):
    pass

class DeliverySettingsUpdate(BaseModel):
    base_delivery_cost: Optional[float] = None
    free_delivery_threshold: Optional[float] = None
    delivery_zones: Optional[Dict[str, Any]] = None
    delivery_time_min: Optional[int] = None
    delivery_time_max: Optional[int] = None
    is_delivery_available: Optional[bool] = None
    delivery_working_hours: Optional[WorkingHours] = None
    max_products_per_order: Optional[int] = None

class DeliverySettingsResponse(BaseModel):
    id: int
    base_delivery_cost: float
    free_delivery_threshold: float
    delivery_zones: Optional[Dict[str, Any]] = None
    delivery_time_min: int
    delivery_time_max: int
    is_delivery_available: bool
    delivery_working_hours: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    max_products_per_order: int
    
    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm(cls, obj):
        """Кастомный метод для преобразования ORM объекта в Pydantic модель"""
        data = {
            "id": obj.id,
            "base_delivery_cost": obj.base_delivery_cost,
            "free_delivery_threshold": obj.free_delivery_threshold,
            "delivery_time_min": obj.delivery_time_min,
            "delivery_time_max": obj.delivery_time_max,
            "is_delivery_available": obj.is_delivery_available,
            "created_at": obj.created_at,
            "updated_at": obj.updated_at,
            "created_by": obj.created_by,
            "max_products_per_order": getattr(obj, 'max_products_per_order', 50)
        }
        
        # Парсим JSON поля
        if obj.delivery_zones:
            try:
                import json
                zones_parsed = json.loads(obj.delivery_zones)
                # Если внезапно получили строку (двойная сериализация) — парсим ещё раз
                if isinstance(zones_parsed, str):
                    try:
                        zones_parsed = json.loads(zones_parsed)
                    except Exception:
                        pass
                data["delivery_zones"] = zones_parsed if isinstance(zones_parsed, dict) else None
            except (json.JSONDecodeError, TypeError):
                data["delivery_zones"] = None
        
        if obj.delivery_working_hours:
            try:
                import json
                wh_parsed = json.loads(obj.delivery_working_hours)
                # Если из-за прежней логики хранится строка JSON — парсим повторно
                if isinstance(wh_parsed, str):
                    try:
                        wh_parsed = json.loads(wh_parsed)
                    except Exception:
                        pass
                data["delivery_working_hours"] = wh_parsed if isinstance(wh_parsed, dict) else None
            except (json.JSONDecodeError, TypeError):
                data["delivery_working_hours"] = None
        
        return cls(**data)

class DeliveryCostCalculation(BaseModel):
    """Схема для расчета стоимости доставки"""
    order_amount: float = Field(..., description="Сумма заказа")
    delivery_zone: Optional[str] = Field(None, description="Зона доставки")
    delivery_cost: float = Field(..., description="Рассчитанная стоимость доставки")
    is_free_delivery: bool = Field(False, description="Бесплатная ли доставка")
    delivery_time: str = Field(..., description="Время доставки")
    free_delivery_threshold: Optional[float] = Field(None, description="Порог для бесплатной доставки")
