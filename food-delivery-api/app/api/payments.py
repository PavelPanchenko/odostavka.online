"""
API для управления платежами
Используется mock-сервис для тестирования без реальной платежной системы
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.models.payment import Payment
from app.models.order import Order
from app.models.user import User
from app.schemas.payment import PaymentCreate, PaymentResponse, PaymentStatusUpdate
from app.services.auth_service import AuthService
from app.services.payment_mock_service import PaymentMockService
from app.core.config import settings

router = APIRouter()

# Используем mock-сервис для тестирования
# В будущем заменить на реальный платежный сервис
payment_service = PaymentMockService()


@router.post("/create", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payment_data: PaymentCreate,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Создание платежа для заказа"""
    
    # Проверяем, существует ли заказ и принадлежит ли он пользователю
    order = db.query(Order).filter(
        Order.id == payment_data.order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )
    
    # Проверяем, нет ли уже успешного платежа для этого заказа
    existing_payment = db.query(Payment).filter(
        Payment.order_id == order.id,
        Payment.status == "succeeded"
    ).first()
    
    if existing_payment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Заказ уже оплачен"
        )
    
    try:
        # Создаем mock-платеж (заглушка)
        mock_response = payment_service.create_payment(
            order_id=order.id,
            amount=payment_data.amount,
            description=payment_data.description or f"Оплата заказа #{order.id}",
            user_id=current_user.id
        )
        
        # Получаем ID платежа и URL "оплаты"
        payment_id = mock_response.get("id")
        confirmation_url = mock_response.get("confirmation_url")
        
        # Сохраняем платеж в нашей базе
        db_payment = Payment(
            order_id=order.id,
            yookassa_payment_id=payment_id,
            amount=payment_data.amount,
            currency="RUB",
            status="pending",  # Ожидает оплаты
            description=payment_data.description or f"Оплата заказа #{order.id}",
            confirmation_url=confirmation_url,
            is_test=True  # Mock режим
        )
        
        db.add(db_payment)
        db.commit()
        db.refresh(db_payment)
        
        print(f"✅ Mock payment created: {db_payment.id}, Payment ID: {payment_id}")
        
        return db_payment
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Payment creation error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка создания платежа: {str(e)}"
        )


@router.get("/check-status/{payment_id}")
async def check_payment_status(
    payment_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """
    Проверка статуса mock-платежа
    В mock-режиме всегда возвращает успешный статус
    """
    
    try:
        # Получаем платёж из нашей базы
        payment = db.query(Payment).join(Order).filter(
            Payment.id == payment_id,
            Order.user_id == current_user.id
        ).first()
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Платёж не найден"
            )
        
        # Проверяем статус mock-платежа (всегда успешно)
        mock_status = payment_service.check_payment_status(payment.yookassa_payment_id)
        
        print(f"📥 Mock status check: {mock_status}")
        
        # Обновляем статус платежа на успешный
        payment.status = "succeeded"
        payment.paid_at = datetime.now()
        payment.payment_method_type = "mock"
        
        # Обновляем статус заказа
        order = db.query(Order).filter(Order.id == payment.order_id).first()
        if order:
            order.status = "confirmed"
            print(f"✅ Order {order.id} marked as confirmed (mock paid)")
        
        db.commit()
        db.refresh(payment)
        
        print(f"✅ Mock payment {payment.id} marked as succeeded")
        
        return {
            "status": "success",
            "payment": payment
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Status check error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Ошибка проверки статуса: {str(e)}"
        )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Получение информации о платеже"""
    
    payment = db.query(Payment).join(Order).filter(
        Payment.id == payment_id,
        Order.user_id == current_user.id
    ).first()
    
    if not payment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Платеж не найден"
        )
    
    return payment


@router.get("/order/{order_id}", response_model=List[PaymentResponse])
async def get_order_payments(
    order_id: int,
    current_user: User = Depends(AuthService.get_current_user),
    db: Session = Depends(get_db)
):
    """Получение всех платежей по заказу"""
    
    # Проверяем, что заказ принадлежит пользователю
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id
    ).first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заказ не найден"
        )
    
    payments = db.query(Payment).filter(Payment.order_id == order_id).all()
    
    return payments

