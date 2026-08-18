const profileRepository = require('../repositories/profileRepository');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await profileRepository.findByUserId(userId);
    if (profile) res.json(profile);
    else res.status(404).json({ error: 'Perfil no encontrado' });
  } catch (error) {
    console.error("❌ Error GET profile:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  try {
    const existing = await profileRepository.findByUserId(userId);
    if (!existing) {
      await profileRepository.create(userId, req.body);
    } else {
      await profileRepository.update(userId, req.body);
    }
    res.json({ message: 'Perfil actualizado' });
  } catch (error) {
    console.error("❌ Error PUT profile:", error.message);
    res.status(400).json({ error: error.message });
  }
};
