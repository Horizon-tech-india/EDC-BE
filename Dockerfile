# Build stage
FROM node:14-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm i
COPY . .
RUN npm run build

# Serve stage
FROM nginx:1.21-alpine
#COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/build /usr/share/nginx/html
#EXPOSE 80
ENTRYPOINT [ "nginx", "-g", "daemon off;" ]