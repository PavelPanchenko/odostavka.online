"""
Схемы для избранного
"""
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from app.schemas.product import Product


class FavoriteBase(BaseModel):
    """Базовая схема избранного"""
    product_id: int


class FavoriteCreate(FavoriteBase):
    """Схема для добавления в избранное"""
    pass


class FavoriteDelete(BaseModel):
    """Схема для удаления из избранного"""
    product_id: int


class Favorite(FavoriteBase):
    """Схема избранного"""
    id: int
    user_id: int
    created_at: datetime
    product: Optional[Product] = None
    
    class Config:
        from_attributes = True


class FavoriteResponse(BaseModel):
    """Ответ со списком избранного"""
    favorites: list[Favorite]
    total: int

