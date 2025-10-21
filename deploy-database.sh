#!/bin/bash

# Скрипт для развертывания базы данных на сервере 212.192.217.128

echo "🚀 Развертывание базы данных на сервере 212.192.217.128..."

# Копируем файлы на сервер
echo "📁 Копирование файлов..."
scp install-docker.sh root@212.192.217.128:/root/
scp docker-compose-database.yml root@212.192.217.128:/root/
scp env.database.production root@212.192.217.128:/root/.env

# Подключаемся к серверу и настраиваем
echo "🔧 Настройка на сервере..."
ssh root@212.192.217.128 << 'EOF'
    # Проверяем, установлен ли Docker
    if ! command -v docker &> /dev/null; then
        echo "🐳 Docker не установлен. Устанавливаем..."
        chmod +x install-docker.sh
        ./install-docker.sh
        
        # Перезагружаем группу docker
        newgrp docker
    else
        echo "✅ Docker уже установлен"
    fi
    
    # Останавливаем существующие контейнеры (если есть)
    docker compose -f docker-compose-database.yml down 2>/dev/null || true
    
    # Запускаем новые контейнеры
    echo "🚀 Запуск контейнеров базы данных..."
    docker compose -f docker-compose-database.yml up -d
    
    # Ждем запуска
    sleep 10
    
    # Проверяем статус
    echo "📊 Статус контейнеров:"
    docker compose -f docker-compose-database.yml ps
    
    # Проверяем подключение к базе данных
    echo "🔍 Проверка подключения к PostgreSQL..."
    docker compose -f docker-compose-database.yml exec postgres pg_isready -U food_delivery_user -d food_delivery
    
    echo "🔍 Проверка подключения к Redis..."
    docker compose -f docker-compose-database.yml exec redis redis-cli ping
    
    echo "✅ База данных развернута на портах 5432 и 6379"
    echo "🌐 Доступ к PostgreSQL: 212.192.217.128:5432"
    echo "🌐 Доступ к Redis: 212.192.217.128:6379"
EOF

echo "🎉 Развертывание базы данных завершено!"
