"""
API для аутентификации
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import (
    User,
    UserCreate,
    UserUpdate,
    UserLogin,
    Token,
    TokenResponse,
    UserResponse,
    RefreshTokenRequest,
    GoogleAuthRequest,
    GoogleRegisterRequest,
    GoogleCodeExchangeRequest,
    RegistrationPendingResponse,
    EmailVerificationRequest,
    EmailResendRequest,
)
from app.services.auth_service import AuthService
from app.models.user import UserRole
from app.core.config import settings
from pydantic import BaseModel, EmailStr

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


@router.post("/register", response_model=RegistrationPendingResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Регистрация нового пользователя"""
    auth_service = AuthService(db)
    db_user = await auth_service.create_user(user)
    return {
        "status": "pending_verification",
        "email": db_user.email,
        "expires_at": db_user.email_verification_expires_at,
        "resend_available_in": 0,
    }


@router.post("/login", response_model=TokenResponse)
async def login(user_login: UserLogin, db: Session = Depends(get_db)):
    """Вход в систему через email"""
    if settings.debug:
        print(f"🔍 Login attempt - Email: {user_login.email}, Password length: {len(user_login.password)}")
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user_by_email(user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверные учетные данные",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Для администраторов подтверждение email не требуется
    if not getattr(user, "is_email_verified", False) and user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="EMAIL_NOT_VERIFIED")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="ACCOUNT_INACTIVE")
    
    # Создаем пару токенов
    access_token, refresh_token = await auth_service.create_tokens(user)
    
    # Определяем role как строку
    role_value = user.role.value if hasattr(user.role, 'value') else str(user.role)
    if settings.debug:
        print(f"🔍 User role type: {type(user.role)}, value: {user.role}, converted: {role_value}")
    
    response_data = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "name": user.full_name,
            "full_name": user.full_name,
            "phone": user.phone,
            "address": user.address,
            "telegram_user_id": getattr(user, 'telegram_user_id', None),
            "role": role_value,
            "is_active": user.is_active,
        }
    }
    if settings.debug:
        print(f"📤 Returning response with role: {response_data['user']['role']}")
    return response_data

# ----- Password reset -----
class PasswordForgotRequest(BaseModel):
    email: EmailStr

class PasswordResetVerifyRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str


@router.post("/password/forgot")
async def password_forgot(req: PasswordForgotRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_email(req.email)
    # Не раскрываем наличие email
    if user:
        await auth_service.request_password_reset(user)
    return {"status": "ok"}


@router.post("/password/resend")
async def password_resend(req: PasswordForgotRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_email(req.email)
    if user and await auth_service.can_resend_password_reset(user):
        await auth_service.request_password_reset(user)
        return {"status": "ok"}
    return {"status": "too_soon"}


@router.post("/password/reset")
async def password_reset(req: PasswordResetVerifyRequest, db: Session = Depends(get_db)):
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_email(req.email)
    if not user:
        raise HTTPException(status_code=400, detail="INVALID_CODE")
    ok = await auth_service.verify_password_reset_code(user, req.code)
    if not ok:
        raise HTTPException(status_code=400, detail="INVALID_CODE")
    await auth_service.set_new_password(user, req.new_password)
    return {"status": "ok"}
@router.post("/email/verify")
async def verify_email(request: EmailVerificationRequest, db: Session = Depends(get_db)):
    """Подтверждение email кодом"""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_email(request.email)
    if not user:
        # Не раскрываем наличие email
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_CODE")
    ok = await auth_service.verify_email_code(user, request.code)
    if not ok:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="INVALID_CODE")
    # Успешно — выдаем токены
    access_token, refresh_token = await auth_service.create_tokens(user)
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "name": user.full_name,
            "phone": user.phone,
            "address": user.address,
            "telegram_user_id": getattr(user, 'telegram_user_id', None),
        }
    }


