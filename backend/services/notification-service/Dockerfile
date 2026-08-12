FROM node:20-alpine

WORKDIR /app

COPY package*.json .

RUN npm install

COPY prisma ./prisma/

COPY . .

RUN npx prisma generate

CMD ["npm", "run", "dev"]