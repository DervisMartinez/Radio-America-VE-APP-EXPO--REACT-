const userRepository = require('../repositories/userRepository');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await userRepository.findAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  if (req.user.role === 'producer') {
    return res.status(403).json({ error: 'Los productores no pueden borrar usuarios' });
  }
  try {
    const user = await userRepository.findById(req.params.id);
    if (user && user.email === 'estudio@radioamerica.com.ve') {
       return res.status(403).json({ error: 'No se puede eliminar al superadministrador principal' });
    }
    await userRepository.delete(req.params.id);
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
