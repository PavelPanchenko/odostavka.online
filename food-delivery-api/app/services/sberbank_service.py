"""
Сервис для работы с API Сбербанк Acquiring
Документация: https://securepayments.sberbank.ru/wiki/doku.php/integration:api:rest:start
"""
import requests
import urllib3
from typing import Dict, Optional
from app.core.config import settings

# Отключаем предупреждения о непроверенных SSL сертификатах для тестовой среды
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class SberbankService:
    """Сервис для интеграции со Сбербанк Acquiring"""
    
    def __init__(self):
        self.api_url = settings.sberbank_api_url
        self.username = settings.sberbank_username
        self.password = settings.sberbank_password
        self.return_url = settings.sberbank_return_url
        self.fail_url = settings.sberbank_fail_url
    
    def _make_request(self, endpoint: str, data: Dict) -> Dict:
        """Выполнение запроса к API Сбербанка"""
        url = f"{self.api_url}/{endpoint}"
        
        # Добавляем аутентификацию
        data.update({
            "userName": self.username,
            "password": self.password
        })
        
        print(f"🏦 Sberbank API request: {endpoint}")
        print(f"   Data: {data}")
        
        try:
            # Сбербанк API использует application/x-www-form-urlencoded вместо JSON
            # Для тестовой среды Сбербанка отключаем проверку SSL
            # В production используйте verify=True
            response = requests.post(url, data=data, timeout=30, verify=False)
            result = response.json()
            
            print(f"   Response: {result}")
            
            return result
        except Exception as e:
            print(f"❌ Sberbank API error: {str(e)}")
            raise Exception(f"Ошибка связи со Сбербанком: {str(e)}")
    
    def register_order(
        self,
        order_number: str,
        amount: float,
        description: str,
        client_id: Optional[str] = None
    ) -> Dict:
        """
        Регистрация заказа в Сбербанке
        
        Args:
            order_number: Уникальный номер заказа в системе магазина
            amount: Сумма платежа в рублях (будет конвертирована в копейки)
            description: Описание заказа
            client_id: ID клиента для привязки карты
        
        Returns:
            {
                "orderId": "70906e55-7114-41d6-8332-4609dc6590f4",
                "formUrl": "https://3dsec.sberbank.ru/payment/merchants/..."
            }
        """
        # Сбербанк принимает сумму в копейках (минимальная единица)
        amount_kopeks = int(amount * 100)
        
        data = {
            "orderNumber": order_number,
            "amount": amount_kopeks,
            "currency": "643",  # RUB (ISO 4217)
            "returnUrl": self.return_url,
            "failUrl": self.fail_url,
            "description": description,
            "language": "ru"
        }
        
        if client_id:
            data["clientId"] = client_id
        
        return self._make_request("register.do", data)
    
    def get_order_status(self, order_id: str) -> Dict:
        """
        Получение статуса заказа
        
        Args:
            order_id: ID заказа в системе Сбербанка
        
        Returns:
            {
                "OrderStatus": 2,  # 0-Зарегистрирован, 1-Предавторизован, 2-Оплачен, 3-Возврат, 4-Авторизация отменена, 5-Инициирована авторизация через сервер, 6-Отклонен
                "OrderNumber": "order_123",
                "Pan": "411111**1111",
                "Amount": 50000,  # в копейках
                ...
            }
        """
        data = {"orderId": order_id}
        return self._make_request("getOrderStatus.do", data)
    
    def get_order_status_extended(self, order_id: str) -> Dict:
        """
        Получение расширенного статуса заказа
        Включает информацию о платёжных данных, статусе карты и др.
        """
        data = {"orderId": order_id}
        return self._make_request("getOrderStatusExtended.do", data)
    
    def reverse_order(self, order_id: str, amount: Optional[float] = None) -> Dict:
        """
        Отмена оплаты заказа (возврат средств)
        
        Args:
            order_id: ID заказа в системе Сбербанка
            amount: Сумма возврата в рублях (если None - полный возврат)
        """
        data = {"orderId": order_id}
        
        if amount is not None:
            data["amount"] = int(amount * 100)  # в копейках
        
        return self._make_request("reverse.do", data)
    
    def refund_order(self, order_id: str, amount: float) -> Dict:
        """
        Возврат средств по оплаченному заказу
        
        Args:
            order_id: ID заказа в системе Сбербанка
            amount: Сумма возврата в рублях
        """
        data = {
            "orderId": order_id,
            "amount": int(amount * 100)  # в копейках
        }
        
        return self._make_request("refund.do", data)
    
    @staticmethod
    def get_order_status_text(status: int) -> str:
        """Получение текстового описания статуса заказа"""
        statuses = {
            0: "Зарегистрирован",
            1: "Предавторизован",
            2: "Оплачен",
            3: "Возвращён",
            4: "Авторизация отменена",
            5: "Инициирована авторизация",
            6: "Отклонён"
        }
        return statuses.get(status, f"Неизвестный статус ({status})")
    
    @staticmethod
    def is_payment_successful(status_response: Dict) -> bool:
        """Проверка, был ли платёж успешным"""
        order_status = status_response.get("OrderStatus") or status_response.get("orderStatus")
        return order_status == 2  # 2 = Оплачен

