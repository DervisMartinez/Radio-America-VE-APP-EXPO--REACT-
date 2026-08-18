const bannerRepository = require('../repositories/bannerRepository');

exports.getAllBanners = async (req, res) => {
  try {
    const banners = await bannerRepository.findAll();
    res.json(banners);
  } catch (error) {
    console.error("❌ Error GET banners:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const id = req.body.id || `banner_${Date.now()}`;
    await bannerRepository.create({ ...req.body, id });
    res.status(201).json({ message: 'Banner creado', id });
  } catch (error) {
    console.error("❌ Error POST banners:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    await bannerRepository.update(req.params.id, req.body);
    res.json({ message: 'Banner actualizado' });
  } catch (error) {
    console.error("❌ Error PUT banners:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    await bannerRepository.delete(req.params.id);
    res.json({ message: 'Banner eliminado' });
  } catch (error) {
    console.error("❌ Error DELETE banners:", error.message);
    res.status(400).json({ error: error.message });
  }
};
