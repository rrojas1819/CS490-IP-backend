const Customer = require('../models/customer');

class CustomerController {
    static async rentFilm(req, res) {
        const { film_id,customer_id } = req.query;
        
        if (!film_id) {
            return res.status(400).json({ error: 'film_id parameter is required' });
        }
        if (!customer_id) {
            return res.status(400).json({ error: 'customer_id parameter is required' });
        }

       try{
        const results = await Customer.rentFilm(film_id,customer_id);
        res.status(200).json(results);
       }catch(error){
        res.status(500).json({ error: error.message });
       }

    }
    static async returnFilm(req, res) {
        const { rental_id, inventory_id, customer_id } = req.query;
        if (!rental_id) {
            return res.status(400).json({ error: 'rental_id parameter is required' });
        }
        if (!inventory_id) {
            return res.status(400).json({ error: 'inventory_id parameter is required' });
        }
        if (!customer_id) {
            return res.status(400).json({ error: 'customer_id parameter is required' });
        }
        try {
            
            const results = await Customer.returnFilm(rental_id, inventory_id, customer_id);
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    static async getAllCustomers(req, res) {
        try {
            const results = await Customer.getAllCustomers();
            res.status(200).json(results);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = CustomerController;