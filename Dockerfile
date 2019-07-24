FROM node:8.12.0
COPY . /app
WORKDIR /app
RUN yarn install
EXPOSE 3001