const express = require('express');
const router = express.Router();
const subscriberController = require('../controllers/subscriberController');

router.get('/subscribers', subscriberController.getAllSubscribers);
router.post('/subscribe', subscriberController.subscribe);

module.exports = router;
