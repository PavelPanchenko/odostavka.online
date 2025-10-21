"""
API endpoints для админ панели
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.product import Product, ProductCategory
from app.models.order import Order, OrderItem, OrderStatus
from app.models.restaurant import Restaurant, MenuItem, Category
from app.schemas.user import UserCreate, UserUpdate, AdminUserCreate, AdminUserUpdate
from app.schemas.product import ProductCreate, ProductUpdate, ProductCategoryCreate, ProductCategoryUpdate
from app.schemas.order import OrderUpdate, OrderItemsUpdate, OrderItemUpdate
from app.schemas.restaurant import RestaurantCreate, RestaurantUpdate
from app.services.auth_service import AuthService
from app.services.telegram_service import TelegramService
from datetime import timezone
from sqlalchemy import func, desc, and_, or_

router = APIRouter()


def require_admin(current_user: User = Depends(AuthService.get_current_user)):
    """Проверка прав администратора"""
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(status_code=403, detail="Недостаточно прав")
    return current_user


# ========== ПОЛЬЗОВАТЕЛИ ==========

@router.get("/users", response_model=List[dict])
async def get_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    role: Optional[UserRole] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить список пользователей с фильтрацией"""
    query = db.query(User)
    
    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(User.full_name).like(search_pattern),
                func.lower(User.email).like(search_pattern),
                func.lower(User.username).like(search_pattern)
            )
        )
    
    if role:
        query = query.filter(User.role == role)
    
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    
    users = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "phone": user.phone,
            "address": user.address,
            "role": user.role,
            "is_active": user.is_active,
            "is_email_verified": getattr(user, "is_email_verified", False),
            "created_at": user.created_at,
            "updated_at": user.updated_at,
            "restaurants_count": len(user.restaurants),
            "has_restaurants": len(user.restaurants) > 0
        }
        for user in users
    ]


