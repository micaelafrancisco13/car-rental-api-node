# Use the official Node.js image
FROM node:22.12.0-bookworm

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install -g nodemon
RUN npm install

# Copy the application code
COPY . .

# Expose the port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]
