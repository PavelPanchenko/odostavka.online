# 🔧 Инструкция по обновлению админки

## Проблема
Админка на Vercel (`https://odostavka-admin.vercel.app`) сейчас подключается к API по старому адресу. После разделения серверов нужно обновить настройки.

## ✅ Что нужно сделать

### 1. Обновите переменные окружения в Vercel

Зайдите в панель Vercel для проекта `food-delivery-admin` и обновите переменные окружения:

```
NEXT_PUBLIC_API_URL=https://odostavka.online/api
NEXT_PUBLIC_API_DOMAIN=odostavka.online
```

### 2. Альтернативный способ - через Vercel CLI

```bash
# Перейдите в папку админки
cd food-delivery-admin

# Установите переменные окружения
vercel env add NEXT_PUBLIC_API_URL
# Введите: https://odostavka.online/api

vercel env add NEXT_PUBLIC_API_DOMAIN  
# Введите: odostavka.online

# Деплой
vercel --prod
```

### 3. Проверка работы

После обновления проверьте:

1. **Админка доступна**: https://odostavka-admin.vercel.app
2. **API отвечает**: https://odostavka.online/api/health
3. **CORS настроен**: Админка может делать запросы к API

### 4. Если что-то не работает

Проверьте логи в Vercel и убедитесь, что:
- Переменные окружения установлены правильно
- API доступен по адресу `https://odostavka.online/api`
- CORS настроен в API для домена `https://odostavka-admin.vercel.app`

## 🔄 Автоматическое обновление

Используйте скрипт для автоматического обновления:

```bash
./update-admin.sh
```

Этот скрипт:
- Создаст правильный `.env.local`
- Соберет проект
- Задеплоит на Vercel (если настроен CLI)
