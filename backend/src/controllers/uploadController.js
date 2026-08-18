const { uploadsDir } = require('../middlewares/uploadMiddleware');
const { processVideoToHLS } = require('../../utils/hlsProcessor');
const videoRepository = require('../repositories/videoRepository');

exports.uploadFile = (req, res) => {
  try {
    console.log("📥 [API] Petición de subida recibida. Analizando archivo...");
    
    if (!req.file) {
      console.error("🔥 No se recibió ningún archivo en req.file");
      return res.status(400).json({ error: 'No se subió archivo' });
    }

    let finalUrl = `/uploads/${req.file.filename}`;
    let finalPath = req.file.path;
    const fileName = req.file.filename;

    if (req.file.mimetype.startsWith('video/') && fileName.endsWith('.mp4')) {
      const hlsFolderId = fileName.split('.')[0];
      
      res.json({ url: finalUrl, processing: true });
      
      setTimeout(async () => {
        try {
          const hlsUrl = await processVideoToHLS(finalPath, uploadsDir, hlsFolderId);
          if (hlsUrl) {
            await videoRepository.updateUrl(finalUrl, hlsUrl);
            console.log(`✅ Base de datos actualizada silenciosamente para el video: ${finalUrl} -> ${hlsUrl}`);
          }
        } catch (e) {
          console.error("🔥 Error ejecutando HLS en background:", e);
        }
      }, 100);
      return;
    }

    res.json({ url: finalUrl });
  } catch (error) {
    console.error("❌ Error en el try-catch de subida:", error);
    res.status(400).json({ error: error.message });
  }
};
