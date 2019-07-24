FROM node:8.12.0
COPY . /app
WORKDIR /app
RUN cnpm install
EXPOSE 3001