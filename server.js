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

// ========== COOKIE FAYLLAR ==========
const YT_COOKIE_FILE = path.join(__dirname, 'www.youtube.com_cookies.txt');
const INSTA_COOKIE_FILE = path.join(__dirname, 'instagram.com_cookies.txt');

let hasYTCookies = fs.existsSync(YT_COOKIE_FILE);
let hasInstaCookies = fs.existsSync(INSTA_COOKIE_FILE);

// ========== PROXY SERVERLAR RO'YXATI (BEPUL) ==========
const PROXY_LIST = [
  // SOCKS5 proxy
  'socks5://185.199.229.156:7492',
  'socks5://2.56.215.75:6969',
  'socks5://103.155.217.5:8080',
  'socks5://45.136.68.19:1080',
  'socks5://51.158.68.68:8811',
  'socks5://157.230.105.209:39581',
  'socks5://46.232.250.27:4145',
  'socks5://139.162.78.109:4145',
  
  // HTTP proxy
  'http://47.251.43.115:33',
  'http://82.65.13.85:80',
  'http://216.137.184.254:80',
  'http://132.148.167.214:3128',
  'http://8.213.128.6:8080',
  'http://20.111.54.16:8123',
  'http://154.16.146.44:80',
  'http://165.227.196.37:3128',
  
  // SOCKS4 proxy
  'socks4://119.40.82.207:45123',
  'socks4://47.243.55.146:10003',
  'socks4://70.166.43.209:4145',
  'socks4://174.77.111.197:4145',
  'socks4://98.185.94.65:4145'
];

// Tasodifiy proxy tanlash
function getRandomProxy() {
  return PROXY_LIST[Math.floor(Math.random() * PROXY_LIST.length)];
}

// Proxy ishlayotganini tekshirish
function testProxy(proxy) {
  return new Promise((resolve) => {
    const testCmd = `curl -I --proxy ${proxy} --max-time 5 https://www.google.com -s -o /dev/null -w "%{http_code}"`;
    exec(testCmd, (error, stdout) => {
      resolve(!error && stdout.trim() === '200');
    });
  });
}

// Ishchi proxy topish
async function findWorkingProxy() {
  console.log('🔄 Ishchi proxy qidirilmoqda do\'stim...');
  
  // Proxylarni aralashtirish
  const shuffled = [...PROXY_LIST].sort(() => Math.random() - 0.5);
  
  // 5 tadan ko'p proxyni sinab ko'rmaymiz
  const proxiesToTest = shuffled.slice(0, 5);
  
  for (const proxy of proxiesToTest) {
    console.log(`   Sinov: ${proxy}`);
    const works = await testProxy(proxy);
    if (works) {
      console.log(`   ✅ Ishchi proxy topildi do\'stim: ${proxy}`);
      return proxy;
    }
  }
  
  console.log('   ⚠️ Ishchi proxy topilmadi, tasodifiy ishlatiladi do\'stim');
  return getRandomProxy();
}

console.log('\n' + '='.repeat(60));
console.log('🚀 PREMIUM VIDEO DOWNLOADER SERVER');
console.log('='.repeat(60));
console.log(`🍪 YouTube cookie: ${hasYTCookies ? 'mavjud do\'stim✅' : 'mavjud emas do\'stim ❌'}`);
console.log(`🍪 Instagram cookie: ${hasInstaCookies ? 'mavjud do\'stim ✅' : 'mavjud emas do\'stim ❌'}`);
console.log(`🌐 Proxy soni: ${PROXY_LIST.length} ta do\'stim`);
console.log('='.repeat(60) + '\n');

