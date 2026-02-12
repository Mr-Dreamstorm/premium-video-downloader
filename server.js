import express from 'express';
import cors from 'cors';
import youtubedl from 'yt-dlp-exec';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

// yt-dlp ni o'rnatilganligini tekshirish
app.get('/health', async (req, res) => {
  try {
    const version = await youtubedl.execPromise(['--version']);
    res.json({ status: 'OK', version: version.trim() });
  } catch (error) {
    res.json({ status: 'ERROR', error: error.message });
  }
});

// UNIVERSAL DOWNLOADER - 1000+ PLATFORMA
app.get('/download', async (req, res) => {
  let tempFile = null;
  
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL kerak' });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📥 YUKLANMOQDA: ${videoUrl}`);
    console.log('='.repeat(60));

    // Vaqtinchalik fayl nomi
    tempFile = path.join(__dirname, `temp_${Date.now()}.mp4`);

    // yt-dlp orqali yuklab olish
    const options = {
      output: tempFile,
      format: 'best[ext=mp4]/best',
      noPlaylist: true,
      quiet: true,
      noWarnings: true
    };

    console.log('⏳ Yuklab olinmoqda...');
    await youtubedl(videoUrl, options);
    
    // Fayl hajmini tekshirish
    const stats = fs.statSync(tempFile);
    console.log(`✅ Yuklandi: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Faylni o'qish
    const fileBuffer = fs.readFileSync(tempFile);
    
    // Fayl nomi
    const fileName = `premium_video_${Date.now()}.mp4`;

    // Yuborish
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stats.size);
    res.send(fileBuffer);

    console.log('✅ Yuklab olish tugadi!');

  } catch (error) {
    console.error('❌ Xatolik:', error.message);
    res.status(500).json({ 
      error: 'Yuklab olishda xatolik',
      details: error.message
    });
  } finally {
    // Vaqtinchalik faylni o'chirish
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
});

// PLATFORMA BO'YICHA DOWNLOAD
app.get('/download/:platform', async (req, res) => {
  let tempFile = null;
  
  try {
    const { platform } = req.params;
    const videoUrl = req.query.url;
    
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL kerak' });
    }

    tempFile = path.join(__dirname, `temp_${platform}_${Date.now()}.mp4`);
    
    const options = {
      output: tempFile,
      format: 'best[ext=mp4]/best',
      noPlaylist: true,
      quiet: true
    };

    await youtubedl(videoUrl, options);
    
    const fileBuffer = fs.readFileSync(tempFile);
    const fileName = `${platform}_${Date.now()}.mp4`;

    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.send(fileBuffer);

  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    if (tempFile && fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🎬 PREMIUM VIDEO DOWNLOADER</title>
        <style>
            body { font-family: Arial; background: #0a0a1a; color: white; padding: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            h1 { color: #00d4ff; }
            .success { color: #00ff00; }
            code { background: #1a1a2e; padding: 10px; display: block; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎬 PREMIUM VIDEO DOWNLOADER</h1>
            <p class="success">✅ Server ishga tushdi!</p>
            <h3>📋 Qo'llab-quvvatlanadigan platformalar:</h3>
            <ul>
                <li>▶️ YouTube</li>
                <li>📘 Facebook</li>
                <li>📸 Instagram</li>
                <li>🎵 TikTok</li>
                <li>🐦 Twitter/X</li>
                <li>📌 Pinterest</li>
                <li>✂️ CapCut</li>
                <li>🎬 Likee</li>
                <li>📹 Dailymotion</li>
                <li>🎥 Vimeo</li>
                <li>💬 Telegram</li>
                <li>➕ 1000+ platforma</li>
            </ul>
            <h3>🔧 Ishlatish:</h3>
            <code>/download?url=VIDEO_URL</code>
            <h3>📌 Misol:</h3>
            <code>/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ</code>
        </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PREMIUM VIDEO DOWNLOADER (yt-dlp)');
  console.log('='.repeat(60));
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🎯 Platformalar: 1000+`);
  console.log('='.repeat(60) + '\n');
});