@router.post("/users")
async def create_user(
    user_data: AdminUserCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Создать нового пользователя"""
    # Проверяем, не существует ли пользователь с таким email
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    
    # Проверяем username
    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Пользователь с таким username уже существует")
    
    # Хешируем пароль
    from app.services.auth_service import AuthService
    auth_service = AuthService(db)
    hashed_password = auth_service.get_password_hash(user_data.password)
    
    # Создаем пользователя
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        phone=user_data.phone,
        address=user_data.address,
        role=user_data.role,
        is_active=user_data.is_active
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {
        "message": "Пользователь создан",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "username": new_user.username,
            "full_name": new_user.full_name,
            "phone": new_user.phone,
            "address": new_user.address,
            "role": new_user.role,
            "is_active": new_user.is_active,
            "created_at": new_user.created_at
        }
    }


@router.get("/users/{user_id}")
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить пользователя по ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "phone": user.phone,
        "address": user.address,
        "role": user.role,
        "is_active": user.is_active,
        "is_email_verified": getattr(user, "is_email_verified", False),
        "created_at": user.created_at,
        "updated_at": user.updated_at
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: int,
    user_update: AdminUserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Обновить пользователя"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Проверяем email на уникальность, если он изменяется
    if user_update.email and user_update.email != user.email:
        existing_email = db.query(User).filter(User.email == user_update.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Пользователь с таким email уже существует")
    
    # Проверяем username на уникальность, если он изменяется
    if user_update.username and user_update.username != user.username:
        existing_username = db.query(User).filter(User.username == user_update.username).first()
        if existing_username:
            raise HTTPException(status_code=400, detail="Пользователь с таким username уже существует")
    
    # Обновляем поля
    update_data = user_update.dict(exclude_unset=True)
    
    # Если обновляется пароль, хешируем его
    if 'password' in update_data:
        from app.services.auth_service import AuthService
        auth_service = AuthService(db)
        user.hashed_password = auth_service.get_password_hash(update_data['password'])
        del update_data['password']
    
    for field, value in update_data.items():
        setattr(user, field, value)
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Пользователь обновлен",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "phone": user.phone,
            "address": user.address,
            "role": user.role,
            "is_active": user.is_active,
            "is_email_verified": getattr(user, "is_email_verified", False),
            "created_at": user.created_at,
            "updated_at": user.updated_at
        }
    }


@router.post("/users/{user_id}/resend-verification")
async def admin_resend_verification(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Админ: повторно отправить код подтверждения email пользователю"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    if getattr(user, "is_email_verified", False):
        return {"status": "already_verified"}
    service = AuthService(db)
    try:
        expires_at = await service.resend_email_verification(user)
        return {"status": "ok", "expires_at": expires_at}
    except HTTPException as e:
        if e.status_code == 429:
            raise e
        raise HTTPException(status_code=400, detail="RESEND_FAILED")


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Удалить пользователя из базы данных"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Проверяем, что не удаляем самого себя
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="Нельзя удалить самого себя")
    
    # Проверяем, есть ли у пользователя рестораны
    if user.restaurants and len(user.restaurants) > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Нельзя удалить пользователя, у которого есть {len(user.restaurants)} ресторанов. Сначала удалите или переназначьте рестораны."
        )
    
    try:
        # Подсчитываем количество заказов пользователя
        orders_count = db.query(Order).filter(Order.user_id == user_id).count()
        
        # Удаляем связанные данные вручную для безопасности
        # Удаляем токены обновления
        from app.models.refresh_token import RefreshToken
        db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
        
        # Удаляем элементы корзины (если есть модель CartItem)
        try:
            from app.models.product import CartItem
            db.query(CartItem).filter(CartItem.user_id == user_id).delete()
        except ImportError:
            pass  # Модель CartItem может не существовать
        
        # Удаляем избранное (если есть модель Favorite)
        try:
            from app.models.favorite import Favorite
            db.query(Favorite).filter(Favorite.user_id == user_id).delete()
        except ImportError:
            pass  # Модель Favorite может не существовать
        
        # Заказы удалятся автоматически благодаря CASCADE
        # Полностью удаляем пользователя из базы данных
        db.delete(user)
        db.commit()
        
        message = f"Пользователь удален"
        if orders_count > 0:
            message += f" (также удалено {orders_count} заказов)"
        
        return {"message": message}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при удалении пользователя: {str(e)}")


# ========== ПРОДУКТЫ ==========

@router.get("/products", response_model=List[dict])
async def get_products(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    is_available: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить список продуктов с фильтрацией"""
    query = db.query(Product)
    
    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(Product.name).like(search_pattern),
                func.lower(Product.description).like(search_pattern),
                func.lower(Product.brand).like(search_pattern)
            )
        )
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    if is_available is not None:
        query = query.filter(Product.is_available == is_available)
    
    products = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "old_price": product.old_price,
            "image_url": product.image_url,
            "weight": product.weight,
            "brand": product.brand,
            "barcode": product.barcode,
            "is_available": product.is_available,
            "is_discount": product.is_discount,
            "stock_quantity": product.stock_quantity,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None,
            "created_at": product.created_at,
            "updated_at": product.updated_at
        }
        for product in products
    ]


