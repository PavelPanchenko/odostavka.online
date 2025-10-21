"""
API для управления пользователями
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import User, UserUpdate
from app.services.auth_service import AuthService
from pydantic import BaseModel
from app.models.user import User as UserModel
import hmac
import hashlib
from app.core.config import settings

router = APIRouter()


@router.get("/users/me", response_model=User)
async def read_users_me(current_user: User = Depends(AuthService.get_current_user)):
    """Получение информации о текущем пользователе"""
    return current_user


@router.put("/users/me", response_model=User)
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Обновление информации о текущем пользователе"""
    auth_service = AuthService(db)
    return await auth_service.update_user(current_user.id, user_update)


class TelegramRegisterRequest(BaseModel):
    chat_id: str
    sig: str | None = None  # подпись от бота (HMAC-SHA256(chat_id) ключом бота)


@router.post("/users/me/telegram")
async def register_telegram(
    payload: TelegramRegisterRequest,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Если передана подпись, проверим её (опционально, для автосвязывания)
    if payload.sig and settings.telegram_client_bot_token:
        try:
            key = settings.telegram_client_bot_token.encode('utf-8')
            msg = payload.chat_id.encode('utf-8')
            expected = hmac.new(key, msg, hashlib.sha256).hexdigest()
            if expected.lower() != payload.sig.lower():
                raise HTTPException(status_code=400, detail="Invalid signature")
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid signature")
    user.telegram_user_id = payload.chat_id
    db.commit()
    db.refresh(user)
    return {"status": "ok"}


class OnlineSetRequest(BaseModel):
    role: str  # 'admin' | 'courier'
    online: bool


@router.post("/users/me/online")
async def set_online(
    payload: OnlineSetRequest,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(UserModel).filter(UserModel.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if payload.role == 'admin' or payload.role == 'super_admin':
        user.is_admin_online = payload.online
    elif payload.role == 'courier':
        user.is_courier_online = payload.online
    else:
        raise HTTPException(status_code=400, detail="Invalid role")
    db.commit()
    db.refresh(user)
    return {"status": "ok"}
