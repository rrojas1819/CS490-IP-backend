const express = require('express');
const router = express.Router();
const FilmController = require('../controllers/filmController');

router.get('/top5rentedfilms', FilmController.getTop5RentedFilmsAndInfo);
router.get('/search/filmsbytitle', FilmController.searchFilmsByMovieTitle);
router.get('/search/filmsbygenre', FilmController.getFilmsByGenre);
router.get('/filmdetails', FilmController.getFilmDetails);
module.exports = router;