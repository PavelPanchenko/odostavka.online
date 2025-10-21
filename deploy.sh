#!/bin/bash

echo "🚀 Развертывание Food Delivery системы..."

# Проверка наличия .env файла
if [ ! -f .env ]; then
    echo "❌ Файл .env не найден!"
    echo "📝 Создайте файл .env на основе env.example:"
    echo "   cp env.example .env"
    echo "   # Затем отредактируйте .env файл с вашими настройками"
    exit 1
fi

# Загрузка переменных окружения
source .env

# Остановка старых контейнеров
echo "📦 Остановка старых контейнеров..."
docker-compose down

# Сборка и запуск
echo "🔨 Сборка и запуск контейнеров..."
docker-compose up -d --build

# Проверка статуса
echo "✅ Проверка статуса контейнеров..."
docker-compose ps

echo ""
echo "🎉 Развертывание завершено!"
echo ""
echo "📍 Доступные сервисы:"
echo "   🌐 Клиент: http://${SERVER_HOST:-localhost}"
echo "   🔌 API: http://${SERVER_HOST:-localhost}/api"
echo "   👨‍💼 Админка: https://odostavka-admin.vercel.app"
echo ""
echo "📊 Логи контейнеров:"
echo "   docker-compose logs -f"
echo ""
echo "🔧 Управление:"
echo "   docker-compose restart  # Перезапуск"
echo "   docker-compose down     # Остановка"