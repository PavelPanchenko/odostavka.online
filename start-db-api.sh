#!/bin/bash

# Скрипт для запуска только БД и API
# Включает: PostgreSQL, Redis, API

echo "🚀 Запуск базы данных и API..."

# Проверяем наличие файла окружения
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден. Копируем из env.local..."
    cp env.local .env
    echo "✅ Файл .env создан из env.local"
    echo "📝 Отредактируйте .env файл при необходимости"
fi

# Останавливаем существующие контейнеры
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose -f docker-compose-db-api.yml down

# Собираем и запускаем сервисы
echo "🔨 Собираем и запускаем БД и API..."
docker-compose -f docker-compose-db-api.yml up --build -d

# Ждем запуска базы данных
echo "⏳ Ждем запуска базы данных..."
sleep 10

# Проверяем статус контейнеров
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose-db-api.yml ps

echo ""
echo "✅ База данных и API запущены!"
echo ""
echo "🌐 Доступные сервисы:"
echo "   - API: http://localhost:8000"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "📋 Полезные команды:"
echo "   - Просмотр логов: docker-compose -f docker-compose-db-api.yml logs -f"
echo "   - Остановка: docker-compose -f docker-compose-db-api.yml down"
echo "   - Перезапуск: docker-compose -f docker-compose-db-api.yml restart"
echo ""
