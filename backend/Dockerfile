FROM node:20-alpine
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install

COPY backend /app/backend
COPY db /app/db

EXPOSE 5000
CMD ["npm", "run", "dev"]