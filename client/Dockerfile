FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port 3001 for react
EXPOSE 3001

# Start the development server
CMD ["npm", "start"]
