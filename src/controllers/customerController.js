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
        res.status(201).json(results);
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

    static searchCustomersByParam(req, res) {
        const { param } = req.query;
        
        if (!param) {
            return res.status(400).json({ error: 'param parameter is required' });
        }
        
        Customer.searchCustomersByParam(param, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(200).json(results);
        });
    }

    static async addCustomer(req, res) {
        try {
            const customerData = req.body;
            
            
            if (!customerData || Object.keys(customerData).length === 0) {
                return res.status(400).json({ error: 'Request body is required' });
            }

            const result = await Customer.addCustomer(customerData);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async updateCustomer(req, res) {
        try {
            const customer_id = req.params.id;
            const customerData = req.body;
            
            if (!customer_id) {
                return res.status(400).json({ error: 'Customer ID is required' });
            }

            if (!customerData || Object.keys(customerData).length === 0) {
                return res.status(400).json({ error: 'Request body is required' });
            }

            const result = await Customer.updateCustomer(customer_id, customerData);
            res.status(200).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async deleteCustomer(req, res) {
        try {
            const customer_id = req.params.id;
            if (!customer_id) {
                return res.status(400).json({ error: 'Customer ID is required' });
            }
            
            const result = await Customer.deleteCustomer(customer_id);
            res.status(200).json(result);
        } catch (error) {
            if (error.message === 'Customer not found') {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    }

    static async getRentalHistory(req, res) {
        try {
            const customer_id = req.params.id;
            
            if (!customer_id) {
                return res.status(400).json({ error: 'Customer ID is required' });
            }

            const result = await Customer.getRentalHistory(customer_id);
            res.status(200).json(result);
        } catch (error) {
            if (error.message === 'Customer not found') {
                return res.status(404).json({ error: error.message });
            }
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = CustomerController;