# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:20-alpine
WORKDIR /app
COPY package*.json .npmrc ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/db/migrations ./src/db/migrations
EXPOSE 4000
USER node
CMD ["node", "dist/index.js"]