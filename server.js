import express from 'express';
import cors from 'cors';
import youtubedl from 'youtube-dl-exec';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/download', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL kerak' });
    }

    console.log(`📥 Yuklanmoqda: ${videoUrl}`);

    // youtube-dl-exec orqali yuklab olish
    const output = await youtubedl(videoUrl, {
      format: 'best[ext=mp4]/best',
      output: '-',  // stdout ga yozish
      noPlaylist: true,
      quiet: true
    });

    const videoBuffer = Buffer.from(output);

    res.setHeader('Content-Disposition', `attachment; filename="premium_video_${Date.now()}.mp4"`);
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

app.get('/', (req, res) => {
  res.send(`
    <h1>✅ PREMIUM VIDEO DOWNLOADER</h1>
    <p>Server ishga tushdi!</p>
    <p>Ishlatish: /download?url=VIDEO_URL</p>
    <p>Qo'llab-quvvatlanadi: 1000+ platforma (YouTube, Facebook, Instagram, TikTok...)</p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portda ishlamoqda`);
});
