const db = require('../config/db');

class Actor {
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
      static getFilmsByActorName(param, callback){
        const query = `SELECT f.film_id, f.title, f.release_year, a.actor_id,a.first_name,a.last_name FROM film as f, actor as a, film_actor as fa
    WHERE f.film_id = fa.film_id and fa.actor_id = a.actor_id and (first_name like CONCAT('%', ?, '%') or last_name like CONCAT('%', ?, '%'))`
        db.query(query, [param, param], (err, results) => {
          if (err) return callback(err);
          callback(null, results);
        });
      }
      
}
module.exports = Actor;
