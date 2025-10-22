#!/bin/bash

# Скрипт для запуска полного стека на одном сервере
# Включает: PostgreSQL, Redis, API, Client, Nginx

echo "🚀 Запуск полного стека приложения доставки еды..."

# Проверяем наличие файла окружения
if [ ! -f ".env" ]; then
    echo "⚠️  Файл .env не найден. Копируем из env.local..."
    cp env.local .env
    echo "✅ Файл .env создан из env.local"
    echo "📝 Отредактируйте .env файл при необходимости"
fi

# Останавливаем существующие контейнеры
echo "🛑 Останавливаем существующие контейнеры..."
docker-compose -f docker-compose-full.yml down

# Собираем и запускаем все сервисы
echo "🔨 Собираем и запускаем все сервисы..."
docker-compose -f docker-compose-full.yml up --build -d

# Ждем запуска базы данных
echo "⏳ Ждем запуска базы данных..."
sleep 10

# Проверяем статус контейнеров
echo "📊 Статус контейнеров:"
docker-compose -f docker-compose-full.yml ps

echo ""
echo "✅ Полный стек запущен!"
echo ""
echo "🌐 Доступные сервисы:"
echo "   - Веб-приложение: http://localhost"
echo "   - API: http://localhost/api"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "📋 Полезные команды:"
echo "   - Просмотр логов: docker-compose -f docker-compose-full.yml logs -f"
echo "   - Остановка: docker-compose -f docker-compose-full.yml down"
echo "   - Перезапуск: docker-compose -f docker-compose-full.yml restart"
echo ""