@router.post("/products")
async def create_product(
    product_data: ProductCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Создать новый продукт"""
    product = Product(**product_data.dict())
    db.add(product)
    db.commit()
    db.refresh(product)
    
    return {"message": "Продукт создан", "product": product}


@router.put("/products/{product_id}")
async def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Обновить продукт"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    
    for field, value in product_update.dict(exclude_unset=True).items():
        setattr(product, field, value)
    
    db.commit()
    db.refresh(product)
    
    return {"message": "Продукт обновлен", "product": product}


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Удалить продукт"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Продукт не найден")
    
    db.delete(product)
    db.commit()
    
    return {"message": "Продукт удален"}


# ========== КАТЕГОРИИ ПРОДУКТОВ ==========

@router.get("/categories", response_model=List[dict])
async def get_categories(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить список категорий продуктов"""
    categories = db.query(ProductCategory).all()
    
    return [
        {
            "id": category.id,
            "name": category.name,
            "description": category.description,
            "image_url": category.image_url,
            "is_active": category.is_active,
            "created_at": category.created_at,
            "products_count": len(category.products)
        }
        for category in categories
    ]


@router.post("/categories")
async def create_category(
    category_data: ProductCategoryCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Создать новую категорию"""
    category = ProductCategory(**category_data.dict())
    db.add(category)
    db.commit()
    db.refresh(category)
    
    return {"message": "Категория создана", "category": category}


@router.put("/categories/{category_id}")
async def update_category(
    category_id: int,
    category_update: ProductCategoryUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Обновить категорию"""
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    
    for field, value in category_update.dict(exclude_unset=True).items():
        setattr(category, field, value)
    
    db.commit()
    db.refresh(category)
    
    return {"message": "Категория обновлена", "category": category}


@router.delete("/categories/{category_id}")
async def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Удалить категорию"""
    category = db.query(ProductCategory).filter(ProductCategory.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Категория не найдена")
    
    # Проверяем, есть ли продукты в этой категории
    products_count = db.query(Product).filter(Product.category_id == category_id).count()
    if products_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Нельзя удалить категорию с {products_count} продуктами"
        )
    
    db.delete(category)
    db.commit()
    
    return {"message": "Категория удалена"}


# ========== ЗАКАЗЫ ==========

@router.get("/orders", response_model=List[dict])
async def get_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[OrderStatus] = None,
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить список заказов с фильтрацией"""
    query = db.query(Order)
    
    if status:
        query = query.filter(Order.status == status)
    
    if user_id:
        query = query.filter(Order.user_id == user_id)
    
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    
    if end_date:
        query = query.filter(Order.created_at <= end_date)
    
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()

    def to_utc_iso(dt):
        if not dt:
            return None
        if getattr(dt, 'tzinfo', None) is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        # Без микросекунд и всегда с Z
        return dt.replace(microsecond=0).isoformat().replace('+00:00', 'Z')
    
    return [
        {
            "id": order.id,
            "user_id": order.user_id,
            "user_name": order.user.full_name if order.user else None,
            "status": order.status,
            "total_amount": order.total_amount,
            "delivery_address": order.delivery_address,
            "delivery_phone": order.delivery_phone,
            "notes": order.notes,
            "created_at": to_utc_iso(order.created_at),
            "updated_at": to_utc_iso(order.updated_at),
            "items_count": len(order.order_items)
        }
        for order in orders
    ]


@router.get("/orders/{order_id}")
async def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить заказ по ID с деталями"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    def to_utc_iso(dt):
        if not dt:
            return None
        if getattr(dt, 'tzinfo', None) is None:
            dt = dt.replace(tzinfo=timezone.utc)
        else:
            dt = dt.astimezone(timezone.utc)
        return dt.replace(microsecond=0).isoformat().replace('+00:00', 'Z')

    return {
        "id": order.id,
        "user_id": order.user_id,
        "user_name": order.user.full_name if order.user else None,
        "user_email": order.user.email if order.user else None,
        "status": order.status,
        "total_amount": order.total_amount,
        "delivery_address": order.delivery_address,
        "delivery_phone": order.delivery_phone,
        "notes": order.notes,
        "created_at": to_utc_iso(order.created_at),
        "updated_at": to_utc_iso(order.updated_at),
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product.name if item.product else None,
                "quantity": item.quantity,
                "price": item.price
            }
            for item in order.order_items
        ]
    }


