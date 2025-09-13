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

# Copy package files
COPY backend/package*.json ./
RUN npm install --production

# Copy backend source
COPY backend/ ./

# Create necessary directories
RUN mkdir -p uploads output temp logs

# Expose port
EXPOSE 8080

# Set environment variable for Railway
ENV NODE_ENV=production
ENV PORT=8080

# Start the application
CMD ["npm", "start"]