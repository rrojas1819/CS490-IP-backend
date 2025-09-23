require('dotenv').config();
const express = require('express');
const app = express();
const port = 3000; 
const db = require('./config/db');
const filmRoutes = require('./routes/filmRoutes');

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

app.get('/api', (req, res) => {
  res.send('Sakila Movies General API');
});
//Connect the filmRoutes!
app.use('/api/films', filmRoutes);


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});