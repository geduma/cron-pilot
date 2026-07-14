# ---- Stage 1: Build ----
FROM node:20-alpine AS build

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY frontend/package.json frontend/package-lock.json ./frontend/
RUN cd frontend && npm ci

COPY . .
RUN npm run build

# Prune dev dependencies
RUN npm prune --production
RUN cd frontend && npm prune --production

# ---- Stage 2: Production ----
FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

RUN mkdir -p data

COPY --from=build /app/dist ./dist
COPY --from=build /app/frontend/dist ./frontend/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
