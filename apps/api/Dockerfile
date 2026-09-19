FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json tsconfig.json turbo.json ./

# Copy app package files
COPY apps/api/package.json apps/api/package-lock.json ./apps/api/
COPY apps/api/tsconfig.json ./apps/api/

# Copy Prisma schema
COPY apps/api/prisma ./apps/api/prisma

# Install dependencies
RUN npm ci

# Copy source code
COPY apps/api/src ./apps/api/src

# Build
RUN npm run build --workspace=@demurrageos/api

EXPOSE 3000

CMD ["node", "apps/api/dist/server.js"]
