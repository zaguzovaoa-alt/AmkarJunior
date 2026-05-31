FROM node:18-alpine

WORKDIR /app

# Install dependencies needed for build
COPY package.json package-lock.json* ./
RUN npm install

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose port (Timeweb Apps typically use 8080 or port from ENV)
ENV PORT=3000
EXPOSE 3000

# Run the app
CMD ["npm", "start"]
