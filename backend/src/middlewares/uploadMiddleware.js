const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadsDir = path.resolve(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
try { fs.chmodSync(uploadsDir, 0o777); } catch(e) {}

const storage = multer.diskStorage({
  destination: function (req, file, cb) { 
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    console.log("📂 [Multer] Guardando archivo internamente en:", uploadsDir);
    cb(null, uploadsDir); 
  },
  filename: function (req, file, cb) { 
    let ext = '.bin';
    if (file.mimetype.startsWith('audio/')) ext = '.mp3';
    else if (file.mimetype.startsWith('video/')) ext = '.mp4';
    else if (file.mimetype.startsWith('image/')) ext = '.jpg';
    
    const finalName = Date.now() + '-radioamerica' + Math.round(Math.random() * 1000) + ext;
    console.log(" [Multer] Nombre generado para guardar:", finalName);
    cb(null, finalName);
  }
});

const upload = multer({ storage: storage });

module.exports = {
  upload,
  uploadsDir
};
