const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');

const JWT_SECRET = process.env.JWT_SECRET || 'radio_america_super_secure_key_2026';

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    const token = jwt.sign({ id: user.id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role, name: user.name } });
  } catch (error) {
    console.error(" Error en login:", error.message);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

exports.register = async (req, res) => {
  if (req.user.role === 'producer') {
    return res.status(403).json({ error: 'Los productores no pueden crear usuarios' });
  }
  const { email, password, role, name } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await userRepository.create({ email, hash, role, name });
    res.status(201).json({ message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error(" Error en registro:", error.message);
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'El email ya existe' });
    res.status(500).json({ error: 'Error al registrar el usuario' });
  }
};
