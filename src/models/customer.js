const db = require('../config/db');
class Customer {

    /* Feature: As a user I want to be able to rent a film out to a customer
    Meaning I want 2 endpoints, one to rent a film and one to return a film.
    renting a film means insert. --> post request 
    returning a film means update. --> put request 
    */

    static validateEmail(email) {
        const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|eu|edu|email|net)$/i
        return emailPattern.test(email)
    }

    static validatePhone(phone) {
        const phonePattern = /^(\+1\s?)?(\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{4})$/
        return phonePattern.test(phone)
    }

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

            if (!first_name || !last_name || !email) {
                throw new Error('Missing required fields: first_name, last_name, and email are required');
            }

            if (!this.validateEmail(email)) {
                throw new Error('Email must be in format: user@domain.com (domains: com, org, eu, edu, email, net)');
            }

            if (phone && !this.validatePhone(phone)) {
                throw new Error('Phone number must be in format: 5551234567, (555) 123-4567, or +1 555 123 4567');
            }

            // Check if email already exists
            const emailCheckQuery = `SELECT customer_id FROM customer WHERE email = ?`;
            const [emailResult] = await db.promise().query(emailCheckQuery, [email]);
            
            if (emailResult.length > 0) {
                throw new Error('Email already exists. Please use a different email address. Or sign in with that email.');
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
                email, 
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
                    email: email,
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
                email: email,
                message: 'Customer created successfully',
                customer: {
                    customer_id: customerResult.insertId,
                    email: email
                }
            };

        } catch (error) {
            throw error;
        }
    }

    static async updateCustomer(customer_id, customerData) {
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

            if (!customer_id) {
                throw new Error('Customer ID is required');
            }

            const customerCheckQuery = `SELECT customer_id, address_id FROM customer WHERE customer_id = ?`;
            const [customerResult] = await db.promise().query(customerCheckQuery, [customer_id]);
            
            if (customerResult.length === 0) {
                throw new Error('Customer not found');
            }

            const existingAddressId = customerResult[0].address_id;

            if (email) {
                if (!this.validateEmail(email)) {
                    throw new Error('Email must be in format: user@domain.com (domains: com, org, eu, edu, email, net)');
                }

                const emailCheckQuery = `SELECT customer_id FROM customer WHERE email = ? AND customer_id != ?`;
                const [emailResult] = await db.promise().query(emailCheckQuery, [email, customer_id]);
                
                if (emailResult.length > 0) {
                    throw new Error('Email already exists. Please use a different email address. Or sign in with that email.');
                }
            }

            if (phone && !this.validatePhone(phone)) {
                throw new Error('Phone number must be in format: 5551234567, (555) 123-4567, or +1 555 123 4567');
            }

            if (first_name || last_name || email || active !== undefined) {
                const updateCustomerQuery = `UPDATE customer SET 
                    first_name = COALESCE(?, first_name),
                    last_name = COALESCE(?, last_name),
                    email = COALESCE(?, email),
                    active = COALESCE(?, active),
                    last_update = NOW()
                    WHERE customer_id = ?`;
                
                await db.promise().query(updateCustomerQuery, [
                    first_name,
                    last_name,
                    email,
                    active !== undefined ? active : null,
                    customer_id
                ]);
            }

            if (address || city || country || address2 || district || postal_code || phone) {
                if (!address || !city || !country) {
                    throw new Error('When updating address, address, city, and country are required');
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

                const locationValue = 'POINT(0 0)';
                const updateAddressQuery = `UPDATE address SET 
                    address = COALESCE(?, address),
                    address2 = COALESCE(?, address2),
                    district = COALESCE(?, district),
                    city_id = COALESCE(?, city_id),
                    postal_code = COALESCE(?, postal_code),
                    phone = COALESCE(?, phone),
                    location = ST_GeomFromText(?),
                    last_update = NOW()
                    WHERE address_id = ?`;
                
                await db.promise().query(updateAddressQuery, [
                    address,
                    address2,
                    district,
                    city_id,
                    postal_code,
                    phone,
                    locationValue,
                    existingAddressId
                ]);
            }
            
            return {
                customer_id: customer_id,
                message: 'Customer updated successfully'
            };

        } catch (error) {
            throw error;
        }
    }

    static async deleteCustomer(customer_id) {
        try {
            if (!customer_id) {
                throw new Error('Customer ID is required');
            }

            const checkQuery = `SELECT customer_id, address_id FROM customer WHERE customer_id = ?`;
            const [existing] = await db.promise().query(checkQuery, [customer_id]);
            if (existing.length === 0) {
                throw new Error('Customer not found');
            }
            const address_id = existing[0].address_id;

            const currentRentalsQuery = `SELECT COUNT(*) AS current_rentals FROM rental WHERE customer_id = ? AND return_date IS NULL`;
            const [currentRentalsResult] = await db.promise().query(currentRentalsQuery, [customer_id]);
            const currentRentals = currentRentalsResult[0].current_rentals;

            if (currentRentals > 0) {
                throw new Error(`Cannot delete customer. Customer has ${currentRentals} current rental(s) that must be returned first.`);
            }

            const deleteRentalsQuery = `DELETE FROM rental WHERE customer_id = ?`;
            const [rentalResult] = await db.promise().query(deleteRentalsQuery, [customer_id]);
            const deletedRentals = rentalResult.affectedRows;

            const deleteQuery = `DELETE FROM customer WHERE customer_id = ?`;
            const [result] = await db.promise().query(deleteQuery, [customer_id]);

            let addressDeleted = false;
            if (address_id) {
                const countQuery = `SELECT COUNT(*) AS cnt FROM customer WHERE address_id = ?`;
                const [countRows] = await db.promise().query(countQuery, [address_id]);
                const remaining = countRows && countRows[0] ? countRows[0].cnt : 0;
                if (remaining === 0) {
                    try {
                        const deleteAddressQuery = `DELETE FROM address WHERE address_id = ?`;
                        const [addrResult] = await db.promise().query(deleteAddressQuery, [address_id]);
                        addressDeleted = addrResult.affectedRows > 0;
                    } catch (e) {
                        addressDeleted = false;
                    }
                }
            }

            return {
                success: true,
                deletedRows: result.affectedRows,
                deletedRentals: deletedRentals,
                addressDeleted,
                message: `Customer and ${deletedRentals} rental record(s) deleted successfully`
            };
        } catch (error) {
            throw error;
        }
    }

    static async getRentalHistory(customer_id) {
        try {
            if (!customer_id) {
                throw new Error('Customer ID is required');
            }

            const customerCheckQuery = `SELECT customer_id FROM customer WHERE customer_id = ?`;
            const [customerResult] = await db.promise().query(customerCheckQuery, [customer_id]);
            
            if (customerResult.length === 0) {
                throw new Error('Customer not found');
            }

            const query = `SELECT 
                r.rental_id,
                r.rental_date,
                r.return_date,
                r.inventory_id,
                f.*
            FROM rental r
            JOIN inventory i ON r.inventory_id = i.inventory_id
            JOIN film f ON i.film_id = f.film_id
            WHERE r.customer_id = ?
            ORDER BY r.rental_date DESC`;

            const [rentals] = await db.promise().query(query, [customer_id]);

            const rentalsWithStatus = rentals.map(rental => {
                const rentalDate = new Date(rental.rental_date);
                const returnDate = rental.return_date ? new Date(rental.return_date) : new Date();
                const daysRented = Math.floor((returnDate - rentalDate) / (1000 * 60 * 60 * 24));
                
                return {
                    ...rental,
                    rental_status: rental.return_date === null ? 'Currently Rented' : 'Returned',
                    days_rented: daysRented
                };
            });

            const currentRentals = rentalsWithStatus.filter(rental => rental.return_date === null);
            const pastRentals = rentalsWithStatus.filter(rental => rental.return_date !== null);

            return {
                customer_id: customer_id,
                total_rentals: rentalsWithStatus.length,
                current_rentals: currentRentals.length,
                past_rentals: pastRentals.length,
                current_rentals_list: currentRentals,
                past_rentals_list: pastRentals,
                all_rentals: rentalsWithStatus
            };

        } catch (error) {
            throw error;
        }
    }
}
module.exports = Customer;