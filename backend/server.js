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
  const selectedCarName = req.body['selected-car'];  // Nombre del auto seleccionado desde el frontend
  console.log('Auto seleccionado desde frontend:', selectedCarName);  // Log para verificar lo que llega al servidor

  // Buscar el auto en el JSON cargado
  const car = cars.find(c => c.name === selectedCarName);
  const rentalDays = req.body['rental-days'];
  const totalPrice = car.price * rentalDays;


  if (!car) {
    console.error('Auto no encontrado');
    return res.status(404).json({ error: 'Auto no encontrado' });
  }

  try {
    console.log('Creando sesión de Stripe para el auto:', car.name);

    // Crear la sesión de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'mxn',
          product_data: {
            name: car.name,
          },
          unit_amount: car.totalPrice * 100, // Convertir a centavos
        },
        quantity: 1,
      }],
      success_url: `${FRONTEND_URL}/succes.html`,
      cancel_url: `${FRONTEND_URL}/cancel.html`,
    });

    console.log('Sesión creada con URL:', session.url);
    res.json({ url: session.url });

  } catch (err) {
    console.error('Error al crear sesión de Stripe:', err.message);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});





const nodemailer = require('nodemailer');

// Endpoint para enviar el formulario por correo
app.post('/api/send-email', async (req, res) => {
    const form = req.body;

    // Correo en formato HTML
    const html = `
        <h2>Formulario de Reserva</h2>
        <p><strong>Nombre:</strong> ${form['first-name']} ${form['last-name']}</p>
        <p><strong>Teléfono:</strong> ${form['phone-number']}</p>
        <p><strong>Edad:</strong> ${form.age}</p>
        <p><strong>Email:</strong> ${form['email-address']}</p>
        <p><strong>Dirección:</strong> ${form.address}, ${form.city}, ${form['zip-code']}</p>
        <p><strong>Carro Seleccionado:</strong> ${form['selected-car']}</p>
        <p><strong>Recogida:</strong> ${form['pick-up']}</p>
        <p><strong>Entrega:</strong> ${form['drop-off']}</p>
        <p><strong>Ubicación de Recogida:</strong> ${form['pickup-location']}</p>
    `;

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // o tu proveedor
            auth: {
                user: 'romerorh46@gmail.com',
                pass: 'egod oiyr atxz vlju', // Cambia por tu contraseña real
            },
        });

        await transporter.sendMail({
            from: 'Reservas <romerorh46@gmail.com>',
            to: 'romerorh46@gmail.com',
            subject: 'Nueva Solicitud de Reserva',
            html: html,
        });

        res.status(200).send({ message: 'Correo enviado correctamente' });
    } catch (err) {
        console.error('Error enviando correo:', err.message);
        res.status(500).send({ error: 'Error al enviar el correo' });
    }
});

// Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

