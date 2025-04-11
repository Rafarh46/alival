const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  car: {
    name: String,
    image: String,
    pricePerDay: Number
  },
  renter: {
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    age: Number,
    address: String,
    city: String,
    zipCode: String
  },
  rentalInfo: {
    pickupLocation: String,
    dropoffLocation: String,
    pickupDateTime: Date,
    dropoffDateTime: Date,
    totalPrice: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Reservation', reservationSchema);
