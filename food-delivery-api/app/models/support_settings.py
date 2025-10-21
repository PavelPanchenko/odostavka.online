from sqlalchemy import Column, Integer, String, Boolean
from app.db.database import Base


class SupportSettings(Base):
    """Настройки поддержки и контактной информации"""
    __tablename__ = "support_settings"

    id = Column(Integer, primary_key=True, index=True)
    telegram_username = Column(String, nullable=False, comment="Username Telegram бота/канала поддержки")
    telegram_link = Column(String, nullable=False, comment="Полная ссылка на Telegram")
    support_phone = Column(String, nullable=True, comment="Телефон поддержки")
    support_email = Column(String, nullable=True, comment="Email поддержки")
    working_hours = Column(String, nullable=True, comment="Время работы (например: 'ежедневно с 8:00 до 23:00')")
    company_name = Column(String, nullable=True, comment="Название компании")
    company_address = Column(String, nullable=True, comment="Адрес компании")
    privacy_email = Column(String, nullable=True, comment="Email для вопросов по персональным данным")
    is_active = Column(Boolean, default=True, comment="Активность настроек")
    description = Column(String, nullable=True, comment="Описание для админов")