// ========== UNIVERSAL DOWNLOAD ENDPOINT ==========
app.get('/download', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL kerakda do\'stim' });
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📥 YUKLANMOQDA DO\'STIM: ${videoUrl}`);
    console.log('='.repeat(60));

    // Platformani aniqlash
    const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
    const isInstagram = videoUrl.includes('instagram.com') || videoUrl.includes('instagr.am');
    const isTikTok = videoUrl.includes('tiktok.com');
    const isFacebook = videoUrl.includes('facebook.com') || videoUrl.includes('fb.watch') || videoUrl.includes('fb.com');
    const isTwitter = videoUrl.includes('twitter.com') || videoUrl.includes('x.com');
    const isPinterest = videoUrl.includes('pinterest.com');
    const isVimeo = videoUrl.includes('vimeo.com');
    const isDailymotion = videoUrl.includes('dailymotion.com');
    const isTwitch = videoUrl.includes('twitch.tv');
    const isReddit = videoUrl.includes('reddit.com');
    const isTelegram = videoUrl.includes('t.me') || videoUrl.includes('telegram.org');
    
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
    
    // Xatolikda qayta urinish (5 marta)
    command += ' --retries 5';
    
    // Brauzer User-Agent (default)
    command += ' --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"';
    
    // ===== YOUTUBE UCHUN MAXSUS SOZLAMALAR =====
    if (isYouTube) {
      console.log('🎯 Platforma: YouTube');
      
      // PROXY ISHLATISH
      const proxy = await findWorkingProxy();
      console.log(`🔄 Proxy ishlatilmoqda: ${proxy}`);
      command += ` --proxy "${proxy}"`;
      
      // So'rovlar orasida kutish (rate limiting uchun)
      command += ' --sleep-interval 15';
      command += ' --max-sleep-interval 30';
      command += ' --retry-sleep 10';
      
      // YouTube Cookie
      if (hasYTCookies) {
        command += ` --cookies "${YT_COOKIE_FILE}"`;
        console.log('🍪 YouTube cookie ishlatilmoqda do\'stim');
      } else {
        console.log('⚠️ YouTube cookie yo\'q, alternativ usul ishlatilmoqda do\'stim');
        command += ' --extractor-args "youtube:player_client=android_embedded,ios"';
        command += ' --extractor-args "youtube:skip=webpage"';
        command += ' --geo-bypass';
      }
      
      // Throttling dan qochish
      command += ' --throttled-rate 100';
      command += ' --fragment-retries 10';
    }
    
    // ===== INSTAGRAM UCHUN =====
    else if (isInstagram) {
      console.log('🎯 Platforma: Instagram');
      
      // Mobile User-Agent (Instagram mobil versiya yaxshi ishlaydi)
      command += ' --user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"';
      
      // Instagram Cookie
      if (hasInstaCookies) {
        command += ` --cookies "${INSTA_COOKIE_FILE}"`;
        console.log('🍪 Instagram cookie ishlatilmoqda do\'stim');
      } else {
        console.log('⚠️ Instagram cookie yo\'q, faqat ochiq postlar ishlaydida do\'stim');
      }
    }
    
    // ===== TIKTOK UCHUN =====
    else if (isTikTok) {
      console.log('🎯 Platforma: TikTok');
      command += ' --user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"';
    }
    
    // ===== FACEBOOK UCHUN =====
    else if (isFacebook) {
      console.log('🎯 Platforma: Facebook');
      // Facebook mobil User-Agent
      command += ' --user-agent "Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36"';
    }
    
    // ===== TWITTER UCHUN =====
    else if (isTwitter) {
      console.log('🎯 Platforma: Twitter/X');
      command += ' --user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"';
    }
    
    // ===== PINTEREST UCHUN =====
    else if (isPinterest) {
      console.log('🎯 Platforma: Pinterest');
      command += ' --user-agent "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"';
    }
    
    // ===== VIMEO UCHUN =====
    else if (isVimeo) {
      console.log('🎯 Platforma: Vimeo');
      // Default User-Agent ishlaydi
    }
    
    // ===== DAILYMOTION UCHUN =====
    else if (isDailymotion) {
      console.log('🎯 Platforma: Dailymotion');
    }
    
    // ===== TWITCH UCHUN =====
    else if (isTwitch) {
      console.log('🎯 Platforma: Twitch');
      command += ' --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"';
    }
    
    // ===== REDDIT UCHUN =====
    else if (isReddit) {
      console.log('🎯 Platforma: Reddit');
    }
    
    // ===== TELEGRAM UCHUN =====
    else if (isTelegram) {
      console.log('🎯 Platforma: Telegram');
    }
    
    // Umumiy parametr: video URL
    command += ` "${videoUrl}"`;
    
    console.log('⚙️ Buyruq tuzildi do\'stim');
    console.log('⏳ Yuklab olinmoqda do\'stim...');
    
    // yt-dlp ni ishga tushirish
    const ytdlp = exec(command, {
      maxBuffer: 1024 * 1024 * 200 // 200MB buffer
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
      
      // Progressni ko'rsatish
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
        
        console.log('✅ Yuklab olish tugadi do\'stim!\n');
      } else {
        // Xatolik
        console.error('❌ Xatolik:', errorMessage || 'Noma\'lum xatolik do\'stim 😐');
        
        // 429 xatosi bo'lsa, maxsus xabar
        const is429 = errorMessage.includes('429');
        const isInstagramError = errorMessage.includes('Instagram') && errorMessage.includes('login');
        
        let tip = 'Boshqa URL sinab ko\'ring yoki keyinroq qayta urining do\'stim.';
        
        if (is429) {
          tip = 'YouTube 429 xatosi - juda ko\'p so\'rov. Server proxy ishlatadi, 1 soat kuting yoki boshqa video sinab ko\'ring do\'stim.';
        } else if (isInstagramError) {
          tip = 'Instagram posti private/maxfiy yoki login talab qiladi. Instagram cookie mavjudligini tekshiring do\'stim.';
        }
        
        res.status(500).json({
          error: 'Yuklab olishda xatolik do\'stim',
          details: errorMessage || 'Noma\'lum xatolik do\'stim',
          tip: tip
        });
      }
    });
    
  } catch (error) {
    console.error('❌ Server xatoligi do\'stim:', error);
    res.status(500).json({ 
      error: 'Server xatoligi do\'stim',
      details: error.message 
    });
  }
});

