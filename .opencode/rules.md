# Mandatory System Rules

## 1. Safety & Execution

- DO NOT execute destructive commands (`rm -rf`, `docker system prune`, `git reset --hard`) without user confirmation.
- Keep modifications scoped ONLY to the requested service.

## 2. Microservices & Networking

- Services MUST communicate asynchronously via RabbitMQ (`ride_events` exchange) or synchronously via gRPC (`location-service:50051`).
- DO NOT create direct inter-service REST HTTP endpoints between backend services (all external traffic goes through API Gateway on `:5000`).

## 3. Database & Caching

- Continuous GPS driver locations MUST be written ONLY to Redis (`GEOADD`). Never persist streaming GPS updates directly to PostgreSQL/MongoDB.
- Use atomic Prisma transactions (`$transaction`) when resolving driver bids to prevent race conditions.

## 4. Docker & CI/CD

- Use multi-stage `node:20-alpine` builds.
- Ensure `COPY package*.json` and `npm ci` run before copying app code for caching.
- Place `npx prisma generate` before full application code copy.

## 5. Check the code for bugs

- If you find any bug report me first then fix it.

## 6. Opmized code for the speed, proformace when you write frontend code

- Write optmized code for the speed, proformace especially for the frontend,

## 7 Dont change the ports

- If you find any issue with the port tell me dont do it by yourself
