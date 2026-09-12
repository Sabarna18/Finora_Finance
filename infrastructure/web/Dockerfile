# ==========================================================
# Finora Web Container
# React + Nginx
#
# Local development:
#   Vite API URL defaults to localhost backend
#
# Production:
#   VITE_API_URL is overridden by CI/release at build time.
#
# IMPORTANT:
#   VITE_API_URL is a Vite BUILD-TIME variable.
#   It is intentionally not configured in the Nginx runtime stage.
# ==========================================================


# ==========================================================
# Stage 1 — Frontend Build
# ==========================================================

FROM node:22-alpine AS builder

WORKDIR /frontend


# ==========================================================
# Dependencies
# ==========================================================

COPY frontend/package*.json ./

RUN npm ci


# ==========================================================
# Frontend Source
# ==========================================================

COPY frontend/ ./


# ==========================================================
# Vite Environment
# ==========================================================
#
# Local default:
#   http://localhost:8000/api/v1
#
# CI / production can override this with:
#
#   --build-arg VITE_API_URL=https://<backend>/api/v1
#
# Compose also supplies the value through build.args.
# ==========================================================

ARG VITE_API_URL=http://localhost:8000

ENV VITE_API_URL=${VITE_API_URL}

ENV VITE_APP_VERSION=${VITE_APP_VERSION}


# ==========================================================
# Production Build
# ==========================================================

RUN npm run build


# ==========================================================
# Stage 2 — Nginx Runtime
# ==========================================================

FROM nginx:1.28-alpine


# ==========================================================
# Remove Default Nginx Configuration
# ==========================================================

RUN rm -f /etc/nginx/conf.d/default.conf


# ==========================================================
# Copy React Production Build
# ==========================================================

COPY --from=builder \
    /frontend/dist \
    /usr/share/nginx/html


# ==========================================================
# Copy Finora Nginx Configuration
# ==========================================================

COPY infrastructure/web/nginx.conf \
    /etc/nginx/nginx.conf


# ==========================================================
# Runtime Port
# ==========================================================

EXPOSE 80


# ==========================================================
# Start Nginx
# ==========================================================

CMD ["nginx", "-g", "daemon off;"]