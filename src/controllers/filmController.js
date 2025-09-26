const Film = require('../models/film');

class FilmController {
  static getTop5RentedFilmsAndInfo(req, res) {
    Film.getTop5RentedFilmsAndInfo((err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    });
  }

  static searchFilmsByMovieTitle(req, res) {
    const { title } = req.query;
    
    if (!title) {
      return res.status(400).json({ error: 'Title parameter is required' });
    }
    
    
    Film.searchFilmsByMovieTitle(title, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    });
  }
  
  static getFilmsByGenre(req, res) {
    const { genre } = req.query;
    Film.getFilmsByGenre(genre, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    });
  }
  static getFilmDetails(req, res) {
    const { film_id } = req.query;
    
    if (!film_id) {
      return res.status(400).json({ error: 'film_id parameter is required' });
    }
    
    Film.getFilmDetails(film_id, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!results) {
        return res.status(404).json({ error: 'Film not found' });
      }
      res.status(200).json(results);
    });
  }
}

module.exports = FilmController;