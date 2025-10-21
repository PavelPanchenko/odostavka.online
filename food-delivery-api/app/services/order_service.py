"""
Сервис для работы с заказами
"""
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.order import Order, OrderItem, OrderStatus
from app.models.restaurant import MenuItem
from app.schemas.order import OrderCreate, OrderUpdate


class OrderService:
    def __init__(self, db: Session):
        self.db = db

    async def create_order(self, order: OrderCreate, customer_id: int) -> Order:
        """Создание нового заказа"""
        # Получение информации о блюдах и расчет общей суммы
        total_amount = 0.0
        order_items_data = []
        
        for item in order.items:
            menu_item = self.db.query(MenuItem).filter(MenuItem.id == item.menu_item_id).first()
            if not menu_item:
                raise ValueError(f"Блюдо с ID {item.menu_item_id} не найдено")
            
            item_total = menu_item.price * item.quantity
            total_amount += item_total
            
            order_items_data.append({
                "menu_item_id": item.menu_item_id,
                "quantity": item.quantity,
                "price": menu_item.price
            })
        
        # Создание заказа
        db_order = Order(
            customer_id=customer_id,
            restaurant_id=order.restaurant_id,
            status=OrderStatus.PENDING,
            total_amount=total_amount,
            delivery_address=order.delivery_address,
            delivery_phone=order.delivery_phone,
            notes=order.notes
        )
        
        self.db.add(db_order)
        self.db.commit()
        self.db.refresh(db_order)
        
        # Создание позиций заказа
        for item_data in order_items_data:
            order_item = OrderItem(
                order_id=db_order.id,
                **item_data
            )
            self.db.add(order_item)
        
        self.db.commit()
        self.db.refresh(db_order)
        return db_order

    async def get_user_orders(self, customer_id: int) -> List[Order]:
        """Получение заказов пользователя"""
        return self.db.query(Order).filter(Order.customer_id == customer_id).all()

    async def get_order(self, order_id: int, customer_id: int) -> Optional[Order]:
        """Получение заказа по ID"""
        return self.db.query(Order).filter(
            Order.id == order_id,
            Order.customer_id == customer_id
        ).first()

    async def update_order(self, order_id: int, order_update: OrderUpdate, user_id: int) -> Optional[Order]:
        """Обновление заказа"""
        order = self.db.query(Order).filter(Order.id == order_id).first()
        if not order:
            return None
        
        # Проверка прав на обновление
        if order.customer_id != user_id:
            return None
        
        update_data = order_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(order, field, value)
        
        self.db.commit()
        self.db.refresh(order)
        return order

    async def cancel_order(self, order_id: int, customer_id: int) -> bool:
        """Отмена заказа"""
        order = self.db.query(Order).filter(
            Order.id == order_id,
            Order.customer_id == customer_id
        ).first()
        
        if not order:
            return False
        
        # Проверка возможности отмены
        if order.status in [OrderStatus.DELIVERED, OrderStatus.CANCELLED]:
            return False
        
        order.status = OrderStatus.CANCELLED
        self.db.commit()
        return True
