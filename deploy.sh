#!/bin/bash
# deploy.sh

# Переходимо в директорію проєкту
# Замініть /path/to/your/project на реальний шлях на вашому сервері
cd /path/to/your/project 

# Завантажуємо останні зміни з гілки main
echo "Pulling latest changes from git..."
git pull origin main

# Перебудовуємо та перезапускаємо Docker контейнери в фоновому режимі
echo "Rebuilding and restarting Docker containers..."
docker-compose up --build -d

# Очищуємо старі, невикористовувані образи, щоб зекономити місце
echo "Pruning old docker images..."
docker image prune -f

echo "Deployment finished successfully!"