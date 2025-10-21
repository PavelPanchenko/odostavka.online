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
    
    # Robokassa (для тестирования)
    # Тестовая среда с демо-магазином
    robokassa_merchant_login: str = "demo"  # Тестовый магазин
    robokassa_password1: str = "password_1"  # Пароль #1
    robokassa_password2: str = "password_2"  # Пароль #2
    robokassa_test_mode: bool = True  # Тестовый режим
    robokassa_result_url: str = "http://localhost:8000/api/v1/payments/robokassa-result"  # URL для уведомлений
    robokassa_success_url: str = "http://localhost:3000/orders"  # URL успешной оплаты
    robokassa_fail_url: str = "http://localhost:3000/orders"  # URL отмены оплаты
    
    # CORS
    allowed_origins: list[str] = [
            "https://odostavka.online", 
            "https://api.odostavka.online", 
            "https://odostavka-admin.vercel.app"
        ]    
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
    
    class Config:
        env_file = ".env"


settings = Settings()
