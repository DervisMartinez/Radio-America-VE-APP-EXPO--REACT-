const videoRepository = require('../repositories/videoRepository');
const programRepository = require('../repositories/programRepository');

exports.searchAll = async (req, res) => {
  const { query } = req.query;
  if (!query) return res.json({ videos: [], programs: [] });
  
  try {
    const searchTerm = `%${query}%`;
    const videos = await videoRepository.search(searchTerm, 10);
    const programs = await programRepository.search(searchTerm, 5);
    
    res.json({ videos, programs });
  } catch (error) {
    console.error("❌ Error BÚSQUEDA:", error.message);
    res.status(400).json({ error: error.message });
  }
};
