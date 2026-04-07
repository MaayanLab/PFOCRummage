FROM node:22
WORKDIR /app
ADD package.json .
ADD package-lock.json .
RUN npm i
ADD . .
RUN PUBLIC_URL=https://pfocrummage.maayanlab.cloud npm run build && rm .env
CMD ["npm", "start"]