const express = require('express');
const app = express();
const productsRouter = require('./routes/products');

// Parse JSON bodies
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Express funcionando');
});

// Mount products API under /api
app.use('/api', productsRouter);

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});