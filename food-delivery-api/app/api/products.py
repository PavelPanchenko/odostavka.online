"""
API endpoints для продуктов
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.models.product import Product, ProductCategory, CartItem
from app.schemas.product import (
    Product as ProductSchema,
    ProductCreate,
    ProductUpdate,
    ProductCategory as ProductCategorySchema,
    ProductCategoryCreate,
    ProductCategoryUpdate,
    CartItem as CartItemSchema,
    CartItemCreate,
    CartItemUpdate,
    CartResponse
)
from app.services.auth_service import AuthService
from app.models.user import User

router = APIRouter()


# Категории продуктов
@router.get("/categories", response_model=List[ProductCategorySchema])
async def get_categories(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Получить список категорий продуктов"""
    categories = db.query(ProductCategory).filter(
        ProductCategory.is_active == True
    ).offset(skip).limit(limit).all()
    return categories


@router.post("/categories", response_model=ProductCategorySchema)
async def create_category(
    category: ProductCategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Создать новую категорию (только для админов)"""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    db_category = ProductCategory(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category


# Продукты
@router.get("/", response_model=List[ProductSchema])
async def get_products(
    skip: int = 0,
    limit: int = 100,
    category_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получить список продуктов"""
    query = db.query(Product).filter(Product.is_available == True)
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    
    # Сортируем по категории, затем по названию
    query = query.order_by(Product.category_id, Product.name)
    
    products = query.offset(skip).limit(limit).all()
    return products


@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    """Получить продукт по ID"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Продукт не найден"
        )
    return product


@router.post("/", response_model=ProductSchema)
async def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(AuthService.get_current_user)
):
    """Создать новый продукт (только для админов)"""
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Недостаточно прав"
        )
    
    db_product = Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


# Корзина продуктов
@router.get("/cart/", response_model=CartResponse)
async def get_cart(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Получить корзину пользователя"""
    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    
    total_items = sum(item.quantity for item in cart_items)
    total_price = sum(item.product.price * item.quantity for item in cart_items if item.product)
    
    return CartResponse(
        items=cart_items,
        total_items=total_items,
        total_price=total_price
    )


@router.post("/cart/", response_model=CartItemSchema)
async def add_to_cart(
    cart_item: CartItemCreate,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Добавить продукт в корзину"""
    # Проверяем, существует ли продукт
    product = db.query(Product).filter(Product.id == cart_item.product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Продукт не найден"
        )
    
    # Проверяем, есть ли уже такой продукт в корзине
    existing_item = db.query(CartItem).filter(
        CartItem.user_id == current_user.id,
        CartItem.product_id == cart_item.product_id
    ).first()
    
    if existing_item:
        # Увеличиваем количество
        existing_item.quantity += cart_item.quantity
        db.commit()
        db.refresh(existing_item)
        return existing_item
    else:
        # Создаем новый элемент корзины
        db_cart_item = CartItem(
            user_id=current_user.id,
            **cart_item.dict()
        )
        db.add(db_cart_item)
        db.commit()
        db.refresh(db_cart_item)
        return db_cart_item


@router.put("/cart/{item_id}", response_model=CartItemSchema)
async def update_cart_item(
    item_id: int,
    cart_item_update: CartItemUpdate,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить количество продукта в корзине"""
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Элемент корзины не найден"
        )
    
    cart_item.quantity = cart_item_update.quantity
    db.commit()
    db.refresh(cart_item)
    return cart_item


@router.delete("/cart/{item_id}")
async def remove_from_cart(
    item_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить продукт из корзины"""
    cart_item = db.query(CartItem).filter(
        CartItem.id == item_id,
        CartItem.user_id == current_user.id
    ).first()
    
    if not cart_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Элемент корзины не найден"
        )
    
    db.delete(cart_item)
    db.commit()
    return {"message": "Продукт удален из корзины"}


@router.delete("/cart/")
async def clear_cart(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Очистить корзину"""
    db.query(CartItem).filter(CartItem.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Корзина очищена"}