// ========== PROXY RO'YXATI ENDPOINTI ==========
app.get('/proxies', (req, res) => {
  res.json({
    total: PROXY_LIST.length,
    proxies: PROXY_LIST
  });
});

// ========== COOKIE YUKLASH ENDPOINTI ==========
app.post('/upload-cookies', express.raw({ type: 'text/plain', limit: '1mb' }), (req, res) => {
  try {
    const cookieData = req.body.toString();
    const { platform } = req.query;
    
    if (!platform) {
      return res.status(400).json({ error: 'Platforma tanlang do\'stim (youtube yoki instagram)' });
    }
    
    let cookieFile;
    if (platform === 'youtube') {
      cookieFile = YT_COOKIE_FILE;
    } else if (platform === 'instagram') {
      cookieFile = INSTA_COOKIE_FILE;
    } else {
      return res.status(400).json({ error: 'Noto\'g\'ri platforma do\'stim' });
    }
    
    // Cookies.txt formatida ekanligini tekshirish
    if (!cookieData.includes('.youtube.com') && !cookieData.includes('instagram.com') && !cookieData.includes('HTTP')) {
      return res.status(400).json({ 
        error: 'Noto\'g\'ri cookie formati',
        tip: 'Cookie fayl Netscape formatida bo\'lishi kerakda do\'stim'
      });
    }
    
    // Cookie faylga yozish
    fs.writeFileSync(cookieFile, cookieData);
    
    if (platform === 'youtube') {
      hasYTCookies = true;
    } else if (platform === 'instagram') {
      hasInstaCookies = true;
    }
    
    console.log(`✅ Yangi ${platform} cookie fayl yuklandi do\'stim`);
    res.json({ 
      success: true, 
      message: `${platform} cookie fayl muvaffaqiyatli yuklandi do\'stim` 
    });
    
  } catch (error) {
    console.error('❌ Cookie yuklash xatoligi do\'stim:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== STATUS ENDPOINTI ==========
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    youtube_cookie: hasYTCookies ? 'mavjud ekan do\'stim ✅' : 'mavjud emas ekan do\'stim ❌',
    instagram_cookie: hasInstaCookies ? 'mavjud ekan do\'stim ✅' : 'mavjud emas ekan do\'stim ❌',
    proxies: PROXY_LIST.length,
    platforms: [
      'YouTube', 'Instagram', 'TikTok', 'Facebook',
      'Twitter/X', 'Pinterest', 'Vimeo', 'Dailymotion',
      'Twitch', 'Reddit', 'Telegram', ' yana +1000 do\'stim'
    ]
  });
});

