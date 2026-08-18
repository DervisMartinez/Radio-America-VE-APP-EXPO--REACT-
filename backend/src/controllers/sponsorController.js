const sponsorRepository = require('../repositories/sponsorRepository');

exports.getAllSponsors = async (req, res) => {
  try {
    const sponsors = await sponsorRepository.findAll();
    res.json(sponsors);
  } catch (error) {
    console.error(" Error GET sponsors:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.createSponsor = async (req, res) => {
  try {
    await sponsorRepository.create(req.body);
    res.status(201).json({ message: 'Cuña creada con éxito' });
  } catch (error) {
    console.error(" Error POST sponsors:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.updateSponsor = async (req, res) => {
  try {
    await sponsorRepository.update(req.params.id, req.body);
    res.json({ message: 'Cuña actualizada' });
  } catch (error) {
    console.error("❌ Error PUT sponsors:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteSponsor = async (req, res) => {
  try {
    await sponsorRepository.delete(req.params.id);
    res.json({ message: 'Cuña eliminada' });
  } catch (error) {
    console.error("❌ Error DELETE sponsors:", error.message);
    res.status(400).json({ error: error.message });
  }
};
