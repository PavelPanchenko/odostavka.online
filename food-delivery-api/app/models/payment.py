"""
Модели платежей
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.database import Base


class Payment(Base):
    """Модель платежа"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    
    # ЮKassa данные
    yookassa_payment_id = Column(String, unique=True, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="RUB")
    status = Column(String, nullable=False)  # pending, waiting_for_capture, succeeded, canceled
    
    # Метаданные
    payment_method_type = Column(String, nullable=True)  # bank_card, yoo_money, qiwi, etc.
    paid_at = Column(DateTime(timezone=True), nullable=True)
    
    # Дополнительная информация
    description = Column(Text, nullable=True)
    confirmation_url = Column(Text, nullable=True)  # URL для оплаты
    
    # Технические поля
    is_test = Column(Boolean, default=False)  # Тестовый платёж или реальный
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Связи
    order = relationship("Order", backref="payments")

