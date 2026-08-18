const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', userController.getAllUsers);
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;
