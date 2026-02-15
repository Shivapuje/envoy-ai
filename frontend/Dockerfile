FROM node:18-alpine

WORKDIR /app

# Install wget for healthcheck
RUN apk add --no-cache wget

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

EXPOSE 3000

# Enable polling for file watching in Docker
ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "dev"]
