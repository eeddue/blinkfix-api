FROM node:16.15-alpine AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install 
COPY . .

RUN npm run build

FROM node:16.15-alpine as production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn install --production

COPY --from=development /usr/src/app/node_modules ./node_modules
COPY --from=development /usr/src/app/package*.json ./
COPY --from=development /usr/src/app/build ./build
EXPOSE 3000

CMD ["npm", "run", "start"]