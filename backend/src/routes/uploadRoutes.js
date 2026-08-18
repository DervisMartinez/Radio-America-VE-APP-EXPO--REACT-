const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { upload } = require('../middlewares/uploadMiddleware');

router.post('/', upload.single('file'), (err, req, res, next) => {
  if (err) {
    console.error("🔥 Error crítico de Multer:", err);
    if (err.message.includes('ENOENT')) {
      return res.status(400).json({ error: 'Conexión cortada abruptamente. Tu servidor principal (VPS/Plesk) bloqueó el peso del video.' });
    }
    return res.status(400).json({ error: `Error de Multer: ${err.message}` });
  }
  next();
}, uploadController.uploadFile);

module.exports = router;
