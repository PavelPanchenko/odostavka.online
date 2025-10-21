"""
Mock-сервис для имитации платежей
Используется для тестирования без реальной платежной системы
"""
from typing import Dict
import time


class PaymentMockService:
    """Заглушка для платежной системы"""
    
    def __init__(self):
        self.test_mode = True
    
    def create_payment(
        self,
        order_id: int,
        amount: float,
        description: str,
        user_id: int
    ) -> Dict:
        """
        Создание mock-платежа
        Возвращает URL для "оплаты" (просто редирект обратно)
        """
        payment_id = f"mock_{order_id}_{int(time.time())}"
        
        print(f"💳 Mock Payment created:")
        print(f"   Payment ID: {payment_id}")
        print(f"   Order ID: {order_id}")
        print(f"   Amount: {amount} RUB")
        print(f"   Description: {description}")
        
        return {
            "id": payment_id,
            "status": "pending",
            "amount": amount,
            "currency": "RUB",
            "confirmation_url": f"http://localhost:3000/orders?payment_id={payment_id}&status=success",
            "test": True
        }
    
    def check_payment_status(self, payment_id: str) -> Dict:
        """
        Проверка статуса mock-платежа
        Всегда возвращает успешный статус для тестирования
        """
        print(f"🔍 Checking mock payment status: {payment_id}")
        
        return {
            "id": payment_id,
            "status": "succeeded",  # Всегда успешно для теста
            "paid": True,
            "test": True
        }
    
    def cancel_payment(self, payment_id: str) -> Dict:
        """Отмена mock-платежа"""
        print(f"❌ Cancelling mock payment: {payment_id}")
        
        return {
            "id": payment_id,
            "status": "canceled",
            "test": True
        }

