import express from 'express';
import ytdl from '@ybd-project/ytdl-core';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/download', async (req, res) => {
  try {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('URL kerak');
    
    const info = await ytdl.getFullInfo(videoUrl);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');
    
    res.header('Content-Disposition', `attachment; filename="${title}.mp4"`);
    ytdl.download(videoUrl, { quality: 'lowest' }).pipe(res);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

app.get('/', (req, res) => {
  res.send('✅ Premium Video Downloader ishga tushdi!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server ${port} da ishlamoqda`));
