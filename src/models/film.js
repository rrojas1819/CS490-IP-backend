const db = require('../config/db');

class Film {


  static getTop5RentedFilmsAndInfo(callback){
    const query = `select f.*  from rental as r, inventory as i,film as f, film_category as fc,category as c where
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

  

}

module.exports = Film;