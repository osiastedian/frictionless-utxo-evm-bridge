FROM node:20

WORKDIR /app

COPY ./package.json ./package.json

COPY ./package-lock.json ./package-lock.json

RUN npm ci

COPY ./ ./

RUN npx prisma generate

RUN npm run build

CMD ["npm", "start"]

