# Multi-stage Docker build for Fullstack Naja Rose Store
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace package files
COPY package.json ./
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY frontend/package*.json ./frontend/

# Install dependencies for both workspaces
RUN cd backend && npm install
RUN cd frontend && npm install

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Generate Prisma Client & Build both apps
RUN cd backend && npx prisma generate && npm run build
RUN cd frontend && npm run build

# Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy production backend files and built frontend dist
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/frontend/dist ./frontend/dist
COPY package.json ./

EXPOSE 5000

CMD ["sh", "-c", "npx --prefix backend prisma db push && npm --prefix backend start"]
