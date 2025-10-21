"""
API для избранного
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.favorite import Favorite
from app.models.product import Product
from app.models.user import User
from app.schemas.favorite import FavoriteCreate, FavoriteDelete, FavoriteResponse
from app.schemas.product import Product as ProductSchema
from app.services.auth_service import AuthService

router = APIRouter()


@router.get("/", response_model=List[ProductSchema])
async def get_favorites(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Получение списка избранных товаров"""
    favorites = db.query(Favorite).filter(
        Favorite.user_id == current_user.id
    ).all()
    
    # Получаем продукты
    product_ids = [f.product_id for f in favorites]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    
    return products


@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_to_favorites(
    favorite: FavoriteCreate,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Добавление товара в избранное"""
    # Проверяем, существует ли продукт
    product = db.query(Product).filter(Product.id == favorite.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Продукт не найден"
        )
    
    # Проверяем, не добавлен ли уже в избранное
    existing = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.product_id == favorite.product_id
    ).first()
    
    if existing:
        return {"message": "Товар уже в избранном"}
    
    # Добавляем в избранное
    db_favorite = Favorite(
        user_id=current_user.id,
        product_id=favorite.product_id
    )
    db.add(db_favorite)
    db.commit()
    
    return {"message": "Товар добавлен в избранное"}


@router.delete("/{product_id}")
async def remove_from_favorites(
    product_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Удаление товара из избранного"""
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.product_id == product_id
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Товар не найден в избранном"
        )
    
    db.delete(favorite)
    db.commit()
    
    return {"message": "Товар удален из избранного"}


@router.get("/check/{product_id}")
async def check_favorite(
    product_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Проверка, находится ли товар в избранном"""
    favorite = db.query(Favorite).filter(
        Favorite.user_id == current_user.id,
        Favorite.product_id == product_id
    ).first()
    
    return {"is_favorite": favorite is not None}

