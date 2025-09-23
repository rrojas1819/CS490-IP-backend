const express = require('express');
const router = express.Router();
const FilmController = require('../controllers/filmController');

router.get('/top5rentedfilms', FilmController.getTop5RentedFilms);

module.exports = router;