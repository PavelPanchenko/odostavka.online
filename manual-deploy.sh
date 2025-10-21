#!/bin/bash

# Скрипт ручного деплоя через GitHub Actions

set -e

echo "🚀 Ручной деплой через GitHub Actions"
echo ""

# Проверяем, что мы в Git репозитории
if [ ! -d ".git" ]; then
    echo "❌ Это не Git репозиторий!"
    exit 1
fi

# Проверяем текущую ветку
CURRENT_BRANCH=$(git branch --show-current)
echo "📋 Текущая ветка: $CURRENT_BRANCH"

# Проверяем, есть ли изменения
if [ -n "$(git status --porcelain)" ]; then
    echo "📝 Есть несохраненные изменения. Сохраняем..."
    git add .
    read -p "Введите сообщение коммита (или нажмите Enter для автоматического): " COMMIT_MSG
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="🚀 Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    git commit -m "$COMMIT_MSG"
fi

# Переключаемся на main ветку если нужно
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "🔄 Переключаемся на main ветку..."
    if git show-ref --verify --quiet refs/heads/main; then
        git checkout main
    elif git show-ref --verify --quiet refs/heads/master; then
        git checkout master
    else
        echo "❌ Ветка main или master не найдена!"
        echo "📋 Создайте main ветку: git checkout -b main"
        exit 1
    fi
    
    # Мержим изменения из текущей ветки
    git merge $CURRENT_BRANCH
fi

# Пушим изменения
echo "📤 Отправляем изменения на GitHub..."
git push origin main

echo ""
echo "✅ Изменения отправлены на GitHub!"
echo "🔄 GitHub Actions должен автоматически запустить деплой"
echo ""
echo "📊 Проверьте статус деплоя:"
echo "   https://github.com/PavelPanchenko/odostavka.online/actions"
echo ""
echo "🌍 После успешного деплоя приложение будет доступно по адресам:"
echo "   - https://odostavka.online"
echo "   - https://admin.odostavka.online"
echo "   - https://api.odostavka.online"
