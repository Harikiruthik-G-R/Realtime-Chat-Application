FROM node:20.17.0 as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build   # 🔥 build static files


# ---- Serve with NGINX ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]