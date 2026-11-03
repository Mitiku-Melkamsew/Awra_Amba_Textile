FROM node:20-slim AS builder

WORKDIR /app

# Install openssl for prisma engine
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src/

RUN npm run build

# Runner stage
FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci && npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3001

ENV NODE_ENV=production
ENV PORT=3001

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db push --accept-data-loss && node dist/index.js"]
