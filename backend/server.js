const bodyParser = require('body-parser');
const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
const stripe = require('stripe')('sk_test_51RBU161IXopeWyL3LSV53FQOqkPiGLGKq9MWcDzs8P2BLTyjHz2phE3qvxdes2mMn0fZZmSn0xQRp7IBEIVhzw8g002mk3KhUV');
const fs = require('fs');

// Cargar autos desde JSON
const cars = JSON.parse(fs.readFileSync('./data/cars.json'));

// Middlewares
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Archivos estáticos (frontend)
app.use(express.static(path.join(__dirname, '../website')));

// Dominio de frontend (Render)
const FRONTEND_URL = 'https://alival-backend.onrender.com';

// Endpoint de Stripe Checkout
app.post('/api/create-checkout-session', async (req, res) => {
  const selectedCar = req.body['selected-car'];
  console.log('Auto seleccionado desde frontend:', selectedCar);  // Log para verificar lo que llega al servidor

  const car = cars.find(c => c.name === selectedCar);

  if (!car) {
    console.error('Auto no encontrado');
    return res.status(404).json({ error: 'Auto no encontrado' });
  }

  try {
    console.log('Creando sesión de Stripe para el auto:', car.name);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: car.name,
          },
          unit_amount: car.price * 100, // centavos
        },
        quantity: 1,
      }],
      success_url: `${FRONTEND_URL}/success.html`,
      cancel_url: `${FRONTEND_URL}/cancel.html`,
    });

    console.log('Sesión creada con URL:', session.url);
    res.json({ url: session.url });

  } catch (err) {
    console.error('Error al crear sesión de Stripe:', err.message);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
