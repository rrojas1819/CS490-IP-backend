const db = require('../config/db');

class Film {
  static getTop5RentedFilmsAndInfo(callback){
    const query = `select f.*  from rental as r, inventory as i,film as f, film_category as fc,category as c where
r.inventory_id = i.inventory_id and f.film_id = i.film_id and f.film_id = fc.film_id and fc.category_id = c.category_id
group by i.film_id,f.title,c.name
order by count(i.film_id) desc,f.title limit 5;`;

    db.query(query, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }

  static getTop5Actors(callback){
    const query = `select a.actor_id,a.first_name,a.last_name,count(f.film_id) as movies from actor as a, film_actor as fa, film as f where
a.actor_id = fa.actor_id and f.film_id = fa.film_id
GROUP BY a.actor_id
ORDER BY movies desc limit 5`;

    db.query(query, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }

}

module.exports = Film;