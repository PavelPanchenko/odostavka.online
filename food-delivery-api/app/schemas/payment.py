"""
Схемы для платежей
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PaymentCreate(BaseModel):
    """Схема создания платежа"""
    order_id: int
    amount: float
    description: Optional[str] = None


class PaymentResponse(BaseModel):
    """Схема ответа с информацией о платеже"""
    id: int
    order_id: int
    yookassa_payment_id: str
    amount: float
    currency: str
    status: str
    payment_method_type: Optional[str] = None
    paid_at: Optional[datetime] = None
    description: Optional[str] = None
    confirmation_url: Optional[str] = None
    is_test: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class PaymentStatusUpdate(BaseModel):
    """Схема обновления статуса платежа (webhook)"""
    type: str
    event: str
    object: dict

