"""
Простой Telegram сервис для отправки уведомлений.
Поддерживает три токена ботов: клиентский, курьерский, админский.
"""
from typing import Optional
import requests
from app.core.config import settings


class TelegramService:
    def __init__(self):
        self.client_bot_token = getattr(settings, 'telegram_client_bot_token', None)
        self.courier_bot_token = getattr(settings, 'telegram_courier_bot_token', None)
        self.admin_bot_token = getattr(settings, 'telegram_admin_bot_token', None)

    def _send(self, bot_token: Optional[str], chat_id: str, text: str) -> bool:
        if not bot_token:
            return False
        try:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            resp = requests.post(url, json={
                'chat_id': chat_id,
                'text': text,
                'parse_mode': 'HTML'
            }, timeout=10)
            return resp.ok
        except Exception:
            return False

    def notify_client(self, chat_id: str, text: str) -> bool:
        return self._send(self.client_bot_token, chat_id, text)

    def notify_courier(self, chat_id: str, text: str) -> bool:
        return self._send(self.courier_bot_token, chat_id, text)

    def notify_admin(self, chat_id: str, text: str) -> bool:
        return self._send(self.admin_bot_token, chat_id, text)


