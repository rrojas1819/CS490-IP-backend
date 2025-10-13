const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');

router.post('/rentfilm', CustomerController.rentFilm);
router.put('/returnfilm', CustomerController.returnFilm);
router.get('/allcustomers', CustomerController.getAllCustomers);
router.get('/searchparam', CustomerController.searchCustomersByParam);
router.post('/addcustomer', CustomerController.addCustomer);
router.put('/updatecustomer/:id', CustomerController.updateCustomer);

module.exports = router;