@router.post("/email/resend")
async def resend_verification(request: EmailResendRequest, db: Session = Depends(get_db)):
    """Повторная отправка кода подтверждения email"""
    auth_service = AuthService(db)
    user = await auth_service.get_user_by_email(request.email)
    if not user:
        # Не раскрываем наличие email
        return {"status": "ok"}
    if getattr(user, "is_email_verified", False):
        return {"status": "already_verified"}
    try:
        expires_at = await auth_service.resend_email_verification(user)
    except HTTPException as e:
        if e.status_code == 429:
            raise e
        raise HTTPException(status_code=400, detail="RESEND_FAILED")
    return {"status": "ok", "expires_at": expires_at}


@router.post("/token", response_model=Token)
async def login_oauth(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Вход в систему (OAuth2 стандарт)"""
    auth_service = AuthService(db)
    user = await auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверные учетные данные",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = await auth_service.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(AuthService.get_current_user)):
    """Получение информации о текущем пользователе"""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление профиля текущего пользователя"""
    auth_service = AuthService(db)
    updated_user = await auth_service.update_user(current_user.id, user_update)
    
    return {
        "id": updated_user.id,
        "email": updated_user.email,
        "username": updated_user.username,
        "name": updated_user.full_name,
        "phone": updated_user.phone,
        "address": updated_user.address,
        "telegram_user_id": getattr(updated_user, 'telegram_user_id', None),
    }


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(refresh_request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Обновление access токена с помощью refresh токена"""
    auth_service = AuthService(db)
    
    # Проверяем refresh токен
    user = await auth_service.verify_refresh_token(refresh_request.refresh_token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Неверный или истекший refresh токен",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Создаем новую пару токенов
    access_token, new_refresh_token = await auth_service.create_tokens(user)
    
    # Отзываем старый refresh токен
    await auth_service.revoke_refresh_token(refresh_request.refresh_token)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "name": user.full_name,
            "phone": user.phone,
            "address": user.address,
            "telegram_user_id": getattr(user, 'telegram_user_id', None),
        }
    }


@router.post("/logout")
async def logout(refresh_request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Выход из системы (отзыв refresh токена)"""
    auth_service = AuthService(db)
    await auth_service.revoke_refresh_token(refresh_request.refresh_token)
    return {"message": "Успешный выход из системы"}


@router.post("/google", response_model=TokenResponse)
async def google_auth(google_data: GoogleAuthRequest, db: Session = Depends(get_db)):
    """Авторизация через Google"""
    auth_service = AuthService(db)
    user = await auth_service.authenticate_google_user(google_data.google_id, google_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Пользователь не найден. Зарегистрируйтесь через Google.",
        )
    
    # Создаем пару токенов
    access_token, refresh_token = await auth_service.create_tokens(user)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "name": user.full_name,
            "phone": user.phone,
            "address": user.address,
        }
    }


@router.post("/google/register", response_model=TokenResponse)
async def google_register(google_data: GoogleRegisterRequest, db: Session = Depends(get_db)):
    """Регистрация через Google"""
    auth_service = AuthService(db)
    
    # Проверяем, не существует ли уже пользователь с таким email
    existing_user = await auth_service.get_user_by_email(google_data.email)
    if existing_user:
        # Если пользователь существует, но не связан с Google, связываем аккаунты
        if not existing_user.google_id:
            existing_user.google_id = google_data.google_id
            existing_user.google_picture = google_data.picture
            db.commit()
            db.refresh(existing_user)
            
            # Создаем токены для существующего пользователя
            access_token, refresh_token = await auth_service.create_tokens(existing_user)
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "id": existing_user.id,
                    "email": existing_user.email,
                    "username": existing_user.username,
                    "name": existing_user.full_name,
                    "phone": existing_user.phone,
                    "address": existing_user.address,
                }
            }
        else:
            # Пользователь уже связан с Google, авторизуем его
            access_token, refresh_token = await auth_service.create_tokens(existing_user)
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "user": {
                    "id": existing_user.id,
                    "email": existing_user.email,
                    "username": existing_user.username,
                    "name": existing_user.full_name,
                    "phone": existing_user.phone,
                    "address": existing_user.address,
                }
            }
    
    # Создаем нового пользователя
    user = await auth_service.create_google_user(google_data)
    
    # Создаем пару токенов для нового пользователя
    access_token, refresh_token = await auth_service.create_tokens(user)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "name": user.full_name,
            "phone": user.phone,
            "address": user.address,
        }
    }
