// server.js

const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
const stripe = require('stripe')('sk_test_51RBU161IXopeWyL3LSV53FQOqkPiGLGKq9MWcDzs8P2BLTyjHz2phE3qvxdes2mMn0fZZmSn0xQRp7IBEIVhzw8g002mk3KhUV'); // reemplaza con tu clave real
const fs = require('fs');

app.use(cors());
app.use(express.json());

const cars = JSON.parse(fs.readFileSync('./data/cars.json'));

app.use(express.static(path.join(__dirname, '../website')));
app.use(bodyParser.json());

// Crear sesión de checkout
app.post('/api/create-checkout-session', async (req, res) => {
  const selectedCar = req.body['selected-car'];
  const car = cars.find(c => c.name === selectedCar);

  if (!car) return res.status(404).json({ error: 'Car not found' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: car.name,
          },
          unit_amount: car.price * 100,
        },
        quantity: 1,
      }],
      success_url: 'http://localhost:3000/success.html',
      cancel_url: 'http://localhost:3000/cancel.html',
    });

    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
