const express = require('express');
const router = express.Router();
const CustomerController = require('../controllers/customerController');

router.post('/rentfilm', CustomerController.rentFilm);
router.put('/returnfilm', CustomerController.returnFilm);
router.get('/allcustomers', CustomerController.getAllCustomers);

module.exports = router;