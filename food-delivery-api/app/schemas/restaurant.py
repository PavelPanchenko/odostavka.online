"""
Схемы для ресторанов и меню
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class RestaurantBase(BaseModel):
    """Базовая схема ресторана"""
    name: str
    description: Optional[str] = None
    address: str
    phone: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    delivery_fee: float = 0.0
    minimum_order: float = 0.0


class RestaurantCreate(RestaurantBase):
    """Схема для создания ресторана"""
    pass


class RestaurantUpdate(BaseModel):
    """Схема для обновления ресторана"""
    name: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    delivery_fee: Optional[float] = None
    minimum_order: Optional[float] = None
    is_active: Optional[bool] = None


class RestaurantInDB(RestaurantBase):
    """Схема ресторана в базе данных"""
    id: int
    owner_id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class Restaurant(RestaurantInDB):
    """Публичная схема ресторана"""
    pass


class CategoryBase(BaseModel):
    """Базовая схема категории"""
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    """Схема для создания категории"""
    restaurant_id: int


class CategoryUpdate(BaseModel):
    """Схема для обновления категории"""
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryInDB(CategoryBase):
    """Схема категории в базе данных"""
    id: int
    restaurant_id: int
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class Category(CategoryInDB):
    """Публичная схема категории"""
    pass


class MenuItemBase(BaseModel):
    """Базовая схема блюда"""
    name: str
    description: Optional[str] = None
    price: float
    image_url: Optional[str] = None
    preparation_time: int = 15


class MenuItemCreate(MenuItemBase):
    """Схема для создания блюда"""
    restaurant_id: int
    category_id: int


class MenuItemUpdate(BaseModel):
    """Схема для обновления блюда"""
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image_url: Optional[str] = None
    is_available: Optional[bool] = None
    preparation_time: Optional[int] = None


class MenuItemInDB(MenuItemBase):
    """Схема блюда в базе данных"""
    id: int
    restaurant_id: int
    category_id: int
    is_available: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class MenuItem(MenuItemInDB):
    """Публичная схема блюда"""
    pass
