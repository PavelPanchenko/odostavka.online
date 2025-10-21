from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.db.database import Base

class DeliverySettings(Base):
    __tablename__ = "delivery_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Основные настройки стоимости
    base_delivery_cost = Column(Float, default=150.0, comment="Базовая стоимость доставки")
    free_delivery_threshold = Column(Float, default=2000.0, comment="Сумма заказа для бесплатной доставки")
    
    # Зональная доставка
    delivery_zones = Column(Text, comment="JSON с зонами доставки и их стоимостью")
    
    # Время доставки
    delivery_time_min = Column(Integer, default=30, comment="Минимальное время доставки (минуты)")
    delivery_time_max = Column(Integer, default=60, comment="Максимальное время доставки (минуты)")
    
    # Дополнительные настройки
    is_delivery_available = Column(Boolean, default=True, comment="Доступна ли доставка")
    delivery_working_hours = Column(Text, comment="JSON с рабочими часами доставки")
    max_products_per_order = Column(Integer, default=50, comment="Максимум товаров в заказе")
    
    # Метаданные
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    created_by = Column(Integer, comment="ID администратора, создавшего настройку")
    
    def __repr__(self):
        return f"<DeliverySettings(id={self.id}, base_cost={self.base_delivery_cost})>"
