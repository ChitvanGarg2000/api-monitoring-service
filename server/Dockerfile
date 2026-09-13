FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json .

RUN npm install --production

COPY . .

RUN mkdir -p shared/logs

EXPOSE 8000

CMD ["node", "--import", "./src/shared/polyfills/crypto.js", "./src/server.js"]
