# web/Dockerfile

# Development stage
FROM node:18-alpine as development

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install -g @angular/cli && npm install

COPY . .

EXPOSE 4200

CMD ["ng", "serve", "--host", "0.0.0.0", "--poll", "1000"]

# Build stage
FROM node:18-alpine as build

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install -g @angular/cli && npm ci --only=production

COPY . .
RUN ng build --configuration=production

# Production stage
FROM nginx:alpine as production

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built app from build stage
COPY --from=build /usr/src/app/dist/craftmyself /usr/share/nginx/html

# Create a non-root user
RUN addgroup -g 1001 -S nginx
RUN adduser -S nginx -u 1001

# Change ownership of nginx directories
RUN chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]