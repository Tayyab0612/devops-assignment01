const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const Review  = require('../models/Review');
const Order   = require('../models/Order');

const ALL_CATEGORIES = ['Electronics','Clothing','Books','Home & Garden','Sports','Beauty','Toys','Automotive','Games','Other'];
const GAME_PLATFORMS = ['XBOX','PC','PlayStation'];

function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error','Admin access required'); res.redirect('/');
}

router.get('/', async (req, res) => {
  try {
    const { search, category, platform, minPrice, maxPrice, sort, brand, page = 1 } = req.query;
    const limit = 12, skip = (parseInt(page)-1) * limit;
    let query = {};
    if (search && search.trim()) {
      try { query.$text = { $search: search.trim() }; }
      catch { query.name = new RegExp(search.trim(), 'i'); }
    }
    if (category && category !== 'all') query.category = category;
    if (platform && platform !== 'all') query.platform = platform;
    if (brand && brand.trim()) query.brand = new RegExp(brand.trim(), 'i');
    const min = parseFloat(minPrice), max = parseFloat(maxPrice);
    if (!isNaN(min) || !isNaN(max)) {
      query.price = {};
      if (!isNaN(min)) query.price.$gte = min;
      if (!isNaN(max)) query.price.$lte = max;
    }
    const SORT = { 'price-asc':{price:1},'price-desc':{price:-1},'rating':{rating:-1},'name':{name:1},'newest':{createdAt:-1} };
    const sortOption = SORT[sort] || { createdAt: -1 };
    const [products, totalProducts] = await Promise.all([
      Product.find(query).sort(sortOption).skip(skip).limit(limit),
      Product.countDocuments(query)
    ]);
    res.render('products/index', {
      products, categories: ALL_CATEGORIES, platforms: GAME_PLATFORMS,
      currentPage: parseInt(page), totalPages: Math.ceil(totalProducts/limit), totalProducts,
      filters: { search:search||'', category:category||'', platform:platform||'', minPrice:minPrice||'', maxPrice:maxPrice||'', sort:sort||'', brand:brand||'' }
    });
  } catch (err) { console.error(err); req.flash('error','Error loading products'); res.redirect('/'); }
});

router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) return res.redirect('/products');
    const product = await Product.findById(req.params.id);
    if (!product) { req.flash('error','Product not found'); return res.redirect('/products'); }
    const relWhere = { category: product.category, _id: { $ne: product._id } };
    if (product.platform) relWhere.platform = product.platform;
    const [related, reviews] = await Promise.all([
      Product.find(relWhere).limit(4),
      Review.find({ product: product._id }).sort({ createdAt: -1 })
    ]);
    // Check if current user has purchased and can review
    let canReview = false, hasReviewed = false;
    if (req.session.user) {
      const [purchased, existing] = await Promise.all([
        Order.findOne({ user: req.session.user._id, 'items.product': product._id, status: { $in: ['Delivered','Shipped'] } }),
        Review.findOne({ product: product._id, user: req.session.user._id })
      ]);
      canReview  = !!purchased;
      hasReviewed = !!existing;
    }
    res.render('products/show', { product, related, reviews, canReview, hasReviewed });
  } catch (err) { console.error(err); req.flash('error','Error loading product'); res.redirect('/products'); }
});

router.get('/admin/new', requireAdmin, (req, res) => {
  res.render('admin/product-form', { product: null, categories: ALL_CATEGORIES, platforms: GAME_PLATFORMS });
});
router.post('/admin', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, platform, brand, stock, image, images, featured, tags } = req.body;
    const galleryImages = images ? images.split('\n').map(u=>u.trim()).filter(Boolean) : [];
    await Product.create({ name, description, price: parseFloat(price), category,
      platform: category==='Games' && platform ? platform : null,
      brand, stock: parseInt(stock)||0, image: image||'/images/placeholder.svg',
      images: galleryImages, featured: featured==='on',
      tags: tags ? tags.split(',').map(t=>t.trim()).filter(Boolean) : [] });
    req.flash('success',`Product "${name}" created!`); res.redirect('/admin/products');
  } catch (err) { req.flash('error','Error: '+err.message); res.redirect('/products/admin/new'); }
});
router.get('/admin/edit/:id', requireAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    res.render('admin/product-form', { product, categories: ALL_CATEGORIES, platforms: GAME_PLATFORMS });
  } catch { req.flash('error','Product not found'); res.redirect('/admin/products'); }
});
router.put('/admin/:id', requireAdmin, async (req, res) => {
  try {
    const { name, description, price, category, platform, brand, stock, image, images, featured, tags } = req.body;
    const galleryImages = images ? images.split('\n').map(u=>u.trim()).filter(Boolean) : [];
    await Product.findByIdAndUpdate(req.params.id, { name, description, price: parseFloat(price), category,
      platform: category==='Games' && platform ? platform : null,
      brand, stock: parseInt(stock)||0, image: image||'/images/placeholder.svg',
      images: galleryImages, featured: featured==='on',
      tags: tags ? tags.split(',').map(t=>t.trim()).filter(Boolean) : [] });
    req.flash('success','Product updated!'); res.redirect('/admin/products');
  } catch (err) { req.flash('error','Error updating product'); res.redirect('/admin/products'); }
});
router.delete('/admin/:id', requireAdmin, async (req, res) => {
  try { await Product.findByIdAndDelete(req.params.id); req.flash('success','Product deleted!'); res.redirect('/admin/products'); }
  catch { req.flash('error','Error deleting product'); res.redirect('/admin/products'); }
});

module.exports = router;
