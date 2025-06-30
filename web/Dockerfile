# web/Dockerfile

# Use an official Node.js runtime as a parent image
FROM node:18-alpine as development

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to leverage Docker cache
COPY package*.json ./

# Install project dependencies
RUN npm install -g @angular/cli && npm install

# Copy the rest of the application's source code
COPY . .

# Expose port 4200 to be mapped by Docker Compose
EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "1000"]