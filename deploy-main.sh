#!/bin/bash

# Скрипт для развертывания основного приложения на сервере 83.217.223.185

echo "🚀 Развертывание основного приложения на сервере 83.217.223.185..."

# Копируем файлы на сервер
echo "📁 Копирование файлов..."
scp docker-compose.yml root@83.217.223.185:/root/
scp -r nginx/ root@83.217.223.185:/root/
scp -r food-delivery-api/ root@83.217.223.185:/root/
scp -r food-delivery-client/ root@83.217.223.185:/root/
scp env.example root@83.217.223.185:/root/.env

# Подключаемся к серверу и запускаем
echo "🔧 Настройка на сервере..."
ssh root@83.217.223.185 << 'EOF'
    # Останавливаем существующие контейнеры
    docker-compose down
    
    # Собираем и запускаем новые контейнеры
    docker-compose up -d --build
    
    # Проверяем статус
    docker-compose ps
    
    echo "✅ Основное приложение развернуто на домене odostavka.online"
EOF

echo "🎉 Развертывание основного приложения завершено!"
