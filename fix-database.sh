#!/bin/bash

echo "🔧 Исправление проблемы с PostgreSQL..."

# Останавливаем контейнеры
echo "⏹️  Останавливаем контейнеры..."
docker compose -f docker-compose-database.yml down

# Удаляем проблемные тома
echo "🗑️  Удаляем старые тома..."
docker volume rm food_delivery_postgres_data 2>/dev/null || true

# Создаем правильный .env файл
echo "📝 Создаем правильный .env файл..."
cat > .env << 'EOF'
POSTGRES_DB=food_delivery
POSTGRES_USER=food_delivery_user
POSTGRES_PASSWORD=FoodDelivery2024!SecurePass
POSTGRES_HOST_AUTH_METHOD=md5
EOF

# Запускаем контейнеры
echo "🚀 Запускаем контейнеры..."
docker compose -f docker-compose-database.yml up -d

# Ждем запуска
echo "⏳ Ждем запуска PostgreSQL..."
sleep 10

# Проверяем статус
echo "📊 Статус контейнеров:"
docker compose -f docker-compose-database.yml ps

# Проверяем подключение
echo "🔍 Проверка подключения к PostgreSQL:"
if docker compose -f docker-compose-database.yml exec postgres pg_isready -U food_delivery_user -d food_delivery; then
    echo "✅ PostgreSQL работает!"
else
    echo "❌ PostgreSQL не отвечает. Проверьте логи:"
    docker compose -f docker-compose-database.yml logs postgres
fi

echo "🔍 Проверка подключения к Redis:"
if docker compose -f docker-compose-database.yml exec redis redis-cli ping; then
    echo "✅ Redis работает!"
else
    echo "❌ Redis не отвечает. Проверьте логи:"
    docker compose -f docker-compose-database.yml logs redis
fi
