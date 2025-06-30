# api/Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:18-alpine as development

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install project dependencies and nodemon globally
RUN npm install

# Copy the rest of the application's source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Command to run the backend with nodemon for hot-reloading
# It will watch for changes in .ts files and execute index.ts
CMD ["npm", "run", "dev"]