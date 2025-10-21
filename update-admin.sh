#!/bin/bash

# Скрипт для обновления админки на Vercel с новыми настройками

echo "🚀 Обновление админки на Vercel..."

# Переходим в папку админки
cd food-delivery-admin

# Создаем .env.local файл с правильными настройками
echo "📝 Создание .env.local..."
cat > .env.local << 'EOF'
# Настройки для продакшена
NEXT_PUBLIC_API_URL=https://odostavka.online/api
NEXT_PUBLIC_API_DOMAIN=odostavka.online
EOF

# Проверяем, что файл создался
if [ -f ".env.local" ]; then
    echo "✅ .env.local создан успешно"
    echo "📋 Содержимое .env.local:"
    cat .env.local
else
    echo "❌ Ошибка создания .env.local"
    exit 1
fi

# Собираем проект
echo "🔨 Сборка проекта..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Сборка успешна"
else
    echo "❌ Ошибка сборки"
    exit 1
fi

# Деплоим на Vercel (если настроен)
echo "🚀 Деплой на Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod
    echo "✅ Деплой завершен"
else
    echo "⚠️  Vercel CLI не установлен. Выполните деплой вручную:"
    echo "   1. Зайдите в панель Vercel"
    echo "   2. Обновите переменные окружения:"
    echo "      NEXT_PUBLIC_API_URL=https://odostavka.online/api"
    echo "      NEXT_PUBLIC_API_DOMAIN=odostavka.online"
    echo "   3. Пересоберите проект"
fi

echo "🎉 Обновление админки завершено!"
