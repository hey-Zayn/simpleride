# =============================
# RIDE SERVICE - Lean Production Dockerfile
# =============================
FROM node:20-alpine

WORKDIR /app

# Copy package files (leverages Docker cache)
COPY package.json package-lock.json ./

# Install production dependencies only (fast, deterministic)
RUN npm ci --include=dev

# Copy source code (exclude node_modules via .dockerignore)
COPY . .

RUN npx prisma generate && npm prune --omit=dev

EXPOSE 4004

# Production: start directly (no nodemon)
CMD ["node", "src/index.js"]