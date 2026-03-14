const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name:     String,
    price:    Number,
    quantity: Number,
    image:    String
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending','Processing','Shipped','Delivered','Cancelled'],
    default: 'Pending'
  },
  paymentStatus: { type: String, enum: ['Unpaid','Paid','Refunded'], default: 'Unpaid' },
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  shippingAddress: { street: String, city: String, state: String, zip: String, country: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
