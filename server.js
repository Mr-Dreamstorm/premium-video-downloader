import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

// ========== COOKIE FAYLNI TEKSHIRISH ==========
const COOKIE_FILE = path.join(__dirname, 'cookies.txt');
let hasCookies = fs.existsSync(COOKIE_FILE);

console.log('\n' + '='.repeat(60));
console.log('🚀 PREMIUM VIDEO DOWNLOADER SERVER');
console.log('='.repeat(60));
console.log(`🍪 Cookie fayl ${hasCookies ? 'mavjud ✅' : 'mavjud emas ❌'}`);
console.log('='.repeat(60) + '\n');

// ========== UNIVERSAL DOWNLOAD ENDPOINT ==========
app.get('/download', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL kerak' });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📥 YUKLANMOQDA: ${videoUrl}`);
    console.log('='.repeat(60));

    // Platformani aniqlash
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const isInstagram = videoUrl.includes('instagram.com');
    const isTikTok = videoUrl.includes('tiktok.com');
    const isFacebook = videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch');
    const isTwitter = videoUrl.includes('twitter.com') || videoUrl.includes('x.com');
    const isPinterest = videoUrl.includes('pinterest.com');
    
    // yt-dlp buyrug'ini tuzish
    let command = 'yt-dlp';
    
    // Format: eng yaxshi mp4
    command += ' -f "best[ext=mp4]/best"';
    
    // Chiqish fayli: stdout (buferga)
    command += ' -o -';
    
    // Playlist emas, bitta video
    command += ' --no-playlist';
    
    // Minimal chiqish (faqat xatoliklar)
    command += ' --quiet';
    
    // Progress ko'rsatish (ixtiyoriy)
    // command += ' --progress';
    
    // Xatolikda qayta urinish
    command += ' --retries 3';
    
    // ===== YOUTUBE UCHUN MAXSUS SOZLAMALAR =====
    if (isYouTube) {
      console.log('🎯 Platforma: YouTube');
      
      // So'rovlar orasida kutish (rate limiting uchun)
      command += ' --sleep-interval 5';
      command += ' --max-sleep-interval 10';
      command += ' --retry-sleep 5';
      
      // Brauzer User-Agent (bot emasdek ko'rinish uchun)
      command += ' --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"';
      
      // Cookie fayl mavjud bo'lsa
      if (hasCookies) {
        command += ` --cookies "${COOKIE_FILE}"`;
        console.log('🍪 Cookie ishlatilmoqda');
      } else {
        // Cookie bo'lmasa, alternativ usullar
        console.log('⚠️ Cookie yo\'q, alternativ usul ishlatilmoqda');
        command += ' --extractor-args "youtube:player_client=android_embedded,ios"';
        command += ' --extractor-args "youtube:skip=webpage"';
        command += ' --geo-bypass';
      }
      
      // Throttling dan qochish
      command += ' --throttled-rate 100';
    }
    
    // ===== INSTAGRAM UCHUN =====
    else if (isInstagram) {
      console.log('🎯 Platforma: Instagram');
      command += ' --user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"';
    }
    
    // ===== TIKTOK UCHUN =====
    else if (isTikTok) {
      console.log('🎯 Platforma: TikTok');
      command += ' --user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"';
    }
    
    // ===== FACEBOOK UCHUN =====
    else if (isFacebook) {
      console.log('🎯 Platforma: Facebook');
      command += ' --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"';
    }
    
    // ===== TWITTER UCHUN =====
    else if (isTwitter) {
      console.log('🎯 Platforma: Twitter/X');
      command += ' --user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"';
    }
    
    // ===== PINTEREST UCHUN =====
    else if (isPinterest) {
      console.log('🎯 Platforma: Pinterest');
      command += ' --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"';
    }
    
    // Umumiy parametr: video URL
    command += ` "${videoUrl}"`;
    
    console.log('⚙️ Buyruq tuzildi');
    console.log('⏳ Yuklab olinmoqda...');
    
    // yt-dlp ni ishga tushirish
    const ytdlp = exec(command, {
      maxBuffer: 1024 * 1024 * 100 // 100MB buffer
    });
    
    let videoBuffer = Buffer.from('');
    let errorMessage = '';
    
    // stdout dan video ma'lumotlarini yig'ish
    ytdlp.stdout.on('data', (data) => {
      videoBuffer = Buffer.concat([videoBuffer, data]);
    });
    
    // stderr dan xatoliklarni yig'ish
    ytdlp.stderr.on('data', (data) => {
      const msg = data.toString();
      errorMessage += msg;
      
      // Progressni ko'rsatish (ixtiyoriy)
      if (msg.includes('Destination') || msg.includes('Downloading')) {
        console.log(`   ${msg.trim()}`);
      }
    });
    
    // Buyruq tugaganda
    ytdlp.on('close', (code) => {
      if (code === 0 && videoBuffer.length > 0) {
        // Muvaffaqiyatli
        console.log(`✅ Yuklandi: ${(videoBuffer.length / 1024 / 1024).toFixed(2)} MB`);
        
        // Fayl nomi yaratish
        const timestamp = Date.now();
        const filename = `premium_video_${timestamp}.mp4`;
        
        // Headers
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Length', videoBuffer.length);
        
        // Videoni yuborish
        res.send(videoBuffer);
        
        console.log('✅ Yuklab olish tugadi!\n');
      } else {
        // Xatolik
        console.error('❌ Xatolik:', errorMessage || 'Noma\'lum xatolik');
        
        res.status(500).json({
          error: 'Yuklab olishda xatolik',
          details: errorMessage || 'Noma\'lum xatolik',
          tip: isYouTube && !hasCookies 
            ? 'YouTube uchun cookie fayl kerak. Brauzeringizdan cookies.txt eksport qiling va GitHub\'ga yuklang.'
            : 'Boshqa URL sinab ko\'ring yoki keyinroq qayta urining.'
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Server xatoligi:', error);
    res.status(500).json({ 
      error: 'Server xatoligi',
      details: error.message 
    });
  }
});

// ========== COOKIE YUKLASH ENDPOINTI ==========
app.post('/upload-cookies', express.raw({ type: 'text/plain', limit: '1mb' }), (req, res) => {
  try {
    const cookieData = req.body.toString();
    
    // Cookies.txt formatida ekanligini tekshirish
    if (!cookieData.includes('.youtube.com') && !cookieData.includes('HTTP')) {
      return res.status(400).json({ 
        error: 'Noto\'g\'ri cookie formati',
        tip: 'Cookie fayl Netscape formatida bo\'lishi kerak'
      });
    }
    
    // Cookie faylga yozish
    fs.writeFileSync(COOKIE_FILE, cookieData);
    hasCookies = true;
    
    console.log('✅ Yangi cookie fayl yuklandi');
    res.json({ 
      success: true, 
      message: 'Cookie fayl muvaffaqiyatli yuklandi' 
    });
    
  } catch (error) {
    console.error('❌ Cookie yuklash xatoligi:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== STATUS ENDPOINTI ==========
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    cookies: hasCookies ? 'mavjud ✅' : 'mavjud emas ❌',
    platforms: [
      'YouTube', 'Instagram', 'TikTok', 'Facebook',
      'Twitter/X', 'Pinterest', 'Vimeo', 'Dailymotion',
      'Twitch', 'Reddit', 'Telegram', '+1000'
    ]
  });
});

// ========== ASOSIY SAHIFA ==========
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>🎬 PREMIUM VIDEO DOWNLOADER</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                background: linear-gradient(135deg, #0a0a1a, #001c3d);
                color: white;
                margin: 0;
                padding: 40px 20px;
                min-height: 100vh;
            }
            .container {
                max-width: 900px;
                margin: 0 auto;
                background: rgba(255,255,255,0.05);
                backdrop-filter: blur(10px);
                border-radius: 32px;
                padding: 40px;
                border: 1px solid #00d4ff;
                box-shadow: 0 0 30px rgba(0,212,255,0.3);
            }
            h1 {
                color: #00d4ff;
                font-size: 2.5em;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 15px;
            }
            .status {
                background: rgba(0,255,0,0.1);
                border: 2px solid #00ff00;
                border-radius: 16px;
                padding: 20px;
                margin: 20px 0;
            }
            .platform-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
                gap: 15px;
                margin: 30px 0;
            }
            .platform {
                background: rgba(255,255,255,0.1);
                border-radius: 12px;
                padding: 15px;
                text-align: center;
                border: 1px solid #00d4ff;
            }
            code {
                background: rgba(0,0,0,0.3);
                padding: 12px 20px;
                border-radius: 12px;
                display: block;
                margin: 15px 0;
                border-left: 4px solid #00d4ff;
            }
            .cookie-status {
                background: ${hasCookies ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)'};
                border: 2px solid ${hasCookies ? '#00ff00' : '#ff0000'};
                border-radius: 12px;
                padding: 15px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>
                <i class="fas fa-download" style="color: #00d4ff;"></i>
                PREMIUM VIDEO DOWNLOADER
            </h1>
            
            <div class="status">
                ✅ SERVER ISHGA TUSHDI! <br>
                <small>${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</small>
            </div>
            
            <div class="cookie-status">
                <strong>🍪 Cookie holati:</strong> ${hasCookies ? 'MAVJUD ✅' : 'MAVJUD EMAS ❌'}<br>
                ${!hasCookies ? '<small>⚠️ YouTube uchun cookie kerak. Brauzeringizdan cookies.txt eksport qiling.</small>' : ''}
            </div>

            <h3>📋 Qo'llab-quvvatlanadigan platformalar:</h3>
            <div class="platform-grid">
                <div class="platform">▶️ YouTube</div>
                <div class="platform">📸 Instagram</div>
                <div class="platform">🎵 TikTok</div>
                <div class="platform">📘 Facebook</div>
                <div class="platform">🐦 Twitter/X</div>
                <div class="platform">📌 Pinterest</div>
                <div class="platform">🎥 Vimeo</div>
                <div class="platform">📹 Dailymotion</div>
                <div class="platform">🎮 Twitch</div>
                <div class="platform">👽 Reddit</div>
                <div class="platform">💬 Telegram</div>
                <div class="platform">➕ 1000+</div>
            </div>

            <h3>🔧 Ishlatish:</h3>
            <code>GET /download?url=VIDEO_URL</code>
            
            <h3>📌 Misol:</h3>
            <code>/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ</code>
            
            <h3>🍪 Cookie yuklash:</h3>
            <code>POST /upload-cookies</code>
            <p><small>Content-Type: text/plain, Body: Netscape formatidagi cookie fayl</small></p>
            
            <h3>📊 Status:</h3>
            <code>GET /status</code>
        </div>
    </body>
    </html>
  `);
});

// ========== SERVERNI ISHGA TUSHIRISH ==========
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PREMIUM VIDEO DOWNLOADER');
  console.log('='.repeat(60));
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🍪 Cookie: ${hasCookies ? 'mavjud ✅' : 'mavjud emas ❌'}`);
  console.log(`🎯 Platformalar: 1000+`);
  console.log('='.repeat(60) + '\n');
});
