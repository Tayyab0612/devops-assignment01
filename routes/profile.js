const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const Order   = require('../models/Order');
const Product = require('../models/Product');

function requireLogin(req, res, next) {
  if (!req.session.user) { req.session.returnTo = req.originalUrl; req.flash('error','Please login'); return res.redirect('/auth/login'); }
  next();
}

// ── GET Profile ──────────────────────────────────────────────────
router.get('/', requireLogin, async (req, res) => {
  try {
    const user   = await User.findById(req.session.user._id);
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(5);
    res.render('profile/index', { user, orders, tab: 'profile' });
  } catch (err) { req.flash('error','Error loading profile'); res.redirect('/'); }
});

// ── POST Update Profile ──────────────────────────────────────────
router.post('/update', requireLogin, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.session.user._id);
    user.name  = name.trim();
    user.phone = phone ? phone.trim() : null;
    await user.save();
    // Update session
    req.session.user.name = user.name;
    req.flash('success', 'Profile updated!');
    res.redirect('/profile');
  } catch (err) { req.flash('error','Error updating profile'); res.redirect('/profile'); }
});

// ── POST Change Password ─────────────────────────────────────────
router.post('/change-password', requireLogin, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) { req.flash('error','New passwords do not match'); return res.redirect('/profile'); }
    if (newPassword.length < 6) { req.flash('error','Password must be at least 6 characters'); return res.redirect('/profile'); }
    const user = await User.findById(req.session.user._id);
    if (user.password && !(await user.comparePassword(currentPassword))) {
      req.flash('error','Current password is incorrect'); return res.redirect('/profile');
    }
    user.password = newPassword;
    await user.save();
    req.flash('success','Password changed successfully!');
    res.redirect('/profile');
  } catch (err) { req.flash('error','Error changing password'); res.redirect('/profile'); }
});

// ── GET Saved Addresses ──────────────────────────────────────────
router.get('/addresses', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    res.render('profile/addresses', { user, tab: 'addresses' });
  } catch { req.flash('error','Error loading addresses'); res.redirect('/profile'); }
});

// ── POST Add Address ─────────────────────────────────────────────
router.post('/addresses/add', requireLogin, async (req, res) => {
  try {
    const { label, street, city, state, zip, country, isDefault } = req.body;
    const user = await User.findById(req.session.user._id);
    if (isDefault === 'on') {
      user.savedAddresses.forEach(a => a.isDefault = false);
    }
    user.savedAddresses.push({ label: label||'Home', street, city, state, zip, country: country||'Pakistan', isDefault: isDefault==='on' });
    await user.save();
    req.flash('success','Address saved!');
    res.redirect('/profile/addresses');
  } catch (err) { req.flash('error','Error saving address'); res.redirect('/profile/addresses'); }
});

// ── POST Delete Address ──────────────────────────────────────────
router.post('/addresses/delete/:addrId', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    user.savedAddresses = user.savedAddresses.filter(a => a._id.toString() !== req.params.addrId);
    await user.save();
    req.flash('success','Address removed');
    res.redirect('/profile/addresses');
  } catch { req.flash('error','Error removing address'); res.redirect('/profile/addresses'); }
});

// ── POST Set Default Address ─────────────────────────────────────
router.post('/addresses/default/:addrId', requireLogin, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    user.savedAddresses.forEach(a => a.isDefault = a._id.toString() === req.params.addrId);
    await user.save();
    req.flash('success','Default address updated');
    res.redirect('/profile/addresses');
  } catch { req.flash('error','Error updating address'); res.redirect('/profile/addresses'); }
});

// ── GET Order History ────────────────────────────────────────────
router.get('/orders', requireLogin, async (req, res) => {
  try {
    const user   = await User.findById(req.session.user._id);
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 });
    res.render('profile/orders', { user, orders, tab: 'orders' });
  } catch { req.flash('error','Error loading orders'); res.redirect('/profile'); }
});

// ── POST Reorder ─────────────────────────────────────────────────
router.post('/reorder/:orderId', requireLogin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order || order.user.toString() !== req.session.user._id.toString()) {
      req.flash('error','Order not found'); return res.redirect('/profile/orders');
    }
    const user = await User.findById(req.session.user._id);
    for (const item of order.items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock === 0) continue;
      const cartItem = user.cart.find(c => c.product.toString() === item.product.toString());
      if (cartItem) cartItem.quantity += item.quantity;
      else user.cart.push({ product: item.product, quantity: item.quantity });
    }
    await user.save();
    req.flash('success','Items added to cart!');
    res.redirect('/cart');
  } catch (err) { req.flash('error','Error reordering'); res.redirect('/profile/orders'); }
});

module.exports = router;
