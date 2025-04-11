const stripe = require('stripe')('sk_test_51RBU161IXopeWyL3LSV53FQOqkPiGLGKq9MWcDzs8P2BLTyjHz2phE3qvxdes2mMn0fZZmSn0xQRp7IBEIVhzw8g002mk3KhUV');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const app = express();

// Cargar autos desde JSON
const cars = JSON.parse(fs.readFileSync('./data/cars.json'));
const reservationsFile = path.join(__dirname, '../data/reservations.json');

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
      success_url: `${FRONTEND_URL}/succes.html?customer-name=${encodeURIComponent(firstName + ' ' + lastName)}&selected-car=${encodeURIComponent(car.name)}&pickup-date=${encodeURIComponent(pickupDate)}&dropoff-date=${encodeURIComponent(dropoffDate)}&total-price=${encodeURIComponent(totalPrice)}`,
      cancel_url: `${FRONTEND_URL}/cancel.html`,
    });

    console.log('Sesión creada con URL:', session.url);
    res.json({ url: session.url });

  } catch (err) {
    console.error('Error al crear sesión de Stripe:', err.message);
    res.status(500).json({ error: 'Error al procesar el pago' });
  }
});

// Guardar las reservas en JSON
const saveReservations = (reservation) => {
  const reservations = JSON.parse(fs.readFileSync(reservationsFile));
  reservations.push(reservation);
  fs.writeFileSync(reservationsFile, JSON.stringify(reservations, null, 2));
};

// Endpoint para registrar una nueva reserva
app.post('/api/reservations', async (req, res) => {
  const { carName, rentalDays, renter } = req.body;
  const car = cars.find(c => c.name === carName);

  if (!car) {
    return res.status(404).json({ error: 'Auto no encontrado' });
  }

  const totalPrice = car.price * rentalDays;
  const reservation = {
    car,
    rentalDays,
    totalPrice,
    renter,
    createdAt: new Date()
  };

  // Guardar la reserva
  saveReservations(reservation);

  // Enviar correo electrónico
  try {
    const html = `
      <h2>Formulario de Reserva</h2>
      <p><strong>Nombre:</strong> ${renter.firstName} ${renter.lastName}</p>
      <p><strong>Teléfono:</strong> ${renter.phone}</p>
      <p><strong>Edad:</strong> ${renter.age}</p>
      <p><strong>Email:</strong> ${renter.email}</p>
      <p><strong>Dirección:</strong> ${renter.address}, ${renter.city}, ${renter.zipCode}</p>
      <p><strong>Carro Seleccionado:</strong> ${car.name}</p>
      <p><strong>Recogida:</strong> ${renter.pickupDate}</p>
      <p><strong>Entrega:</strong> ${renter.dropoffDate}</p>
      <p><strong>Ubicación de Recogida:</strong> ${renter.pickupLocation}</p>
    `;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'romerorh46@gmail.com',
        pass: 'dczx ryql ufof kqnr', // Cambia por tu contraseña real
      },
    });

    await transporter.sendMail({
      from: 'Reservas <romerorh46@gmail.com>',
      to: 'romerorh46@gmail.com',
      subject: 'Nueva Solicitud de Reserva',
      html: html,
    });

    res.status(200).json({ message: 'Reserva registrada y correo enviado' });
  } catch (err) {
    console.error('Error al enviar correo:', err.message);
    res.status(500).json({ error: 'Error al enviar el correo' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
