"""
Модели пользователей
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class UserRole(str, enum.Enum):
    """Роли пользователей"""
    CUSTOMER = "customer"
    RESTAURANT_OWNER = "restaurant_owner"
    COURIER = "courier"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(Base):
    """Модель пользователя"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Может быть None для Google OAuth
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    # Подтверждение email
    is_email_verified = Column(Boolean, default=False)
    email_verification_code_hash = Column(String, nullable=True)
    email_verification_expires_at = Column(DateTime(timezone=True), nullable=True)
    email_verification_last_sent_at = Column(DateTime(timezone=True), nullable=True)
    email_verification_attempts = Column(Integer, default=0)
    role = Column(Enum(UserRole), default=UserRole.CUSTOMER)
    # Google OAuth поля
    google_id = Column(String, nullable=True, unique=True, index=True)
    google_picture = Column(String, nullable=True)
    # Telegram связь (необязательная)
    telegram_user_id = Column(String, nullable=True, index=True)
    # Онлайн-флаги для оповещений
    is_admin_online = Column(Boolean, default=False)
    is_courier_online = Column(Boolean, default=False)
    # Поля сброса пароля
    password_reset_code_hash = Column(String, nullable=True)
    password_reset_expires_at = Column(DateTime(timezone=True), nullable=True)
    password_reset_last_sent_at = Column(DateTime(timezone=True), nullable=True)
    password_reset_attempts = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    restaurants = relationship("Restaurant", back_populates="owner")
    cart_items = relationship("CartItem", back_populates="user")
    refresh_tokens = relationship("RefreshToken", back_populates="user")
