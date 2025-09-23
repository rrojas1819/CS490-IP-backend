require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000; 
const db = require('./config/db');

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

app.get('/', (req, res) => {
  res.send('Sakila Movies General API');
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});