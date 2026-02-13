FROM node:18-alpine

# OpenSSL va boshqa paketlarni yangilash
RUN apk update && apk upgrade && \
    apk add --no-cache \
    python3 \
    ffmpeg \
    yt-dlp \
    curl \
    openssl \
    ca-certificates && \
    update-ca-certificates

# OpenSSL versiyasini tekshirish
RUN openssl version

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