@router.put("/orders/{order_id}")
async def update_order(
    order_id: int,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Обновить заказ"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    for field, value in order_update.dict(exclude_unset=True).items():
        setattr(order, field, value)
    
    db.commit()
    db.refresh(order)

    # Уведомление клиента о смене статуса
    try:
        if 'status' in order_update.dict(exclude_unset=True):
            tg = TelegramService()
            if order.user and getattr(order.user, 'telegram_user_id', None):
                status_map = {
                    'pending': 'создан',
                    'confirmed': 'подтвержден',
                    'preparing': 'готовится',
                    'delivering': 'в пути',
                    'delivered': 'доставлен',
                    'cancelled': 'отменен',
                }
                status_text = status_map.get(order.status, order.status)
                text = f"Статус вашего заказа #{order.id}: {status_text}\nСумма: {order.total_amount}₽"
                tg.notify_client(order.user.telegram_user_id, text)
    except Exception as e:
        print(f"⚠️ Telegram client notify error: {e}")

    return {"message": "Заказ обновлен", "order": order}


@router.put("/orders/{order_id}/items")
async def update_order_items(
    order_id: int,
    items_update: OrderItemsUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Обновить товары в заказе"""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Проверяем, что заказ можно редактировать
    if order.status in ['delivered', 'cancelled']:
        raise HTTPException(
            status_code=400, 
            detail="Нельзя редактировать доставленный или отмененный заказ"
        )
    
    try:
        # Получаем текущие товары заказа
        current_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
        current_items_dict = {item.id: item for item in current_items}
        
        # Собираем ID товаров для обновления/удаления
        updated_item_ids = set()
        total_amount = 0
        
        # Обрабатываем новые/обновленные товары
        for item_data in items_update.items:
            if item_data.id and item_data.id in current_items_dict:
                # Обновляем существующий товар
                item = current_items_dict[item_data.id]
                updated_item_ids.add(item_data.id)
                
                # Получаем продукт для актуальной цены
                product = db.query(Product).filter(Product.id == item_data.product_id).first()
                if not product:
                    raise HTTPException(status_code=404, detail=f"Продукт с ID {item_data.product_id} не найден")
                
                # Обновляем данные
                item.product_id = item_data.product_id
                item.quantity = item_data.quantity
                item.price = item_data.price if item_data.price is not None else product.price
                
                total_amount += item.price * item.quantity
            else:
                # Создаем новый товар
                product = db.query(Product).filter(Product.id == item_data.product_id).first()
                if not product:
                    raise HTTPException(status_code=404, detail=f"Продукт с ID {item_data.product_id} не найден")
                
                new_item = OrderItem(
                    order_id=order_id,
                    product_id=item_data.product_id,
                    quantity=item_data.quantity,
                    price=item_data.price if item_data.price is not None else product.price
                )
                db.add(new_item)
                total_amount += new_item.price * new_item.quantity
        
        # Удаляем товары, которые не были обновлены
        for item_id, item in current_items_dict.items():
            if item_id not in updated_item_ids:
                db.delete(item)
        
        # Обновляем общую сумму заказа
        order.total_amount = total_amount
        
        db.commit()
        db.refresh(order)
        
        return {
            "message": "Товары в заказе обновлены",
            "order_id": order.id,
            "total_amount": order.total_amount
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Ошибка при обновлении товаров: {str(e)}")


@router.get("/orders/{order_id}/products")
async def get_available_products(
    order_id: int,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить доступные продукты для добавления в заказ"""
    # Проверяем, что заказ существует
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    
    # Получаем продукты
    query = db.query(Product).filter(Product.is_available == True)
    
    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(Product.name).like(search_pattern),
                func.lower(Product.description).like(search_pattern),
                func.lower(Product.brand).like(search_pattern)
            )
        )
    
    if category_id:
        query = query.filter(Product.category_id == category_id)
    
    products = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": product.id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "old_price": product.old_price,
            "image_url": product.image_url,
            "weight": product.weight,
            "brand": product.brand,
            "is_discount": product.is_discount,
            "stock_quantity": product.stock_quantity,
            "category_id": product.category_id,
            "category_name": product.category.name if product.category else None
        }
        for product in products
    ]


