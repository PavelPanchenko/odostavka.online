#!/bin/bash

# Скрипт для установки Docker и Docker Compose

echo "🐳 Установка Docker и Docker Compose..."

# Обновляем пакеты
echo "📦 Обновляем пакеты..."
apt update

# Устанавливаем Docker
echo "🐳 Устанавливаем Docker..."
apt install -y docker.io

# Запускаем Docker
echo "🚀 Запускаем Docker..."
systemctl start docker
systemctl enable docker

# Проверяем версию Docker
echo "✅ Проверяем Docker..."
docker --version

# Устанавливаем Docker Compose (новый синтаксис входит в Docker)
echo "🔧 Проверяем Docker Compose..."
docker compose version

echo ""
echo "✅ Docker и Docker Compose установлены!"
echo ""
echo "📋 Теперь можно запустить БД и API:"
echo "   ./start-db-api.sh"
echo ""