// ========== ASOSIY SAHIFA ==========
app.get('/', (req, res) => {
  const html = `
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
                background: ${hasYTCookies && hasInstaCookies ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)'};
                border: 2px solid ${hasYTCookies && hasInstaCookies ? '#00ff00' : '#ff0000'};
                border-radius: 12px;
                padding: 15px;
                margin: 20px 0;
            }
            .proxy-info {
                background: rgba(0,212,255,0.1);
                border: 2px solid #00d4ff;
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
                ✅ SERVER ISHGA TUSHDI DO\'STIM! <br>
                <small>${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent ekan do\'stim' })}</small>
            </div>
            
            <div class="cookie-status">
                <strong>🍪 YouTube cookie:</strong> ${hasYTCookies ? 'MAVJUD DO\'STIM ✅' : 'MAVJUD EMAS DO\'STIM ❌'}<br>
                <strong>🍪 Instagram cookie:</strong> ${hasInstaCookies ? 'MAVJUD DO\'STIM ✅' : 'MAVJUD EMAS DO\'STIM ❌'}
            </div>
            
            <div class="proxy-info">
                <strong>🌐 Proxy holati:</strong> ${PROXY_LIST.length} ta proxy mavjud do\'stim<br>
                <strong>🔄 YouTube:</strong> Proxy + Cookie bilan ishlaydi do\'stim<br>
                <strong>📸 Instagram:</strong> ${hasInstaCookies ? 'Cookie bilan ✅' : 'Cookie yo\'q, faqat ochiq postlar do\'stim'}
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

            <h3>🔧 Ishlatishni ko'ring do\'stim:</h3>
            <code>GET /download?url=VIDEO_URL</code>
            
            <h3>📌 Misol:</h3>
            <code>/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ</code>
            <code>/download?url=https://www.instagram.com/reel/Cx8x8x8x8x8/</code>
            
            <h3>🍪 Cookie yuklash:</h3>
            <code>POST /upload-cookies?platform=youtube</code>
            <code>POST /upload-cookies?platform=instagram</code>
            <p><small>Content-Type: text/plain, Body: Netscape formatidagi cookie fayl</small></p>
            
            <h3>📊 Status:</h3>
            <code>GET /status</code>
            
            <h3>🌐 Proxy ro'yxati:</h3>
            <code>GET /proxies</code>
        </div>
    </body>
    </html>
  `;
  res.send(html);
});

// ========== SERVERNI ISHGA TUSHIRISH ==========
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 PREMIUM VIDEO DOWNLOADER');
  console.log('='.repeat(60));
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`🍪 YouTube cookie: ${hasYTCookies ? 'mavjud ekan do\'stim✅' : 'mavjud emas ekan do\'stim ❌'}`);
  console.log(`🍪 Instagram cookie: ${hasInstaCookies ? 'mavjud ekan do\'stim ✅' : 'mavjud emas ekan do\'stim❌'}`);
  console.log(`🌐 Proxies: ${PROXY_LIST.length} ta`);
  console.log(`🎯 Platformalar: 1000+`);
  console.log('='.repeat(60) + '\n');
});
