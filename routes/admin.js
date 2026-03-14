const express = require('express');
const router  = express.Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');
const User    = require('../models/User');

function requireLogin(req, res, next) {
  if (!req.session.user) { req.session.returnTo = req.originalUrl; req.flash('error','Please login'); return res.redirect('/auth/login'); }
  next();
}
function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error','Admin access required'); res.redirect('/');
}

router.get('/orders', requireLogin, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.session.user._id }).sort({ createdAt: -1 });
    res.render('orders/index', { orders });
  } catch { req.flash('error','Error loading orders'); res.redirect('/'); }
});

router.get('/orders/:id', requireLogin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user');
    if (!order) { req.flash('error','Order not found'); return res.redirect('/orders'); }
    if (order.user._id.toString() !== req.session.user._id.toString() && req.session.user.role !== 'admin') {
      req.flash('error','Access denied'); return res.redirect('/orders');
    }
    res.render('orders/show', { order });
  } catch { req.flash('error','Error loading order'); res.redirect('/orders'); }
});

router.get('/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const [totalProducts, totalOrders, totalUsers, recentOrders, revenueResult, lowStock] = await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments(),
      Order.find().populate('user','name email').sort({ createdAt:-1 }).limit(5),
      Order.aggregate([{ $match:{ paymentStatus:'Paid' } }, { $group:{ _id:null, total:{ $sum:'$totalAmount' } } }]),
      Product.find({ stock: { $lte: 5 } }).sort({ stock: 1 }).limit(5)
    ]);

    // Sales chart data — last 7 days
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0,0,0,0);
      const end = new Date(d); end.setHours(23,59,59,999);
      const dayOrders = await Order.aggregate([
        { $match: { createdAt: { $gte: d, $lte: end } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
      ]);
      last7.push({
        date: d.toLocaleDateString('en-PK', { weekday:'short', month:'short', day:'numeric' }),
        revenue: dayOrders[0]?.total || 0,
        orders: dayOrders[0]?.count || 0
      });
    }

    // Category breakdown
    const categoryStats = await Order.aggregate([
      { $unwind: '$items' },
      { $lookup: { from: 'products', localField: 'items.product', foreignField: '_id', as: 'prod' } },
      { $unwind: { path: '$prod', preserveNullAndEmptyArrays: true } },
      { $group: { _id: '$prod.category', revenue: { $sum: { $multiply: ['$items.price','$items.quantity'] } }, count: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } }, { $limit: 6 }
    ]);

    res.render('admin/dashboard', {
      totalProducts, totalOrders, totalUsers, recentOrders, lowStock,
      revenue: revenueResult[0]?.total || 0,
      chartData: JSON.stringify(last7),
      categoryData: JSON.stringify(categoryStats)
    });
  } catch (err) { console.error(err); req.flash('error','Error loading dashboard'); res.redirect('/'); }
});

router.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.render('admin/products', { products });
  } catch { req.flash('error','Error loading products'); res.redirect('/admin/dashboard'); }
});

router.get('/admin/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Order.find().populate('user','name email').sort({ createdAt: -1 });
    res.render('admin/orders', { orders });
  } catch { req.flash('error','Error loading orders'); res.redirect('/admin/dashboard'); }
});

router.post('/admin/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    await Order.findByIdAndUpdate(req.params.id, { status, paymentStatus });
    req.flash('success','Order updated!'); res.redirect('/admin/orders');
  } catch { req.flash('error','Error updating order'); res.redirect('/admin/orders'); }
});

module.exports = router;
