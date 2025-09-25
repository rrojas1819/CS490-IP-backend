const express = require('express');
const router = express.Router();
const FilmController = require('../controllers/filmController');

router.get('/top5rentedfilms', FilmController.getTop5RentedFilmsAndInfo);
router.get('/searchfilmsbytitle', FilmController.searchFilmsByMovieTitle);

module.exports = router;