FROM node:20.17.0
WORKDIR /realchat/app/server
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]