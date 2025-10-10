# syntax=docker/dockerfile:1.7

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:22-alpine AS deps
WORKDIR /app

# Add security updates
RUN apk update && apk upgrade && rm -rf /var/cache/apk/*

# Copy only package files for better caching
COPY package.json package-lock.json ./

# Install dependencies with clean install and audit
RUN npm ci --only=production && \
    npm audit fix --audit-level=moderate || true && \
    npm cache clean --force

# ============================================
# Stage 2: Builder
# ============================================
FROM node:22-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./

# Copy source code
COPY . .

# Build application
RUN npm run build && \
    rm -rf node_modules src test e2e .git .github

# ============================================
# Stage 3: Security Scanner (Optional)
# ============================================
FROM aquasec/trivy:latest AS scanner
COPY --from=builder /app/dist /scan
RUN trivy fs --no-progress --security-checks vuln --severity HIGH,CRITICAL /scan || true

# ============================================
# Stage 4: Production
# ============================================
FROM nginx:1.27-alpine AS production

# Security updates
RUN apk update && \
    apk upgrade && \
    apk add --no-cache tini && \
    rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nginx-user && \
    adduser -u 1001 -S nginx-user -G nginx-user

# Copy nginx config with proper permissions
COPY --chown=nginx-user:nginx-user nginx.conf /etc/nginx/conf.d/default.conf
RUN rm /etc/nginx/nginx.conf

# Create custom nginx.conf that doesn't require root
RUN echo 'user nginx-user;\n\
worker_processes auto;\n\
error_log /var/log/nginx/error.log warn;\n\
pid /tmp/nginx.pid;\n\
events {\n\
    worker_connections 1024;\n\
}\n\
http {\n\
    client_body_temp_path /tmp/client_temp;\n\
    proxy_temp_path       /tmp/proxy_temp;\n\
    fastcgi_temp_path     /tmp/fastcgi_temp;\n\
    uwsgi_temp_path       /tmp/uwsgi_temp;\n\
    scgi_temp_path        /tmp/scgi_temp;\n\
    \n\
    include       /etc/nginx/mime.types;\n\
    default_type  application/octet-stream;\n\
    \n\
    log_format main '"'"'$remote_addr - $remote_user [$time_local] "$request" '"'"'\n\
                    '"'"'$status $body_bytes_sent "$http_referer" '"'"'\n\
                    '"'"'"$http_user_agent" "$http_x_forwarded_for"'"'"';\n\
    \n\
    access_log /var/log/nginx/access.log main;\n\
    \n\
    sendfile        on;\n\
    tcp_nopush      on;\n\
    tcp_nodelay     on;\n\
    keepalive_timeout  65;\n\
    types_hash_max_size 2048;\n\
    server_tokens off;\n\
    \n\
    include /etc/nginx/conf.d/*.conf;\n\
}' > /etc/nginx/nginx.conf

# Create required directories with proper permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /tmp/nginx && \
    chown -R nginx-user:nginx-user /var/cache/nginx /var/log/nginx /tmp /etc/nginx

# Copy built application with proper ownership
COPY --from=builder --chown=nginx-user:nginx-user /app/dist /usr/share/nginx/html

# Remove unnecessary files
RUN rm -rf /usr/share/nginx/html/*.map \
           /usr/share/nginx/html/stats.html \
           /usr/share/nginx/html/.git

# Set proper permissions
RUN chmod -R 755 /usr/share/nginx/html && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} \;

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Use non-root user
USER nginx-user

# Use tini for proper signal handling
ENTRYPOINT ["/sbin/tini", "--"]

# Expose port (informational, not binding)
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
