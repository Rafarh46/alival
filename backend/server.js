// Importar módulos necesarios prueba
const express = require('express');
const path = require('path');
const Stripe = require('stripe');
require('dotenv').config(); // Para cargar variables de entorno desde .env

// Inicializar la aplicación Express
const app = express();

// Inicializar Stripe con tu clave secreta
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Asegúrate de tener esta variable en tu .env

// Middleware para parsear JSON en las solicitudes
app.use(express.json());

// Middleware para servir archivos estáticos desde la carpeta 'website'
app.use(express.static(path.join(__dirname, '..', 'website')));

// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'website', 'index.html'));
});

// Ruta para crear una sesión de pago con Stripe
app.post('/create-checkout-session', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Alquiler de Vehículo',
                        },
                        unit_amount: 2000, // Precio en centavos (ej. 20 USD)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.BASE_URL}/success.html`,
            cancel_url: `${process.env.BASE_URL}/cancel.html`,
        });

        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Error al crear la sesión de pago:', error);
        res.status(500).send('Error al crear la sesión de pago');
    }
});

// Configurar el puerto del servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
