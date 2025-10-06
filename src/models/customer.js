const db = require('../config/db');
class Customer {

    /* Feature: As a user I want to be able to rent a film out to a customer
    Meaning I want 2 endpoints, one to rent a film and one to return a film.
    renting a film means insert. --> post request 
    returning a film means update. --> put request 
    */

    /*Finished but it was so nested and ugly I looked to see what I could do to get rid of the nested calls, remembered about async and await*/
    static async rentFilm(film_id,customer_id){
        try {
            /*Check if it can even be rented out */
            const query = `SELECT f.film_id,i.inventory_id, COUNT(*) AS rentedCurr FROM inventory i
                    JOIN film f        ON f.film_id = i.film_id
                    JOIN rental r      ON r.inventory_id = i.inventory_id
                    AND r.return_date IS NULL
                    and f.film_id = ?
                    GROUP BY f.film_id, f.title,i.inventory_id
                    ORDER BY rentedCurr DESC;`;

            const [filmsRentedCurr] = await db.promise().query(query, film_id);
            let rentedInventoryIds = [];
            filmsRentedCurr.forEach(result => {
                rentedInventoryIds.push(result.inventory_id);
            });

            const query2 = `select s.store_id,i.film_id,i.inventory_id,count(film_id) as DVDS from inventory as i, store as s 
                    where film_id = ?
                    group by s.store_id,i.film_id,i.inventory_id;`;
            
            const rentedAmount = filmsRentedCurr[0] ? filmsRentedCurr.length : 0;//in case it fails
            let totalAmount = 0;
            
            const [TotalFilms] = await db.promise().query(query2, film_id);
            let AllInventoryIds = [];

            TotalFilms.forEach(result => {
                AllInventoryIds.push(result.inventory_id);
            });

            totalAmount = AllInventoryIds.length;

            if (rentedAmount == totalAmount) {
                throw new Error('Films all rented out');
            }
            
            
            //Want to find the differences in reasonable time, i could loop but that's n^2 time at worst.
            //Using set to find the differences in O(n) time
            const rentedInventoryIdsSet = new Set(rentedInventoryIds);
            const AllInventoryIdsSet = new Set(AllInventoryIds);
            const differences = [...AllInventoryIdsSet].filter(id => !rentedInventoryIdsSet.has(id));
            
            //Now I can rent out by choosing any one of the differences choose first.
            const inventory_id = differences[0];
            const store_id = TotalFilms[0].store_id;
            const query3 = `INSERT INTO rental (inventory_id, customer_id, staff_id, rental_date) VALUES (?, ?, ?, NOW());`;
            const [result] = await db.promise().query(query3, [inventory_id, customer_id, 1]);
            return {rental_id: result.insertId, inventory_id, store_id};

        } catch (error) {
            throw error;
        }
    }
    static async returnFilm(rental_id, inventory_id, customer_id){
        try {
            //Need to make sure the rental_id is valid to actually return the film. AKA if it's already returned or invalid.
            const query2 = `SELECT * FROM rental WHERE rental_id = ? AND inventory_id = ? AND customer_id = ? AND return_date IS NULL;`;
            const [result] = await db.promise().query(query2, [rental_id, inventory_id, customer_id]);
            if (result.length === 0) {
                throw new Error('Invalid rental_id, inventory_id, or customer_id, or film already returned');
            }
            const query = `UPDATE rental SET return_date = NOW() WHERE rental_id = ? AND inventory_id = ? AND customer_id = ? AND return_date IS NULL;`;
            await db.promise().query(query, [rental_id, inventory_id, customer_id]);
            return { success: true, message: 'Film returned successfully' };
        } catch (error) {
            throw error;
        }
    }
    static async getAllCustomers(){
        const query = `SELECT 
            c.*,
            a.*,
            ci.city,
            co.country
        FROM customer c
        LEFT JOIN address a ON c.address_id = a.address_id
        LEFT JOIN city ci ON a.city_id = ci.city_id
        LEFT JOIN country co ON ci.country_id = co.country_id;`;
        const [result] = await db.promise().query(query);
        return result;
    }
}
module.exports = Customer;