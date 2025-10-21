"""
Модели для продуктов (как в магазине)
"""
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class ProductCategory(Base):
    """Категории продуктов"""
    __tablename__ = "product_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, index=True)
    description = Column(Text)
    image_url = Column(String(500))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Связи
    products = relationship("Product", back_populates="category")


class Product(Base):
    """Продукты (как в магазине)"""
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    price = Column(Float, nullable=False)
    old_price = Column(Float)  # Старая цена для скидок
    image_url = Column(String(500))
    weight = Column(String(50))  # Вес/объем (500г, 1л, etc.)
    brand = Column(String(100))  # Бренд
    barcode = Column(String(50), unique=True, index=True)  # Штрих-код
    is_available = Column(Boolean, default=True)
    is_discount = Column(Boolean, default=False)  # Есть ли скидка
    stock_quantity = Column(Integer, default=0)  # Количество на складе
    category_id = Column(Integer, ForeignKey("product_categories.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    category = relationship("ProductCategory", back_populates="products")
    cart_items = relationship("CartItem", back_populates="product")


class CartItem(Base):
    """Элементы корзины для продуктов"""
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Связи
    user = relationship("User", back_populates="cart_items")
    product = relationship("Product", back_populates="cart_items")
