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

  static getTop5ActorsAndInfo(callback){
    const actorsQuery = `SELECT a.actor_id, a.first_name, a.last_name, COUNT(f.film_id) as movies 
                        FROM actor as a, film_actor as fa, film as f 
                        WHERE a.actor_id = fa.actor_id AND f.film_id = fa.film_id
                        GROUP BY a.actor_id
                        ORDER BY movies DESC 
                        LIMIT 5`;
    
    db.query(actorsQuery, (err, actors) => {
      if (err) return callback(err);
      
      if (actors.length === 0) {
        return callback(null, []);
      }
      
      
      let seenActors = 0;
      const actorsWithFilms = [];
      
      actors.forEach((actor, index) => {
        const filmsQuery = `SELECT
          f.*,
          COUNT(*) AS rented
        FROM rental r, inventory i, film f, film_actor fa
        WHERE r.inventory_id = i.inventory_id
          AND i.film_id = f.film_id
          AND fa.film_id = f.film_id
          AND fa.actor_id = ? 
        GROUP BY f.film_id, f.title, f.description, f.release_year, f.rating
        ORDER BY rented DESC, f.title
        LIMIT 5`;
        
        db.query(filmsQuery, [actor.actor_id], (err, films) => {
          if (err) return callback(err);
          
          
          actorsWithFilms[index] = {
            actor_id: actor.actor_id,
            first_name: actor.first_name,
            last_name: actor.last_name,
            total_movies: actor.movies,
            top_5_films: films.map(film => ({
              film_id: film.film_id,
              title: film.title,
              description: film.description,
              release_year: film.release_year,
              rating: film.rating,
              times_rented: film.rented
            }))
          };
          
          seenActors++;
          
          
          if (seenActors === actors.length) {
            callback(null, actorsWithFilms);
          }
        });
      });
    });
  }

}

module.exports = Film;