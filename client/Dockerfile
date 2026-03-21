FROM node:20.17.0
WORKDIR /realchat/app/client

ENV NODE_ENV=development

COPY package*.json ./
RUN npm ci
RUN npm rebuild esbuild

COPY . .

EXPOSE 3000

# Wait for server to be ready before starting client
RUN npm install -g wait-on

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
