"""
Схемы для пользователей
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    """Базовая схема пользователя"""
    email: EmailStr
    username: Optional[str] = None
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    telegram_user_id: Optional[str] = None


class UserCreate(BaseModel):
    """Схема для создания пользователя"""
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None


class UserUpdate(BaseModel):
    """Схема для обновления пользователя"""
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None


class AdminUserCreate(BaseModel):
    """Схема для создания пользователя администратором"""
    email: EmailStr
    password: str
    username: str
    full_name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    role: UserRole = UserRole.CUSTOMER
    is_active: bool = True


class AdminUserUpdate(BaseModel):
    """Схема для обновления пользователя администратором"""
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None  # Для смены пароля


class UserInDB(UserBase):
    """Схема пользователя в базе данных"""
    id: int
    is_active: bool
    role: UserRole
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class User(UserInDB):
    """Публичная схема пользователя"""
    pass


class UserLogin(BaseModel):
    """Схема для входа"""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Схема токена"""
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    """Схема пользователя в ответе"""
    id: int
    email: str
    username: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    telegram_user_id: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = True


class TokenResponse(BaseModel):
    """Схема ответа с токеном и пользователем"""
    access_token: str
    refresh_token: str
    token_type: str
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Схема запроса на обновление токена"""
    refresh_token: str


class TokenData(BaseModel):
    """Данные токена"""
    username: Optional[str] = None


class GoogleAuthRequest(BaseModel):
    """Схема для авторизации через Google"""
    google_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None


class GoogleRegisterRequest(BaseModel):
    """Схема для регистрации через Google"""
    google_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None


class GoogleCodeExchangeRequest(BaseModel):
    """Схема для обмена кода авторизации Google"""
    code: str
    redirect_uri: str


class RegistrationPendingResponse(BaseModel):
    """Ответ регистрации, когда требуется подтверждение email"""
    status: str  # "pending_verification"
    email: EmailStr
    expires_at: datetime
    resend_available_in: int


class EmailVerificationRequest(BaseModel):
    """Запрос на подтверждение email кодом"""
    email: EmailStr
    code: str


class EmailResendRequest(BaseModel):
    """Запрос на повторную отправку кода верификации"""
    email: EmailStr
