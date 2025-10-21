"""
Конфигурация приложения
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Настройки приложения"""
    
    # Основные настройки
    app_name: str = "Food Delivery API"
    app_version: str = "0.1.0"
    debug: bool = False
    
    # База данных
    database_url: str = "sqlite:///./food_delivery.db"
    
    # Redis
    redis_url: str = "redis://localhost:6379"
    
    # JWT
    secret_key: str = "5b22331028cc079a3ecfdb79796ddb3a324c24dfc9f17085a245c254a54e677c"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    
    # CORS (настраивается через переменные окружения)
    allowed_origins: list[str] = [
            "http://localhost:3000",  # Локальная разработка
            "https://odostavka-admin.vercel.app"  # Админка на Vercel
        ]
    
    # Дополнительные CORS origins из переменных окружения
    additional_cors_origins: Optional[str] = None
    # Альтернативное название: allowed_domains    
    # API настройки
    api_v1_prefix: str = "/api/v1"

    # SMTP / Email
    smtp_host: Optional[str] = None
    smtp_port: int = 587
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    smtp_from: Optional[str] = None
    smtp_use_tls: bool = True
    smtp_use_ssl: bool = False

    # Email verification settings
    verification_code_ttl_minutes: int = 15
    verification_resend_interval_seconds: int = 60
    verification_max_attempts_per_code: int = 5

    # Telegram bot tokens (optional)
    telegram_client_bot_token: Optional[str] = None
    telegram_courier_bot_token: Optional[str] = None
    telegram_admin_bot_token: Optional[str] = None
    
    def get_allowed_origins(self) -> list[str]:
        """Получить полный список разрешенных CORS origins"""
        origins = self.allowed_origins.copy()
        
        # Добавляем дополнительные origins из переменных окружения
        if self.additional_cors_origins:
            additional_origins = [origin.strip() for origin in self.additional_cors_origins.split(',')]
            origins.extend(additional_origins)
        
        return origins
    
    class Config:
        env_file = ".env"


settings = Settings()
