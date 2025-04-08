// payment.js
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY); // Usar tu clave secreta de Stripe

// Crear la sesión de pago con Stripe
const createCheckoutSession = async (req, res) => {
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
                        unit_amount: 2000, // Monto en centavos (por ejemplo, $20.00)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel`,
        });

        // Enviar la respuesta con el ID de la sesión
        res.json({ sessionId: session.id });
    } catch (error) {
        console.error('Error al crear la sesión de pago:', error);
        res.status(500).send('Error al crear la sesión de pago');
    }
};

module.exports = { createCheckoutSession };
