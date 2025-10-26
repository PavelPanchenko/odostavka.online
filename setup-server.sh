#!/bin/bash

# Скрипт для настройки сервера и запуска контейнеров
# Запускать на сервере в корневой папке проекта

echo "🚀 Настройка сервера для запуска контейнеров..."

# Проверяем, что мы в правильной папке
if [ ! -f "docker-compose-db-api.yml" ] || [ ! -d "food-delivery-api" ] || [ ! -d "food-delivery-client" ]; then
    echo "❌ Ошибка: Запустите скрипт в корневой папке проекта!"
    echo "📁 Структура должна быть:"
    echo "   /path/to/odostavka.online/"
    echo "   ├── docker-compose-db-api.yml"
    echo "   ├── docker-compose-all.yml"
    echo "   ├── food-delivery-api/"
    echo "   ├── food-delivery-client/"
    echo "   ├── nginx/"
    echo "   └── .env"
    echo ""
    echo "📋 Правильная команда:"
    echo "   cd /path/to/odostavka.online"
    echo "   ./setup-server.sh"
    exit 1
fi

echo "✅ Находимся в правильной папке проекта"

# Проверяем наличие Docker
if ! command -v docker &> /dev/null; then
    echo "🐳 Docker не установлен. Устанавливаем..."
    ./setup-docker.sh
else
    echo "✅ Docker уже установлен"
fi

# Проверяем файл окружения
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден. Создаем из env.example..."
    cp env.example .env
    echo "✅ Файл .env создан"
    echo "📝 ВАЖНО: Отредактируйте .env файл с вашими настройками!"
    echo "   nano .env"
    echo ""
    echo "🔑 Обязательные переменные для изменения:"
    echo "   - POSTGRES_PASSWORD (пароль для БД)"
    echo "   - SECRET_KEY (секретный ключ для JWT)"
    echo "   - CLIENT_API_URL (URL API для клиента)"
    echo "   - CLIENT_API_DOMAIN (домен для изображений)"
    echo ""
    read -p "Нажмите Enter после редактирования .env файла..."
fi

echo "✅ Настройка завершена!"
echo ""
echo "🚀 Теперь можно запустить контейнеры:"
echo ""
echo "📋 Для запуска только БД и API:"
echo "   ./start-db-api.sh"
echo ""
echo "📋 Для запуска всех сервисов (БД + API + Клиент + Nginx):"
echo "   docker compose -f docker-compose-all.yml up -d --build"
echo ""
echo "📋 Для проверки статуса:"
echo "   docker compose ps"
echo ""
