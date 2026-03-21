FROM node:20.17.0

WORKDIR /realchat/app/client

ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 3000

# Install wait-on
RUN npm install -g wait-on

# 🔥 Clear Vite cache EVERY time container starts
CMD ["sh", "-c", "rm -rf node_modules/.vite && npm run dev -- --host 0.0.0.0"]