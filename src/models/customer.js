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

    static searchCustomersByParam(param, callback) {
        const query = `SELECT 
            c.*,
            a.*,
            ci.city,
            co.country
        FROM customer c
        LEFT JOIN address a ON c.address_id = a.address_id
        LEFT JOIN city ci ON a.city_id = ci.city_id
        LEFT JOIN country co ON ci.country_id = co.country_id
        WHERE c.first_name LIKE CONCAT(?, '%') 
           OR c.last_name LIKE CONCAT(?, '%')
           OR c.customer_id LIKE ?
           OR CONCAT(c.first_name, ' ', c.last_name) LIKE CONCAT(?, '%')`;
        
        db.query(query, [param, param, param, param], (err, results) => {
            if (err) return callback(err);
            callback(null, results);
        });
    }

    static async addCustomer(customerData) {
        try {
            const { 
                first_name, 
                last_name, 
                email, 
                active,
                address,
                address2,
                district,
                city,
                country,
                postal_code,
                phone
            } = customerData;

            let finalEmail = email;
            if (!finalEmail) {
                finalEmail = `${first_name}.${last_name}@sakilacustomer.org`;
                
                let emailExists = true;
                let counter = 1;
                let baseLastName = last_name;
                
                while (emailExists) {
                    const emailCheckQuery = `SELECT customer_id FROM customer WHERE email = ?`;
                    const [emailResult] = await db.promise().query(emailCheckQuery, [finalEmail]);
                    
                    if (emailResult.length === 0) {
                        emailExists = false;
                    } else {
                        finalEmail = `${first_name}.${baseLastName}${counter}@sakilacustomer.org`;
                        counter++;
                    }
                }
            }
            
            if (!first_name || !last_name) {
                throw new Error('Missing required fields: first_name and last_name are required');
            }

            if (!address || !city || !country) {
                throw new Error('Missing required address fields: address, city, and country are required');
            }

            let country_id;
            const countryQuery = `SELECT country_id FROM country WHERE country = ?`;
            const [countryResult] = await db.promise().query(countryQuery, [country]);
            
            if (countryResult.length === 0) {
                const insertCountryQuery = `INSERT INTO country (country, last_update) VALUES (?, NOW())`;
                const [countryInsertResult] = await db.promise().query(insertCountryQuery, [country]);
                country_id = countryInsertResult.insertId;
            } else {
                country_id = countryResult[0].country_id;
            }
            
            let city_id;
            const cityQuery = `SELECT city_id FROM city WHERE city = ? AND country_id = ?`;
            const [cityResult] = await db.promise().query(cityQuery, [city, country_id]);
            
            if (cityResult.length === 0) {
                const insertCityQuery = `INSERT INTO city (city, country_id, last_update) VALUES (?, ?, NOW())`;
                const [cityInsertResult] = await db.promise().query(insertCityQuery, [city, country_id]);
                city_id = cityInsertResult.insertId;
            } else {
                city_id = cityResult[0].city_id;
            }

            // Use POINT(0 0) for location since it's required by the database 
            const locationValue = 'POINT(0 0)';
            
            const addressQuery = `INSERT INTO address (address, address2, district, city_id, postal_code, phone, location, last_update) 
                                VALUES (?, ?, ?, ?, ?, ?, ST_GeomFromText(?), NOW())`;
            const [addressResult] = await db.promise().query(addressQuery, [
                address, 
                address2 || null, 
                district || null, 
                city_id, 
                postal_code || null, 
                phone || null,
                locationValue
            ]);
            const address_id = addressResult.insertId;

            const activeValue = active !== undefined ? active : 1;
            const create_date = new Date();
            const last_update = new Date();

            const customerQuery = `INSERT INTO customer (store_id, first_name, last_name, email, address_id, active, create_date, last_update) 
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
            
            const [customerResult] = await db.promise().query(customerQuery, [
                1, // store_id = 1
                first_name, 
                last_name, 
                finalEmail, 
                address_id, 
                activeValue, 
                create_date, 
                last_update
            ]);
/*
                customer_id: customerResult.insertId,
                message: 'Customer created successfully',
                customer: {
                    customer_id: customerResult.insertId,
                    store_id: 1,
                    first_name,
                    last_name,
                    email: finalEmail,
                    address_id,
                    active: activeValue,
                    create_date,
                    last_update
                },
                address_info: {
                    address_id: address_id,
                    city_id: city_id,
                    country_id: country_id,
                    address: address,
                    city: city,
                    country: country
                } 
*/
            return {
                customer_id: customerResult.insertId,
                message: 'Customer created successfully',
                customer: {
                    customer_id: customerResult.insertId,
                }
            };

        } catch (error) {
            throw error;
        }
    }
}
module.exports = Customer;