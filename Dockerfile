FROM node:14.13.0-alpine3.12

WORKDIR /usr/src/app

COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci

COPY . .

EXPOSE 8081

ENTRYPOINT ["node", "index.js"]
