#!/bin/bash

# Скрипт для развертывания основного приложения на сервере 83.217.223.185

echo "🚀 Развертывание основного приложения на сервере 83.217.223.185..."

# Копируем файлы на сервер
echo "📁 Копирование файлов..."
scp install-docker.sh root@83.217.223.185:/root/
scp docker-compose.yml root@83.217.223.185:/root/
scp -r nginx/ root@83.217.223.185:/root/
scp -r food-delivery-api/ root@83.217.223.185:/root/
scp -r food-delivery-client/ root@83.217.223.185:/root/
scp env.example root@83.217.223.185:/root/.env

# Подключаемся к серверу и настраиваем
echo "🔧 Настройка на сервере..."
ssh root@83.217.223.185 << 'EOF'
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
    docker compose down 2>/dev/null || true
    
    # Собираем и запускаем новые контейнеры
    echo "🚀 Запуск основного приложения..."
    docker compose up -d --build
    
    # Ждем запуска
    sleep 15
    
    # Проверяем статус
    echo "📊 Статус контейнеров:"
    docker compose ps
    
    # Проверяем подключение к базе данных
    echo "🔍 Проверка подключения к БД..."
    if nc -z 212.192.217.128 5432; then
        echo "✅ PostgreSQL доступен"
    else
        echo "❌ PostgreSQL недоступен"
    fi
    
    if nc -z 212.192.217.128 6379; then
        echo "✅ Redis доступен"
    else
        echo "❌ Redis недоступен"
    fi
    
    # Проверяем доступность API
    echo "🔍 Проверка API..."
    curl -f http://localhost:8000/api/health || echo "⚠️  API недоступен"
    
    # Проверяем доступность клиента
    echo "🔍 Проверка клиента..."
    curl -f http://localhost:3000 || echo "⚠️  Клиент недоступен"
    
    echo "✅ Основное приложение развернуто на домене odostavka.online"
    echo "🌐 API: http://83.217.223.185:8000"
    echo "🌐 Клиент: http://83.217.223.185:3000"
    echo "🌐 Nginx: http://83.217.223.185"
EOF

echo "🎉 Развертывание основного приложения завершено!"
