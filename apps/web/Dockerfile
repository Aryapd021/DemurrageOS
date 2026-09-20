FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY apps/web ./apps/web
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
