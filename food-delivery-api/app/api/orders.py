"""
API для управления заказами
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.services.telegram_service import TelegramService
from app.services.delivery_service import DeliveryService
from app.schemas.order import OrderCreate, OrderResponse, OrderListResponse, OrderItemResponse
from app.services.auth_service import AuthService

router = APIRouter()


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Создание нового заказа"""
    # Блокируем оформление, если доставка недоступна сейчас
    delivery_service = DeliveryService(db)
    if not delivery_service.is_delivery_available_now():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Доставка сейчас недоступна")
    if not order_data.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заказ должен содержать хотя бы один товар"
        )
    
    # Вычисляем общую сумму и создаем позиции заказа
    total_amount = 0
    order_items_data = []
    
    for item in order_data.items:
        # Получаем продукт
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Продукт с ID {item.product_id} не найден"
            )
        
        if not product.is_available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Продукт '{product.name}' недоступен"
            )
        
        item_total = product.price * item.quantity
        total_amount += item_total
        
        order_items_data.append({
            "product_id": product.id,
            "quantity": item.quantity,
            "price": product.price,
            "product_name": product.name,
            "product_image": product.image_url
        })
    
    # Создаем заказ
    db_order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        delivery_address=order_data.delivery_address,
        delivery_phone=order_data.delivery_phone,
        notes=order_data.notes,
        status="pending"
    )
    db.add(db_order)
    db.flush()  # Получаем ID заказа
    
    # Создаем позиции заказа
    db_items = []
    for item_data in order_items_data:
        db_item = OrderItem(
            order_id=db_order.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            price=item_data["price"]
        )
        db.add(db_item)
        db_items.append(db_item)
    
    db.commit()
    db.refresh(db_order)

    # Telegram уведомления для онлайн админов/курьеров (если настроены токены)
    try:
      tg = TelegramService()
      text = (
        f"Новый заказ #{db_order.id}\n"
        f"Сумма: {db_order.total_amount}₽\n"
        f"Адрес: {db_order.delivery_address}\n"
        f"Телефон: {db_order.delivery_phone}"
      )
      # Избегаем импорта сверху, чтобы не зациклить
      from sqlalchemy import and_
      from app.models.user import User as UserModel
      admins = db.query(UserModel).filter(and_(UserModel.is_admin_online == True, UserModel.telegram_user_id.isnot(None))).all()
      for u in admins:
        tg.notify_admin(u.telegram_user_id, text)
      couriers = db.query(UserModel).filter(and_(UserModel.is_courier_online == True, UserModel.telegram_user_id.isnot(None))).all()
      for u in couriers:
        tg.notify_courier(u.telegram_user_id, text)
    except Exception as e:
      print(f"⚠️ Telegram notify error: {e}")
    
    # Формируем ответ
    return OrderResponse(
        id=db_order.id,
        user_id=db_order.user_id,
        status=db_order.status,
        total_amount=db_order.total_amount,
        delivery_address=db_order.delivery_address,
        delivery_phone=db_order.delivery_phone,
        notes=db_order.notes,
        created_at=db_order.created_at,
        updated_at=db_order.updated_at,
        items=[
            OrderItemResponse(
                id=db_item.id,
                product_id=item_data["product_id"],
                quantity=item_data["quantity"],
                price=item_data["price"],
                product_name=item_data["product_name"],
                product_image=item_data["product_image"]
            )
            for db_item, item_data in zip(db_items, order_items_data)
        ]
    )


@router.get("/", response_model=List[OrderResponse])
async def get_user_orders(
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Получение всех заказов текущего пользователя"""
    orders = db.query(Order).filter(
        Order.user_id == current_user.id
    ).order_by(Order.created_at.desc()).all()
    
    result = []
    for order in orders:
        # Получаем позиции заказа с информацией о продуктах
        items = db.query(OrderItem, Product).join(
            Product, OrderItem.product_id == Product.id
        ).filter(OrderItem.order_id == order.id).all()
        
        order_items = [
            OrderItemResponse(
                id=item.OrderItem.id,
                product_id=item.OrderItem.product_id,
                quantity=item.OrderItem.quantity,
                price=item.OrderItem.price,
                product_name=item.Product.name,
                product_image=item.Product.image_url
            )
            for item in items
        ]
        
        result.append(OrderResponse(
            id=order.id,
            user_id=order.user_id,
            status=order.status,
            total_amount=order.total_amount,
            delivery_address=order.delivery_address,
            delivery_phone=order.delivery_phone,
            notes=order.notes,
            created_at=order.created_at,
            updated_at=order.updated_at,
            items=order_items
        ))
    
    return result


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Получение информации о конкретном заказе"""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )
    
    # Получаем позиции заказа с информацией о продуктах
    items = db.query(OrderItem, Product).join(
        Product, OrderItem.product_id == Product.id
    ).filter(OrderItem.order_id == order.id).all()
    
    order_items = [
        OrderItemResponse(
            id=item.OrderItem.id,
            product_id=item.OrderItem.product_id,
            quantity=item.OrderItem.quantity,
            price=item.OrderItem.price,
            product_name=item.Product.name,
            product_image=item.Product.image_url
        )
        for item in items
    ]
    
    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        status=order.status,
        total_amount=order.total_amount,
        delivery_address=order.delivery_address,
        delivery_phone=order.delivery_phone,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        items=order_items
    )
