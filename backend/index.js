require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB } = require('./src/config/db');

// Importar rutas
const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const videoRoutes = require('./src/routes/videoRoutes');
const programRoutes = require('./src/routes/programRoutes');
const sponsorRoutes = require('./src/routes/sponsorRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const subscriberRoutes = require('./src/routes/subscriberRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const bannerRoutes = require('./src/routes/bannerRoutes');

const app = express();
const port = process.env.PORT || 3005;

// Configurar base de datos
initDB();

// Middlewares Globales
app.use(cors());
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Servir archivos estáticos (uploads)
const uploadsDir = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Escudo Anti-Caché Global para la API
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Rutas de la API
app.use('/api', authRoutes); // login, register (las rutas no tienen prefijo interno porque las puse como /login, etc.)
app.use('/api/users', userRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/programs', programRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api', subscriberRoutes); // /subscribers, /subscribe
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);

// Escudo global de errores
app.use((err, req, res, next) => {
  console.error("🔥 Error de Express o JSON:", err.message);
  res.status(400).json({ error: "Error procesando petición", details: err.message });
});

app.listen(port, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${port}`);
});