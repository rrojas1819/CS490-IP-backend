const express = require('express');
const router = express.Router();
const ActorController = require('../controllers/actorController');

router.get('/top5actors', ActorController.getTop5ActorsAndInfo);

module.exports = router;