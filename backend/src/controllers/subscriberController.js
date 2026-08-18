const subscriberRepository = require('../repositories/subscriberRepository');
const videoRepository = require('../repositories/videoRepository');
const programRepository = require('../repositories/programRepository');
const { sendWelcomeNewsletter } = require('../../utils/services/mailer');

exports.getAllSubscribers = async (req, res) => {
  try {
    const subscribers = await subscriberRepository.findAll();
    res.json(subscribers);
  } catch (error) {
    console.error("❌ Error GET subscribers:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.subscribe = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'El email es requerido' });
  try {
    await subscriberRepository.create(email);
    
    // Extraer el contenido destacado para armar el correo
    const featuredVideos = await videoRepository.findFeatured(2);
    const newPrograms = await programRepository.findRecent(3);

    // Enviar el correo usando Nodemailer
    await sendWelcomeNewsletter(email, featuredVideos, newPrograms);

    res.status(201).json({ success: true, message: 'Suscripción exitosa' });
  } catch (error) {
    // Evitar error si el correo ya existe
    if (error.code === 'ER_DUP_ENTRY') return res.status(200).json({ message: 'El usuario ya estaba suscrito.' });
    console.error("❌ Error SUSCRIPCIÓN:", error.message);
    res.status(400).json({ error: error.message });
  }
};
