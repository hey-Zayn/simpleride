# =============================
# GATEWAY - Lean Production Dockerfile
# =============================
FROM node:20-alpine

WORKDIR /app

# Copy package files (leverages Docker cache)
COPY package.json package-lock.json ./

# Install production dependencies only (fast, deterministic)
RUN npm ci --omit=dev

# Copy source code (exclude node_modules via .dockerignore)
COPY . .

EXPOSE 5000

# Production: start directly (no nodemon)
CMD ["node", "src/index.js"]