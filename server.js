import express from 'express';
import cors from 'cors';
import {
  rebelfbdown,      // Facebook
  rebelinstadl,     // Instagram  
  rebeltiktokdl,    // TikTok
  rebelyt,          // YouTube
  rebelpindl,       // Pinterest
  rebelcapcutdl,    // CapCut
  rebellikeedl,     // Likee
  rebeltwitterdl,   // Twitter/X
  rebelteraboxdl,   // Terabox
  rebeldailymotion, // Dailymotion
  rebelvimeodl,     // Vimeo
  rebelredditdl,    // Reddit
  rebeltelegramdl   // Telegram
} from 'trs-media-downloader';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ===== UNIVERSAL DOWNLOAD =====
app.get('/download', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL kerak' });
    }

    console.log(`📥 Yuklanmoqda: ${videoUrl}`);

    // trs-media-downloader to'g'ridan-to'g'ri ishlatamiz
    const data = await import('trs-media-downloader').then(mod => {
      if (videoUrl.includes('facebook')) return mod.rebelfbdown(videoUrl);
      if (videoUrl.includes('instagram')) return mod.rebelinstadl(videoUrl);
      if (videoUrl.includes('tiktok')) return mod.rebeltiktokdl(videoUrl);
      if (videoUrl.includes('youtube') || videoUrl.includes('youtu.be')) return mod.rebelyt(videoUrl);
      if (videoUrl.includes('pinterest')) return mod.rebelpindl(videoUrl);
      if (videoUrl.includes('capcut')) return mod.rebelcapcutdl(videoUrl);
      if (videoUrl.includes('likee')) return mod.rebellikeedl(videoUrl);
      if (videoUrl.includes('twitter') || videoUrl.includes('x.com')) return mod.rebeltwitterdl(videoUrl);
      if (videoUrl.includes('terabox')) return mod.rebelteraboxdl(videoUrl);
      if (videoUrl.includes('dailymotion')) return mod.rebeldailymotion(videoUrl);
      if (videoUrl.includes('vimeo')) return mod.rebelvimeodl(videoUrl);
      if (videoUrl.includes('reddit')) return mod.rebelredditdl(videoUrl);
      if (videoUrl.includes('t.me') || videoUrl.includes('telegram')) return mod.rebeltelegramdl(videoUrl);
      
      // Agar hech biri mos kelmasa, universal handler
      return mod.rebelaldwn(videoUrl);
    });

    // Video URL ni topish
    let videoDownloadUrl = null;
    let title = 'premium-video';

    if (data.title) title = data.title;
    if (data.video?.hd) videoDownloadUrl = data.video.hd;
    else if (data.video?.sd) videoDownloadUrl = data.video.sd;
    else if (data.url) videoDownloadUrl = data.url;
    else if (data.medias?.[0]?.url) videoDownloadUrl = data.medias[0].url;

    if (!videoDownloadUrl) {
      return res.status(404).json({ error: 'Video URL topilmadi' });
    }

    // Videoni yuklab olish
    const videoResponse = await fetch(videoDownloadUrl);
    const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

    // Fayl nomi
    const fileName = title
      .replace(/[^\w\s]/gi, '')
      .substring(0, 100)
      .trim() + '.mp4';

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.send(videoBuffer);

  } catch (error) {
    console.error('❌ Xatolik:', error);
    res.status(500).json({ 
      error: 'Yuklab olishda xatolik',
      details: error.message 
    });
  }
});

// ===== PLATFORMA BO'YICHA ENDPOINTS =====
app.get('/download/youtube', async (req, res) => {
  try {
    const data = await rebelyt(req.query.url);
    const videoUrl = data.video?.hd || data.video?.sd;
    const response = await fetch(videoUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Disposition', `attachment; filename="${data.title || 'youtube'}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Xuddi shunday Facebook, Instagram, TikTok, Pinterest, CapCut, Likee, Twitter uchun...

app.get('/', (req, res) => {
  res.send(`
    <h1>✅ PREMIUM VIDEO DOWNLOADER</h1>
    <p>Server ishga tushdi!</p>
    <p>Ishlatish: /download?url=VIDEO_URL</p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portda ishlamoqda`);
});
