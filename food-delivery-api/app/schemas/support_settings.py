from pydantic import BaseModel, Field
from typing import Optional


class SupportSettingsBase(BaseModel):
    """Базовая схема настроек поддержки и контактной информации"""
    telegram_username: str = Field(..., description="Username Telegram бота/канала")
    telegram_link: str = Field(..., description="Полная ссылка на Telegram")
    support_phone: Optional[str] = Field(None, description="Телефон поддержки")
    support_email: Optional[str] = Field(None, description="Email поддержки")
    working_hours: Optional[str] = Field(None, description="Время работы")
    company_name: Optional[str] = Field(None, description="Название компании")
    company_address: Optional[str] = Field(None, description="Адрес компании")
    privacy_email: Optional[str] = Field(None, description="Email для вопросов по персональным данным")
    is_active: bool = Field(True, description="Активность настроек")
    description: Optional[str] = Field(None, description="Описание для админов")


class SupportSettingsCreate(SupportSettingsBase):
    """Схема для создания настроек поддержки"""
    pass


class SupportSettingsUpdate(BaseModel):
    """Схема для обновления настроек поддержки"""
    telegram_username: Optional[str] = None
    telegram_link: Optional[str] = None
    support_phone: Optional[str] = None
    support_email: Optional[str] = None
    working_hours: Optional[str] = None
    company_name: Optional[str] = None
    company_address: Optional[str] = None
    privacy_email: Optional[str] = None
    is_active: Optional[bool] = None
    description: Optional[str] = None


class SupportSettingsResponse(SupportSettingsBase):
    """Схема ответа с настройками поддержки"""
    id: int

    class Config:
        from_attributes = True

