# Identity microservice — build self-contained (shared vendorizado em src/shared)
FROM node:22-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 4001

# Aplica migrations e sobe a API
CMD ["sh", "-c", "npm run db:migrate && npm run start:prod"]