@router.get("/orders/export")
async def export_orders(
    skip: int = Query(0, ge=0),
    limit: int = Query(1000, ge=1, le=10000),
    status: Optional[OrderStatus] = None,
    user_id: Optional[int] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Экспорт заказов в CSV"""
    import csv
    import io
    from fastapi.responses import StreamingResponse
    
    query = db.query(Order)
    
    if status:
        query = query.filter(Order.status == status)
    
    if user_id:
        query = query.filter(Order.user_id == user_id)
    
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    
    if end_date:
        query = query.filter(Order.created_at <= end_date)
    
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    # Создаем CSV в памяти
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Заголовки
    writer.writerow([
        'ID заказа', 'ID клиента', 'Имя клиента', 'Email клиента',
        'Статус', 'Сумма', 'Адрес доставки', 'Телефон',
        'Примечания', 'Дата создания', 'Дата обновления'
    ])
    
    # Данные
    for order in orders:
        writer.writerow([
            order.id,
            order.user_id,
            order.user.full_name if order.user else '',
            order.user.email if order.user else '',
            order.status,
            order.total_amount,
            order.delivery_address,
            order.delivery_phone,
            order.notes or '',
            order.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            order.updated_at.strftime('%Y-%m-%d %H:%M:%S') if order.updated_at else ''
        ])
    
    # Возвращаем CSV как поток
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode('utf-8')),
        media_type='text/csv',
        headers={'Content-Disposition': f'attachment; filename="orders_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv"'}
    )


# ========== РЕСТОРАНЫ ==========

@router.get("/restaurants", response_model=List[dict])
async def get_restaurants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить список ресторанов с фильтрацией"""
    query = db.query(Restaurant)
    
    if search:
        search_pattern = f"%{search.lower()}%"
        query = query.filter(
            or_(
                func.lower(Restaurant.name).like(search_pattern),
                func.lower(Restaurant.description).like(search_pattern),
                func.lower(Restaurant.address).like(search_pattern)
            )
        )
    
    if is_active is not None:
        query = query.filter(Restaurant.is_active == is_active)
    
    restaurants = query.offset(skip).limit(limit).all()
    
    return [
        {
            "id": restaurant.id,
            "name": restaurant.name,
            "description": restaurant.description,
            "address": restaurant.address,
            "phone": restaurant.phone,
            "email": restaurant.email,
            "latitude": restaurant.latitude,
            "longitude": restaurant.longitude,
            "is_active": restaurant.is_active,
            "delivery_fee": restaurant.delivery_fee,
            "minimum_order": restaurant.minimum_order,
            "owner_id": restaurant.owner_id,
            "created_at": restaurant.created_at,
            "updated_at": restaurant.updated_at
        }
        for restaurant in restaurants
    ]


@router.get("/restaurants/{restaurant_id}")
async def get_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить ресторан по ID"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Ресторан не найден")
    
    return {
        "id": restaurant.id,
        "name": restaurant.name,
        "description": restaurant.description,
        "address": restaurant.address,
        "phone": restaurant.phone,
        "email": restaurant.email,
        "latitude": restaurant.latitude,
        "longitude": restaurant.longitude,
        "is_active": restaurant.is_active,
        "delivery_fee": restaurant.delivery_fee,
        "minimum_order": restaurant.minimum_order,
        "owner_id": restaurant.owner_id,
        "created_at": restaurant.created_at,
        "updated_at": restaurant.updated_at
    }


@router.put("/restaurants/{restaurant_id}")
async def update_restaurant(
    restaurant_id: int,
    restaurant_update: RestaurantUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Обновить ресторан"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Ресторан не найден")
    
    for field, value in restaurant_update.dict(exclude_unset=True).items():
        setattr(restaurant, field, value)
    
    db.commit()
    db.refresh(restaurant)
    
    return {"message": "Ресторан обновлен", "restaurant": restaurant}


