#!/bin/bash

echo "🔍 Быстрая проверка Docker с базой данных"
echo "========================================"

# Проверка статуса контейнеров
echo "📊 Статус контейнеров:"
docker compose -f docker-compose-database.yml ps

echo ""
echo "🔍 Проверка PostgreSQL:"
if docker compose -f docker-compose-database.yml exec postgres pg_isready -U food_delivery_user -d food_delivery > /dev/null 2>&1; then
    echo "✅ PostgreSQL работает"
else
    echo "❌ PostgreSQL недоступен"
fi

echo ""
echo "🔍 Проверка Redis:"
if docker compose -f docker-compose-database.yml exec redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis работает"
else
    echo "❌ Redis недоступен"
fi

echo ""
echo "🌐 Проверка портов:"
if netstat -tlnp | grep :5432 > /dev/null; then
    echo "✅ PostgreSQL порт 5432 открыт"
else
    echo "❌ PostgreSQL порт 5432 закрыт"
fi

if netstat -tlnp | grep :6379 > /dev/null; then
    echo "✅ Redis порт 6379 открыт"
else
    echo "❌ Redis порт 6379 закрыт"
fi

echo ""
echo "📈 Использование ресурсов:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
