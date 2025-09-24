const express = require('express');
const router = express.Router();
const FilmController = require('../controllers/filmController');

router.get('/top5rentedfilms', FilmController.getTop5RentedFilmsAndInfo);
router.get('/top5actors', FilmController.getTop5ActorsAndInfo);
module.exports = router;