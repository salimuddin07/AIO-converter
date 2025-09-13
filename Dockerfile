# Railway Deployment for Backend
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    imagemagick \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev

WORKDIR /app

# Copy backend files only
COPY backend/package*.json ./
COPY backend/src ./src
COPY backend/server.js ./

# Install dependencies
RUN npm install --only=production

# Create necessary directories
RUN mkdir -p uploads output temp logs

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Start the application
CMD ["node", "server.js"]