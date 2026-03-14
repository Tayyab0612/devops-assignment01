const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Product = require('../models/Product');
const Order   = require('../models/Order');

function requireLogin(req, res, next) {
  if (!req.session.user) { req.session.returnTo = req.originalUrl; req.flash('error','Please login'); return res.redirect('/auth/login'); }
  next();
}

// SMS helper (Twilio - gracefully optional)
async function sendOrderSMS(phone, orderNumber, total, method) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !phone) return;
  try {
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `ShopZone: Your order #${orderNumber} has been placed!\nAmount: Rs. ${total.toLocaleString()}\nPayment: ${method}\nThank you for shopping with us!`,
      from: process.env.TWILIO_PHONE,
      to:   phone.startsWith('+') ? phone : '+92' + phone.replace(/^0/, '')
    });
    console.log('✅ SMS sent to', phone);
  } catch (e) { console.log('SMS skipped:', e.message); }
}

router.get('/', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).populate('cart.product');
    res.render('cart/index', { cart: user.cart });
  } catch { req.flash('error','Error loading cart'); res.redirect('/'); }
});

router.post('/add/:productId', requireLogin, async (req, res) => {
  try {
    const { quantity = 1 } = req.body;
    const product = await Product.findById(req.params.productId);
    if (!product) { req.flash('error','Product not found'); return res.redirect('/products'); }
    const user = await User.findById(req.session.user._id);
    const item = user.cart.find(i => i.product.toString() === req.params.productId);
    if (item) item.quantity += parseInt(quantity);
    else user.cart.push({ product: req.params.productId, quantity: parseInt(quantity) });
    await user.save();
    req.flash('success', `"${product.name}" added to cart!`);
    res.redirect('back');
  } catch { req.flash('error','Error adding to cart'); res.redirect('/products'); }
});

router.post('/update/:productId', requireLogin, async (req, res) => {
  try {
    const qty = parseInt(req.body.quantity);
    const user = await User.findById(req.session.user._id);
    const item = user.cart.find(i => i.product.toString() === req.params.productId);
    if (item) {
      if (qty <= 0) user.cart = user.cart.filter(i => i.product.toString() !== req.params.productId);
      else item.quantity = qty;
    }
    await user.save(); res.redirect('/cart');
  } catch { req.flash('error','Error updating cart'); res.redirect('/cart'); }
});

router.post('/remove/:productId', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    user.cart = user.cart.filter(i => i.product.toString() !== req.params.productId);
    await user.save(); req.flash('success','Item removed'); res.redirect('/cart');
  } catch { req.flash('error','Error removing item'); res.redirect('/cart'); }
});

router.get('/checkout', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).populate('cart.product');
    if (!user.cart.length) { req.flash('error','Your cart is empty'); return res.redirect('/cart'); }
    res.render('cart/checkout', { cart: user.cart, user });
  } catch { req.flash('error','Error loading checkout'); res.redirect('/cart'); }
});

router.post('/checkout', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).populate('cart.product');
    const { street, city, state, zip, country, paymentMethod, jazzCashNumber, easypaisaNumber } = req.body;
    const items = user.cart.map(i => ({ product: i.product._id, name: i.product.name, price: i.product.price, quantity: i.quantity, image: i.product.image }));
    const totalAmount = items.reduce((s, i) => s + i.price * i.quantity, 0);

    // Determine actual payment method label
    let method = paymentMethod || 'Cash on Delivery';
    if (paymentMethod === 'JazzCash' && jazzCashNumber) method = `JazzCash (${jazzCashNumber})`;
    if (paymentMethod === 'Easypaisa' && easypaisaNumber) method = `Easypaisa (${easypaisaNumber})`;

    const order = await Order.create({
      user: user._id, items, totalAmount,
      shippingAddress: { street, city, state, zip, country: country||'Pakistan' },
      paymentMethod: method,
      // JazzCash/Easypaisa orders marked as Paid since user confirms transfer
      paymentStatus: (paymentMethod === 'JazzCash' || paymentMethod === 'Easypaisa') ? 'Paid' : 'Unpaid'
    });

    user.cart = []; user.orders.push(order._id);
    await user.save();

    // Send SMS confirmation
    const phone = user.phone || req.body.phone;
    await sendOrderSMS(phone, order._id.toString().slice(-6).toUpperCase(), totalAmount, method);

    req.flash('success','Order placed successfully! 🎉');
    res.redirect('/orders/'+order._id);
  } catch (err) { console.error(err); req.flash('error','Error placing order'); res.redirect('/cart/checkout'); }
});

module.exports = router;
