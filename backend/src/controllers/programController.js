const programRepository = require('../repositories/programRepository');

exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await programRepository.findAll();
    res.json(programs);
  } catch (error) {
    console.error(" Error GET programs:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.createProgram = async (req, res) => {
  try {
    await programRepository.create(req.body);
    res.status(201).json({ message: 'Programa creado' });
  } catch (error) {
    console.error(" Error POST programs:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.updateProgram = async (req, res) => {
  try {
    await programRepository.update(req.params.id, req.body);
    res.json({ message: 'Programa actualizado' });
  } catch (error) {
    console.error(" Error PUT programs:", error.message);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteProgram = async (req, res) => {
  try {
    await programRepository.delete(req.params.id);
    res.json({ message: 'Programa eliminado' });
  } catch (error) {
    console.error(" Error DELETE programs:", error.message);
    res.status(400).json({ error: error.message });
  }
};
