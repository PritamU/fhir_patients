# Use Node for building
FROM node:23-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Use a lightweight web server to serve build
FROM node:23-alpine
RUN npm install -g serve
WORKDIR /app
COPY --from=build /app/dist ./dist
CMD ["serve", "-s", "dist", "-l", "3000"]

