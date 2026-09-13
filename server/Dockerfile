FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate

ENV NODE_ENV=production

EXPOSE 3001

CMD ["node", "dist/index.js"]
