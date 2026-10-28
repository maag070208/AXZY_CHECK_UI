# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definition (pnpm es el único gestor del proyecto)
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Pass Railway Environment Variables into the build process
ARG VITE_BASE_URL
ARG VITE_GOOGLE_MAPS_API_KEY

ENV VITE_BASE_URL=$VITE_BASE_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

# Build for production
RUN pnpm run build:prod

# Production Stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.inc /etc/nginx/conf.d/security-headers.inc

# Copy build artifacts from builder stage (Vite outputs to 'dist' by default)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
