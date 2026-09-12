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
#   VITE_API_URL and VITE_APP_VERSION are Vite BUILD-TIME
#   variables.
#   VITE_APP_VERSION is also retained as final-image metadata
#   so deployment can verify release integrity.
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

# Local default
ARG VITE_API_URL=http://localhost:8000/api/v1

# Application version
#
# Release pipeline supplies the actual semantic version:
#   VITE_APP_VERSION=1.0.3
#
# Local development falls back to:
#   vdev
ARG VITE_APP_VERSION=vdev

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
# Retain Release Version as Final Image Metadata
# ==========================================================

# ARG must be redeclared because this is a new build stage.
ARG VITE_APP_VERSION=vdev

ENV VITE_APP_VERSION=${VITE_APP_VERSION}


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