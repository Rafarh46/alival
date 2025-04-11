const bodyParser = require('body-parser');
const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
const stripe = require('stripe')('sk_test_51RBU161IXopeWyL3LSV53FQOqkPiGLGKq9MWcDzs8P2BLTyjHz2phE3qvxdes2mMn0fZZmSn0xQRp7IBEIVhzw8g002mk3KhUV');
const fs = require('fs');
const Reservation = require('./reservations');

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
  const rentalDays = req.body['rental-days'];

  // Buscar el auto en el JSON cargado
  const car = cars.find(c => c.name === selectedCarName);
  const totalPrice = car.price * rentalDays;

  console.log('Auto seleccionado desde frontend:', selectedCarName, rentalDays);  // Log para verificar lo que llega al servidor

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
          unit_amount: totalPrice * 100, // Convertir a centavos
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

// Conectar a MongoDB Atlas
const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://federixrodrig:NV4WEBse13rvrmc4@carros.fdhkhhq.mongodb.net/?retryWrites=true&w=majority&appName=carros', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Conectado a MongoDB Atlas'))
.catch((err) => console.error('❌ Error al conectar:', err));

// Configurar Nodemailer para enviar el formulario
const nodemailer = require('nodemailer');

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
            service: 'gmail',
            auth: {
                user: 'romerorh46@gmail.com',
                pass: 'tu_contraseña_real', // Cambia por tu contraseña real
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

// Endpoint para guardar reserva y verificar disponibilidad
app.post('/api/reservations', async (req, res) => {
  try {
    const data = req.body;

    const newPickUp = new Date(data['pick-up']);
    const newDropOff = new Date(data['drop-off']);
    const carName = data['selected-car'];

    // Verificar si hay una reserva que se solape
    const overlappingReservation = await Reservation.findOne({
      carName: carName,
      $or: [
        {
          pickUpDate: { $lte: newDropOff },
          dropOffDate: { $gte: newPickUp }
        }
      ]
    });

    if (overlappingReservation) {
      return res.status(409).json({ error: 'Este auto ya está reservado en ese rango de fechas' });
    }

    // Guardar la nueva reserva
    const reservation = new Reservation({
      carName: carName,
      pickUpDate: newPickUp,
      dropOffDate: newDropOff,
      userInfo: {
        firstName: data['first-name'],
        lastName: data['last-name'],
        phone: data['phone-number'],
        email: data['email-address'],
        age: data['age'],
        address: data['address'],
        city: data['city'],
        zip: data['zip-code'],
      }
    });

    await reservation.save();
    res.status(201).json({ message: 'Reserva guardada correctamente' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la reserva' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
