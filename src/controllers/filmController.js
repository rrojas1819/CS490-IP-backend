const Film = require('../models/film');

class FilmController {
  static getTop5RentedFilmsAndInfo(req, res) {
    Film.getTop5RentedFilmsAndInfo((err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    });
  }
  static getTop5ActorsAndInfo(req, res) {
    Film.getTop5ActorsAndInfo((err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    });
  }
}

module.exports = FilmController;