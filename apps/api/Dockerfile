FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY packages ./packages
COPY apps/api ./apps/api
RUN npm install
RUN npm run build --workspace=packages/shared-types
RUN npm run build --workspace=apps/api

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 4000
CMD ["node", "apps/api/dist/server.js"]
