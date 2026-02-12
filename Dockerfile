FROM node:18-alpine

# yt-dlp va ffmpeg o'rnatish
RUN apk add --no-cache \
    python3 \
    ffmpeg \
    yt-dlp \
    curl

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
