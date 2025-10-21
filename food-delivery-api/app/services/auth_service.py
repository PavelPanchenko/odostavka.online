"""
Сервис аутентификации
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
import hashlib
import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.schemas.user import UserCreate, UserUpdate, TokenData, GoogleAuthRequest, GoogleRegisterRequest
from app.services.email_service import EmailService

# Настройка хеширования паролей (используем bcrypt для совместимости)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Настройка OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


class AuthService:
    def __init__(self, db: Session):
        self.db = db
        self.email_service = EmailService()

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Проверка пароля"""
        # Используем bcrypt напрямую для избежания проблем с passlib
        import bcrypt
        try:
            password_bytes = plain_password.encode('utf-8')
            hash_bytes = hashed_password.encode('utf-8')
            return bcrypt.checkpw(password_bytes, hash_bytes)
        except Exception as e:
            print(f"⚠️ Password verification error: {e}")
            return False

    def get_password_hash(self, password: str) -> str:
        """Хеширование пароля"""
        # Используем bcrypt напрямую для избежания проблем с passlib
        import bcrypt
        password_bytes = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password_bytes, salt)
        return hashed.decode('utf-8')

    async def get_user(self, username: str) -> Optional[User]:
        """Получение пользователя по имени"""
        return self.db.query(User).filter(User.username == username).first()

    async def get_user_by_email(self, email: str) -> Optional[User]:
        """Получение пользователя по email"""
        return self.db.query(User).filter(User.email == email).first()

    async def authenticate_user(self, username: str, password: str) -> Optional[User]:
        """Аутентификация пользователя по username"""
        user = await self.get_user(username)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    async def authenticate_user_by_email(self, email: str, password: str) -> Optional[User]:
        """Аутентификация пользователя по email"""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user.hashed_password):
            return None
        return user

    # ----- Email verification helpers -----
    def _generate_verification_code(self) -> str:
        """Генерирует 6-значный код"""
        return f"{secrets.randbelow(1000000):06d}"

    def _hash_code(self, code: str) -> str:
        """Хеширует код через bcrypt (как пароль)"""
        return self.get_password_hash(code)

    async def request_email_verification(self, user: User) -> datetime:
        """Создает новый код подтверждения, сохраняет и отправляет письмо"""
        code = self._generate_verification_code()
        user.email_verification_code_hash = self._hash_code(code)
        user.email_verification_expires_at = datetime.utcnow() + timedelta(minutes=settings.verification_code_ttl_minutes)
        user.email_verification_last_sent_at = datetime.utcnow()
        user.email_verification_attempts = 0
        self.db.commit()
        try:
            self.email_service.send_verification_code(user.email, code)
        except Exception as e:
            # В DEV-режиме логируем код, чтобы упростить ручное подтверждение
            if settings.debug:
                print(f"⚠️ Email send error: {e} | DEV VERIFICATION_CODE={code} | email={user.email}")
            else:
                print(f"⚠️ Email send error: {e}")
        return user.email_verification_expires_at  # type: ignore

    def _can_resend(self, user: User) -> bool:
        if not user.email_verification_last_sent_at:
            return True
        delta = datetime.utcnow() - user.email_verification_last_sent_at
        return delta.total_seconds() >= settings.verification_resend_interval_seconds

    async def resend_email_verification(self, user: User) -> datetime:
        if not self._can_resend(user):
            raise HTTPException(status_code=429, detail="Слишком часто. Попробуйте позже.")
        return await self.request_email_verification(user)

    async def verify_email_code(self, user: User, code: str) -> bool:
        if not user.email_verification_code_hash or not user.email_verification_expires_at:
            return False
        if user.email_verification_expires_at < datetime.utcnow():
            return False
        # Лимит попыток
        max_attempts = settings.verification_max_attempts_per_code
        if user.email_verification_attempts is not None and user.email_verification_attempts >= max_attempts:
            return False
        # Увеличиваем счетчик попыток
        user.email_verification_attempts = (user.email_verification_attempts or 0) + 1
        self.db.commit()

        # Проверяем код
        is_valid = self.verify_password(code, user.email_verification_code_hash)
        if not is_valid:
            return False

        # Успех — подтверждаем почту и очищаем поля
        user.is_email_verified = True
        user.is_active = True
        user.email_verification_code_hash = None
        user.email_verification_expires_at = None
        user.email_verification_last_sent_at = None
        user.email_verification_attempts = 0
        self.db.commit()
        self.db.refresh(user)
        return True

    # ----- Password reset helpers -----
    async def request_password_reset(self, user: User) -> None:
        """Создает или обновляет код сброса пароля и отправляет письмо"""
        code = self._generate_verification_code()
        user.password_reset_code_hash = self._hash_code(code)
        user.password_reset_expires_at = datetime.utcnow() + timedelta(minutes=settings.verification_code_ttl_minutes)
        user.password_reset_last_sent_at = datetime.utcnow()
        user.password_reset_attempts = 0
        self.db.commit()
        try:
            self.email_service.send_password_reset_code(user.email, code)
        except Exception as e:
            print(f"⚠️ Password reset email error: {e}")

    async def can_resend_password_reset(self, user: User) -> bool:
        if not user.password_reset_last_sent_at:
            return True
        delta = datetime.utcnow() - user.password_reset_last_sent_at
        return delta.total_seconds() >= settings.verification_resend_interval_seconds

    async def verify_password_reset_code(self, user: User, code: str) -> bool:
        if not user.password_reset_code_hash or not user.password_reset_expires_at:
            return False
        if user.password_reset_expires_at < datetime.utcnow():
            return False
        max_attempts = settings.verification_max_attempts_per_code
        if user.password_reset_attempts is not None and user.password_reset_attempts >= max_attempts:
            return False
        user.password_reset_attempts = (user.password_reset_attempts or 0) + 1
        self.db.commit()
        return self.verify_password(code, user.password_reset_code_hash)

    async def set_new_password(self, user: User, new_password: str) -> None:
        hashed_password = self.get_password_hash(new_password)
        user.hashed_password = hashed_password
        # очищаем поля сброса
        user.password_reset_code_hash = None
        user.password_reset_expires_at = None
        user.password_reset_last_sent_at = None
        user.password_reset_attempts = 0
        self.db.commit()

    async def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Создание токена доступа"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
        return encoded_jwt

    async def create_refresh_token(self, user_id: int) -> str:
        """Создание refresh токена"""
        # Генерируем случайный токен
        token = secrets.token_urlsafe(32)
        
        # Удаляем старые refresh токены пользователя (опционально, можно хранить несколько)
        self.db.query(RefreshToken).filter(
            RefreshToken.user_id == user_id,
            RefreshToken.is_revoked == False
        ).update({"is_revoked": True})
        
        # Создаем новый refresh токен
        expires_at = datetime.utcnow() + timedelta(days=30)  # 30 дней
        db_token = RefreshToken(
            token=token,
            user_id=user_id,
            expires_at=expires_at
        )
        self.db.add(db_token)
        self.db.commit()
        
        return token

    async def verify_refresh_token(self, token: str) -> Optional[User]:
        """Проверка refresh токена"""
        db_token = self.db.query(RefreshToken).filter(
            RefreshToken.token == token,
            RefreshToken.is_revoked == False
        ).first()
        
        if not db_token:
            return None
        
        # Проверяем срок действия
        if db_token.expires_at < datetime.utcnow():
            # Токен истек, помечаем как отозванный
            db_token.is_revoked = True
            self.db.commit()
            return None
        
        # Получаем пользователя
        user = self.db.query(User).filter(User.id == db_token.user_id).first()
        return user

    async def revoke_refresh_token(self, token: str) -> bool:
        """Отзыв refresh токена"""
        db_token = self.db.query(RefreshToken).filter(
            RefreshToken.token == token
        ).first()
        
        if not db_token:
            return False
        
        db_token.is_revoked = True
        self.db.commit()
        return True

    async def create_tokens(self, user: User) -> Tuple[str, str]:
        """Создание пары токенов (access + refresh)"""
        access_token = await self.create_access_token(data={"sub": user.email})
        refresh_token = await self.create_refresh_token(user.id)
        return access_token, refresh_token

    async def create_user(self, user: UserCreate) -> User:
        """Создание нового пользователя"""
        # Проверка на существование пользователя по email
        existing_user = await self.get_user_by_email(user.email)
        if existing_user:
            # Если пользователь уже существует, но email не подтвержден —
            # не создаем нового пользователя и не возвращаем 400.
            # Всегда отправляем (или переотправляем) код подтверждения,
            # чтобы не упираться в сравнение aware/naive дат или TTL.
            if getattr(existing_user, "is_email_verified", False):
                raise HTTPException(
                    status_code=400,
                    detail="Пользователь с таким email уже существует"
                )
            await self.request_email_verification(existing_user)
            return existing_user
        
        # Генерация username из email если не указан
        username = user.username if hasattr(user, 'username') and user.username else user.email.split('@')[0]
        
        # Проверка на существование username
        counter = 1
        original_username = username
        while await self.get_user(username):
            username = f"{original_username}{counter}"
            counter += 1
        
        # Создание нового пользователя
        hashed_password = self.get_password_hash(user.password)
        db_user = User(
            email=user.email,
            username=username,
            hashed_password=hashed_password,
            full_name=user.full_name,
            phone=user.phone,
            is_active=False  # активируем после подтверждения email
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        # Инициация подтверждения email
        await self.request_email_verification(db_user)
        return db_user

    async def update_user(self, user_id: int, user_update: UserUpdate) -> User:
        """Обновление пользователя"""
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Пользователь не найден")
        
        update_data = user_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)
        
        self.db.commit()
        self.db.refresh(user)
        return user

    @staticmethod
    async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
        """Получение текущего пользователя из токена"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Не удалось проверить учетные данные",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            identifier: str = payload.get("sub")
            if identifier is None:
                raise credentials_exception
            token_data = TokenData(username=identifier)
        except JWTError as e:
            print(f"❌ JWT Error: {str(e)}")
            raise credentials_exception
        
        # Пробуем найти по email (как создается токен в /login)
        user = db.query(User).filter(User.email == token_data.username).first()
        
        # Если не найден по email, пробуем по username (для обратной совместимости)
        if user is None:
            user = db.query(User).filter(User.username == token_data.username).first()
        
        if user is None:
            print(f"❌ User not found for identifier: {token_data.username}")
            raise credentials_exception
        
        print(f"✅ User authenticated: {user.email}")
        return user

    async def authenticate_google_user(self, google_id: str, email: str) -> Optional[User]:
        """Аутентификация пользователя через Google"""
        # Сначала ищем по google_id
        user = self.db.query(User).filter(User.google_id == google_id).first()
        if user:
            return user
        
        # Если не найден по google_id, ищем по email
        user = await self.get_user_by_email(email)
        if user and user.google_id == google_id:
            return user
        
        return None

    async def create_google_user(self, google_data: GoogleRegisterRequest) -> User:
        """Создание пользователя через Google OAuth"""
        # Генерация username из email
        username = google_data.email.split('@')[0]
        
        # Проверка на существование username
        counter = 1
        original_username = username
        while await self.get_user(username):
            username = f"{original_username}{counter}"
            counter += 1
        
        # Создание нового пользователя без пароля
        db_user = User(
            email=google_data.email,
            username=username,
            hashed_password=None,  # Для Google OAuth пароль не нужен
            full_name=google_data.name,
            google_id=google_data.google_id,
            google_picture=google_data.picture
        )
        self.db.add(db_user)
        self.db.commit()
        self.db.refresh(db_user)
        return db_user
