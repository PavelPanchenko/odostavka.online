"""
Схемы для заказов
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class OrderItemBase(BaseModel):
    """Базовая схема позиции заказа"""
    product_id: int
    quantity: int
    price: float


class OrderItemCreate(BaseModel):
    """Схема для создания позиции заказа"""
    product_id: int
    quantity: int


class OrderItemResponse(BaseModel):
    """Схема позиции заказа в ответе"""
    id: int
    product_id: int
    quantity: int
    price: float
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    
    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    """Базовая схема заказа"""
    delivery_address: str
    delivery_phone: str
    notes: Optional[str] = None


class OrderCreate(OrderBase):
    """Схема для создания заказа"""
    items: List[OrderItemCreate]


class OrderUpdate(BaseModel):
    """Схема для обновления заказа"""
    status: Optional[str] = None
    notes: Optional[str] = None


class OrderItemUpdate(BaseModel):
    """Схема для обновления позиции заказа"""
    id: Optional[int] = None  # Если None, то новая позиция
    product_id: int
    quantity: int
    price: Optional[float] = None  # Если None, берется текущая цена продукта


class OrderItemsUpdate(BaseModel):
    """Схема для обновления товаров в заказе"""
    items: List[OrderItemUpdate]


class OrderResponse(BaseModel):
    """Публичная схема заказа"""
    id: int
    user_id: int
    status: str
    total_amount: float
    delivery_address: str
    delivery_phone: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []
    
    class Config:
        from_attributes = True


class OrderListResponse(BaseModel):
    """Ответ со списком заказов"""
    orders: List[OrderResponse]
    total: int
