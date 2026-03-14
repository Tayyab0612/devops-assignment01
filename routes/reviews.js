const express = require('express');
const router  = express.Router({ mergeParams: true });
const Review  = require('../models/Review');
const Product = require('../models/Product');
const Order   = require('../models/Order');

function requireLogin(req, res, next) {
  if (!req.session.user) { req.flash('error','Please login to leave a review'); return res.redirect('/auth/login'); }
  next();
}

// POST submit review for a product
router.post('/:productId/reviews', requireLogin, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;

    // Check user has purchased this product
    const hasPurchased = await Order.findOne({
      user: req.session.user._id,
      'items.product': productId,
      status: { $in: ['Delivered', 'Shipped'] }
    });
    if (!hasPurchased) {
      req.flash('error', 'You can only review products you have purchased and received.');
      return res.redirect('/products/' + productId);
    }

    // Check no existing review
    const existing = await Review.findOne({ product: productId, user: req.session.user._id });
    if (existing) {
      req.flash('error', 'You have already reviewed this product.');
      return res.redirect('/products/' + productId);
    }

    // Create review
    await Review.create({
      product: productId,
      user:    req.session.user._id,
      name:    req.session.user.name,
      rating:  parseInt(rating),
      comment: comment.trim()
    });

    // Recalculate product rating
    const reviews = await Review.find({ product: productId });
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await Product.findByIdAndUpdate(productId, { rating: Math.round(avgRating * 10) / 10, numReviews: reviews.length });

    req.flash('success', 'Review submitted! Thank you.');
    res.redirect('/products/' + productId);
  } catch (err) {
    if (err.code === 11000) { req.flash('error','You have already reviewed this product.'); }
    else { req.flash('error','Error submitting review'); }
    res.redirect('/products/' + req.params.productId);
  }
});

// POST delete own review
router.post('/:productId/reviews/:reviewId/delete', requireLogin, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) { req.flash('error','Review not found'); return res.redirect('/products/'+req.params.productId); }
    if (review.user.toString() !== req.session.user._id.toString() && req.session.user.role !== 'admin') {
      req.flash('error','Not authorized'); return res.redirect('/products/'+req.params.productId);
    }
    await Review.findByIdAndDelete(req.params.reviewId);
    const reviews = await Review.find({ product: req.params.productId });
    const avgRating = reviews.length ? reviews.reduce((s,r)=>s+r.rating,0)/reviews.length : 0;
    await Product.findByIdAndUpdate(req.params.productId, { rating: Math.round(avgRating*10)/10, numReviews: reviews.length });
    req.flash('success','Review deleted');
    res.redirect('/products/'+req.params.productId);
  } catch { req.flash('error','Error deleting review'); res.redirect('/products/'+req.params.productId); }
});

module.exports = router;
