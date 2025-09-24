const Film = require('../models/film');

class FilmController {
  static getTop5RentedFilms(req, res) {
    Film.getTop5RentedFilms((err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);

    });
  }
  static getTop5Actors(req, res) {
    Film.getTop5Actors((err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    });
  }
}

module.exports = FilmController;