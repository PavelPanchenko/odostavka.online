# 🚀 Развертывание админки на Vercel

## 📋 Подготовка к деплою

### 1. **Создайте аккаунт на Vercel:**
- Перейдите на: https://vercel.com
- Войдите через GitHub

### 2. **Подготовьте репозиторий:**
- Убедитесь, что админка находится в папке `food-delivery-admin/`
- Файл `vercel.json` уже создан

### 3. **Настройте переменные окружения в Vercel:**
- `NEXT_PUBLIC_API_URL` = `https://api.odostavka.online`

## 🚀 Деплой на Vercel

### Вариант 1: Через веб-интерфейс Vercel

1. **Перейдите в Vercel Dashboard**
2. **Нажмите "New Project"**
3. **Выберите ваш GitHub репозиторий**
4. **Настройте проект:**
   - **Root Directory:** `food-delivery-admin`
   - **Framework Preset:** `Next.js`
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`

### Вариант 2: Через Vercel CLI

```bash
# Установите Vercel CLI
npm i -g vercel

# Перейдите в папку админки
cd food-delivery-admin

# Войдите в Vercel
vercel login

# Деплой
vercel --prod
```

## 🔧 Настройка домена

### 1. **В Vercel Dashboard:**
- Перейдите в настройки проекта
- **Domains** → **Add Domain**
- Добавьте: `admin.odostavka.online`

### 2. **Настройте DNS:**
```
CNAME    admin.odostavka.online    cname.vercel-dns.com
```

## 📊 Преимущества Vercel

- ✅ **Автоматический деплой** при push в main ветку
- ✅ **CDN** для быстрой загрузки
- ✅ **SSL сертификаты** автоматически
- ✅ **Масштабирование** без ограничений
- ✅ **Аналитика** и мониторинг
- ✅ **Снижение нагрузки** на основной сервер

## 🔄 Автоматический деплой

После настройки, каждый push в main ветку будет автоматически деплоить админку на Vercel!

## 📱 Проверка деплоя

После успешного деплоя админка будет доступна по адресу:
- **https://admin.odostavka.online**

## 🛠️ Устранение неполадок

### Проблемы с билдом:
- Проверьте логи в Vercel Dashboard
- Убедитесь, что все зависимости в `package.json`

### Проблемы с доменом:
- Проверьте DNS настройки
- Убедитесь, что домен добавлен в Vercel

### Проблемы с API:
- Проверьте переменную `NEXT_PUBLIC_API_URL`
- Убедитесь, что API доступен по адресу `https://api.odostavka.online`
