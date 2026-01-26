# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package definition
COPY package.json yarn.lock ./

# Copy local dependencies
# Note: Ensure this version matches your package.json exactly
COPY axzy_ui_system-v1.0.133.tgz ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build for production
RUN yarn build:prod

# Production Stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage (Vite outputs to 'dist' by default)
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
