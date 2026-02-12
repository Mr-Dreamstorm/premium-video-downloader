import express from 'express';
import cors from 'cors';
import trs from 'trs-media-downloader';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// UNIVERSAL DOWNLOADER
app.get('/download', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) {
      return res.status(400).json({ error: 'URL kerak' });
    }

    console.log(`📥 Yuklanmoqda: ${videoUrl}`);

    // To'g'ridan-to'g'ri rebelaldwn ishlatamiz
    const data = await trs.rebelaldwn(videoUrl);
    
    // Video URL ni topish
    let downloadUrl = data?.video?.hd || data?.video?.sd || data?.url;
    let title = data?.title || 'premium-video';

    if (!downloadUrl) {
      return res.status(404).json({ error: 'Video URL topilmadi' });
    }

    // Yuklab olish
    const response = await fetch(downloadUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Fayl nomi
    const fileName = title
      .replace(/[^\w\s]/gi, '_')
      .substring(0, 100) + '.mp4';

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', 'video/mp4');
    res.send(buffer);

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
    <p>Qo'llab-quvvatlanadi: YouTube, Facebook, Instagram, TikTok, Pinterest, CapCut, Likee, Twitter, Telegram va boshqalar</p>
  `);
});

app.listen(PORT, () => {
  console.log(`🚀 Server ${PORT} portda ishlamoqda`);
});
