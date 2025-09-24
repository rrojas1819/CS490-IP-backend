const express = require('express');
const router = express.Router();
const FilmController = require('../controllers/filmController');

router.get('/top5rentedfilms', FilmController.getTop5RentedFilms);
router.get('/top5actors', FilmController.getTop5Actors);
module.exports = router;