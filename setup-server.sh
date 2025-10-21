#!/bin/bash

# Простой скрипт для установки Docker на сервере
# Запустите этот скрипт на сервере, где нужно установить Docker

echo "🐳 Установка Docker..."

# Обновляем систему
apt update && apt upgrade -y

# Устанавливаем Docker
apt install -y docker.io docker-compose

# Запускаем Docker
systemctl start docker
systemctl enable docker

# Добавляем пользователя в группу docker
usermod -aG docker $USER

# Проверяем установку
echo "✅ Проверка установки:"
docker --version
docker compose version

echo "🎉 Docker установлен!"
echo "⚠️  Перезайдите в систему или выполните 'newgrp docker'"