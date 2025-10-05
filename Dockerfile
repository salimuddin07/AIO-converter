# Backend Docker image - Optimized for Render deployment
FROM node:20-alpine

# Install system dependencies in the correct order
RUN apk add --no-cache \
    # Basic build tools
    python3 \
    make \
    g++ \
    # Media processing
    ffmpeg \
    imagemagick \
    # Canvas and image processing dependencies
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    # Additional dependencies for Sharp
    vips-dev \
    # pkg-config for native builds
    pkgconfig

WORKDIR /app

# Copy package files first for better layer caching
COPY backend/package*.json ./

# Install dependencies with verbose logging
RUN npm ci --omit=dev --verbose

# Copy application code
COPY backend/src ./src
COPY backend/server.js ./

# Create necessary directories
RUN mkdir -p uploads output temp logs

# Set permissions
RUN chmod +x server.js

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV NPM_CONFIG_UNSAFE_PERM=true

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/api/convert/test', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["node", "server.js"]