@router.delete("/restaurants/{restaurant_id}")
async def delete_restaurant(
    restaurant_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Удалить ресторан"""
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Ресторан не найден")
    
    db.delete(restaurant)
    db.commit()
    
    return {"message": "Ресторан удален"}


# ========== СТАТИСТИКА ==========

@router.get("/stats/dashboard")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить статистику для дашборда"""
    # Общее количество пользователей
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Общее количество продуктов
    total_products = db.query(Product).count()
    available_products = db.query(Product).filter(Product.is_available == True).count()
    
    # Общее количество заказов
    total_orders = db.query(Order).count()
    
    # Заказы за последние 30 дней
    thirty_days_ago = datetime.now() - timedelta(days=30)
    orders_last_30_days = db.query(Order).filter(Order.created_at >= thirty_days_ago).count()
    
    # Общая сумма заказов
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0
    
    # Доход за последние 30 дней
    revenue_last_30_days = db.query(func.sum(Order.total_amount)).filter(
        Order.created_at >= thirty_days_ago
    ).scalar() or 0
    
    # Статистика по статусам заказов
    order_stats = db.query(
        Order.status,
        func.count(Order.id).label('count')
    ).group_by(Order.status).all()
    
    return {
        "users": {
            "total": total_users,
            "active": active_users
        },
        "products": {
            "total": total_products,
            "available": available_products
        },
        "orders": {
            "total": total_orders,
            "last_30_days": orders_last_30_days
        },
        "revenue": {
            "total": float(total_revenue),
            "last_30_days": float(revenue_last_30_days)
        },
        "order_statuses": [
            {"status": stat.status, "count": stat.count}
            for stat in order_stats
        ]
    }


@router.get("/stats/orders-timeline")
async def get_orders_timeline(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить статистику заказов по дням"""
    start_date = datetime.now() - timedelta(days=days)
    
    # Группируем заказы по дням
    daily_orders = db.query(
        func.date(Order.created_at).label('date'),
        func.count(Order.id).label('orders_count'),
        func.sum(Order.total_amount).label('revenue')
    ).filter(
        Order.created_at >= start_date
    ).group_by(
        func.date(Order.created_at)
    ).order_by(
        func.date(Order.created_at)
    ).all()
    
    return [
        {
            "date": str(day.date),
            "orders_count": day.orders_count,
            "revenue": float(day.revenue or 0)
        }
        for day in daily_orders
    ]


# ===== НАСТРОЙКИ ДОСТАВКИ =====

@router.get("/delivery/settings")
async def get_delivery_settings_admin(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить настройки доставки (админ)"""
    from app.services.delivery_service import DeliveryService
    
    delivery_service = DeliveryService(db)
    settings = delivery_service.get_delivery_settings()
    
    if not settings:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Настройки доставки не найдены"
        )
    
    return settings


@router.put("/delivery/settings")
async def update_delivery_settings_admin(
    settings_data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Обновить настройки доставки (админ)"""
    from app.services.delivery_service import DeliveryService
    
    delivery_service = DeliveryService(db)
    # Передаем ID администратора для атрибута created_by
    settings = delivery_service.update_delivery_settings(settings_data, admin_id=admin.id)
    
    return settings


@router.post("/delivery/settings")
async def create_delivery_settings_admin(
    settings_data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Создать настройки доставки (админ)"""
    from app.services.delivery_service import DeliveryService
    
    delivery_service = DeliveryService(db)
    settings = delivery_service.create_delivery_settings(settings_data)
    
    return settings


@router.get("/delivery/zones")
async def get_delivery_zones_admin(
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Получить зоны доставки (админ)"""
    from app.services.delivery_service import DeliveryService
    
    delivery_service = DeliveryService(db)
    zones_dict = delivery_service.get_delivery_zones()
    
    # Проверяем, что zones_dict это словарь
    if not isinstance(zones_dict, dict):
        return {"zones": []}
    
    # Преобразуем словарь в массив
    zones_list = []
    for zone_id, zone_info in zones_dict.items():
        zones_list.append({
            "id": zone_id,
            "name": zone_info.get("name", ""),
            "cost": zone_info.get("cost", 0),
            "min_order_amount": zone_info.get("min_order_amount", 0),
            "free_delivery_threshold": zone_info.get("free_delivery_threshold", 0),
            "delivery_time": zone_info.get("delivery_time", "30-60 мин"),
            "radius": zone_info.get("radius", 5)
        })
    
    return {"zones": zones_list}


@router.post("/delivery/zones")
async def create_delivery_zone_admin(
    zone_data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Создать зону доставки (админ)"""
    from app.services.delivery_service import DeliveryService
    
    delivery_service = DeliveryService(db)
    zone = delivery_service.create_delivery_zone(zone_data)
    
    return zone


@router.put("/delivery/zones/{zone_id}")
async def update_delivery_zone_admin(
    zone_id: str,
    zone_data: dict,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Обновить зону доставки (админ)"""
    from app.services.delivery_service import DeliveryService
    
    delivery_service = DeliveryService(db)
    zone = delivery_service.update_delivery_zone(zone_id, zone_data)
    
    if not zone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Зона доставки не найдена"
        )
    
    return zone


@router.delete("/delivery/zones/{zone_id}")
async def delete_delivery_zone_admin(
    zone_id: str,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    """Удалить зону доставки (админ)"""
    from app.services.delivery_service import DeliveryService
    
    delivery_service = DeliveryService(db)
    success = delivery_service.delete_delivery_zone(zone_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Зона доставки не найдена"
        )
    
    return {"message": "Зона доставки удалена"}
