"""
Инициализация базы данных
"""
import sys
from pathlib import Path

# Добавляем корневую папку в путь
sys.path.append(str(Path(__file__).parent.parent.parent))

from app.db.database import engine, Base
from app.models import user, restaurant, order, product, favorite, payment, refresh_token, delivery_settings, support_settings
from app.db.seed_data import create_test_data


def create_tables():
    """Создание всех таблиц в базе данных"""
    Base.metadata.create_all(bind=engine)
    print("Таблицы созданы успешно!")


async def init_database():
    """Полная инициализация базы данных с тестовыми данными"""
    create_tables()
    await create_test_data()


if __name__ == "__main__":
    import asyncio
    asyncio.run(init_database())
