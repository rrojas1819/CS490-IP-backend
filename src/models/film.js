const db = require('../config/db');

class Film {


  static getTop5RentedFilmsAndInfo(callback){
    const query = `select f.*,c.name as genre from rental as r, inventory as i,film as f, film_category as fc,category as c where
r.inventory_id = i.inventory_id and f.film_id = i.film_id and f.film_id = fc.film_id and fc.category_id = c.category_id
group by i.film_id,f.title,c.name
order by count(i.film_id) desc,f.title limit 5;`;
    db.query(query, (err, top5rentedfilms) => {
      if (err) return callback(err);
      let actorsInMovies = [];
      let moviesSeen = 0;

      top5rentedfilms.forEach((film, index) => {
        const actorsQuery = `SELECT a.actor_id, a.first_name, a.last_name FROM actor as a, film_actor as fa WHERE a.actor_id = fa.actor_id AND fa.film_id = ?`;
        db.query(actorsQuery, [film.film_id], (err, actors) => {
          if (err) return callback(err);
          actorsInMovies[index] = {
            film_id: film.film_id,
            title: film.title,
            description: film.description,
            release_year: film.release_year,
            rating: film.rating,
            actors: actors
          };
          moviesSeen++;
          if (moviesSeen === top5rentedfilms.length) {
            callback(null, actorsInMovies);
          }
        });
      });

    });
  }

  static searchFilmsByMovieTitle(param, callback){
    const query = `SELECT f.film_id, f.title, f.release_year FROM film as f WHERE title LIKE CONCAT('%', ?, '%')`; //Concat so it provides a security against sql injection when concatting the % to the param.
    db.query(query, param, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }
  static getFilmsByGenre(param, callback){
    const query = `SELECT f.film_id, f.title, f.release_year,c.name as genre FROM film as f,category as c, film_category as fc 
WHERE f.film_id =  fc.film_id and fc.category_id = c.category_id and c.name like CONCAT('%', ?, '%')`
    db.query(query, param, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }

  static getFilmDetails(param, callback){
    const query = `SELECT f.*, c.name as genre,
                          COUNT(DISTINCT i.inventory_id) as total_copies,
                          COUNT(DISTINCT CASE WHEN r.return_date IS NULL THEN r.inventory_id END) as rented_copies,
                          COUNT(DISTINCT i.inventory_id) - COUNT(DISTINCT CASE WHEN r.return_date IS NULL THEN r.inventory_id END) as available_copies
                   FROM film as f, category as c, film_category as fc, inventory as i
                   LEFT JOIN rental r ON i.inventory_id = r.inventory_id
                   WHERE f.film_id = fc.film_id AND fc.category_id = c.category_id AND f.film_id = i.film_id AND f.film_id = ?
                   GROUP BY f.film_id, c.name`;
    
    db.query(query, param, (err, results) => {
      if (err) return callback(err);
      
      if (results.length === 0) {
        return callback(null, null);
      }
      
      const film = results[0];
      
      const actorsQuery = `SELECT a.actor_id, a.first_name, a.last_name 
                          FROM actor as a, film_actor as fa 
                          WHERE a.actor_id = fa.actor_id AND fa.film_id = ?`;
      
      db.query(actorsQuery, [film.film_id], (err, actors) => {
        if (err) return callback(err);
        
        const filmWithActors = {
          ...film,
          actors: actors
        };
        
        callback(null, filmWithActors);
      });
    });
  }

  static getGroupFilmsByGenre(param,callback){
      const query =`SELECT f.film_id, f.title, f.release_year, c.name AS genre  FROM category c, film f
    WHERE EXISTS (
      SELECT 1
      FROM film_category fc
      WHERE fc.film_id = f.film_id
        AND fc.category_id = c.category_id
    )
    AND (
      SELECT COUNT(*)
      FROM film f2
      WHERE f2.film_id <= f.film_id
        AND EXISTS (
          SELECT 1
          FROM film_category fc2
          WHERE fc2.film_id = f2.film_id
            AND fc2.category_id = c.category_id
        )
    ) <= 11
    ORDER BY genre, film_id;
`
db.query(query, param, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }

}

module.exports = Film;