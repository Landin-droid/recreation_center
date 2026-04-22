FROM node:20-alpine AS builder

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Prisma Client и компилируем TypeScript
RUN npx prisma generate
RUN npm run build

# ---
# Этап продакшена (уменьшаем размер образа)
FROM node:20-alpine

WORKDIR /app

# Копируем только необходимое из builder-этапа
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Задаем переменные окружения по умолчанию
ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

# Запускаем миграции БД и стартуем сервер
# Выполняем migrate deploy при старте контейнера, чтобы БД всегда была актуальна
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]