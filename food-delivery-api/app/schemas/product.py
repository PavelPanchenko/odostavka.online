"""
Схемы для продуктов
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class ProductCategoryBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True


class ProductCategoryCreate(ProductCategoryBase):
    pass


class ProductCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None


class ProductCategory(ProductCategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    old_price: Optional[float] = None
    image_url: Optional[str] = None
    weight: Optional[str] = Field(None, max_length=50)
    brand: Optional[str] = Field(None, max_length=100)
    barcode: Optional[str] = Field(None, max_length=50)
    is_available: bool = True
    is_discount: bool = False
    stock_quantity: int = 0
    category_id: int


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    old_price: Optional[float] = None
    image_url: Optional[str] = None
    weight: Optional[str] = None
    brand: Optional[str] = None
    barcode: Optional[str] = None
    is_available: Optional[bool] = None
    is_discount: Optional[bool] = None
    stock_quantity: Optional[int] = None
    category_id: Optional[int] = None


class Product(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[ProductCategory] = None

    class Config:
        from_attributes = True


class CartItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., ge=1)


class CartItemCreate(CartItemBase):
    pass


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=1)


class CartItem(CartItemBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    product: Optional[Product] = None

    class Config:
        from_attributes = True


class CartResponse(BaseModel):
    items: List[CartItem]
    total_items: int
    total_price: float
