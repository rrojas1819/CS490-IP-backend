const db = require('../config/db');

class Film {
  static getTop5RentedFilms(callback){
    const query = `select i.film_id,f.title,c.name ,count(i.film_id) as rented from rental as r, inventory as i,film as f, film_category as fc,category as c where
r.inventory_id = i.inventory_id and f.film_id = i.film_id and f.film_id = fc.film_id and fc.category_id = c.category_id
group by i.film_id,f.title,c.name
order by rented desc,f.title limit 5`;

    db.query(query, (err, results) => {
      if (err) return callback(err);
      callback(null, results);
    });
  }
}

module.exports = Film;