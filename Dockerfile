# Use Node.js 20 slim image
FROM node:20-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    coreutils \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libpango-1.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including devDependencies if needed for build steps)
RUN npm install

# Install Playwright browser
RUN npx playwright install chromium

# Copy the rest of the application
COPY . .

# Expose the port (Railway uses PORT env var)
EXPOSE 3001

# Start the server
CMD ["node", "server/index.js"]
