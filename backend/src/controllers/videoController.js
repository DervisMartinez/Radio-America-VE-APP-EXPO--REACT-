const videoRepository = require('../repositories/videoRepository');
const subscriberRepository = require('../repositories/subscriberRepository');
const { sendNewVideoNotification } = require('../../utils/services/mailer');

exports.getAllVideos = async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const videos = await videoRepository.findAll();
    res.json(videos);
  } catch (error) {
    console.error("❌ Error GET videos:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.createVideo = async (req, res) => {
  try {
    await videoRepository.create(req.body);
    res.status(201).json({ message: 'Video creado con éxito' });

    if (req.body.sendNewsletter) {
      try {
        const emails = await subscriberRepository.findAllEmails();
        if (emails.length > 0) {
          sendNewVideoNotification(emails, req.body).catch(e => console.error("Error en envío silencioso:", e));
        }
      } catch(e) { console.error("Error obteniendo suscriptores para el newsletter:", e); }
    }
  } catch (error) {
    console.error("❌ Error POST videos:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.updateVideo = async (req, res) => {
  try {
    await videoRepository.update(req.params.id, req.body);
    res.json({ message: 'Video actualizado' });
  } catch (error) {
    console.error("❌ Error PUT videos:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteVideo = async (req, res) => {
  try {
    await videoRepository.delete(req.params.id);
    res.json({ message: 'Video eliminado' });
  } catch (error) {
    console.error("❌ Error DELETE videos:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.incrementView = async (req, res) => {
  try {
    await videoRepository.incrementViews(req.params.id);
    res.json({ message: 'Vista sumada' });
  } catch (error) {
    console.error("❌ Error VISTAS videos:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.incrementLike = async (req, res) => {
  try {
    await videoRepository.incrementLikes(req.params.id);
    res.json({ message: 'Like sumado' });
  } catch (error) {
    console.error("❌ Error LIKES videos:", error.message);
    res.status(400).json({ error: error.message });
  }
};
