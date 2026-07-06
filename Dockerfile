# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# VITE_API_BASE_URL phải là /api (relative) để không bị Mixed Content khi deploy HTTPS
ARG VITE_API_BASE_URL=/api
ARG VITE_TURN_URL=
ARG VITE_TURN_USERNAME=
ARG VITE_TURN_CREDENTIAL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_TURN_URL=${VITE_TURN_URL}
ENV VITE_TURN_USERNAME=${VITE_TURN_USERNAME}
ENV VITE_TURN_CREDENTIAL=${VITE_TURN_CREDENTIAL}
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy as template so nginx envsubst can substitute ${BACKEND_URL} at startup
COPY nginx-websocket-map.conf.template /etc/nginx/templates/websocket-map.conf.template
COPY nginx.conf /etc/nginx/templates/default.conf.template

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
