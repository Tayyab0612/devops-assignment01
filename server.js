require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const session    = require('express-session');
const flash      = require('connect-flash');
const methodOverride = require('method-override');
const passport   = require('passport');
const path       = require('path');

require('./config/passport');

const app = express();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ DB failed:', err.message); process.exit(1); });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false, cookie: { maxAge: 1000*60*60*24*7 } }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(async (req, res, next) => {
  res.locals.user     = req.session.user || null;
  res.locals.messages = { success: req.flash('success'), error: req.flash('error') };
  res.locals.cartCount = 0;
  if (req.session.user) {
    try {
      const u = await require('./models/User').findById(req.session.user._id).select('cart');
      if (u) res.locals.cartCount = u.cart.reduce((s,i)=>s+i.quantity, 0);
    } catch {}
  }
  next();
});

app.use('/products', require('./routes/products'));
app.use('/products', require('./routes/reviews'));
app.use('/auth',     require('./routes/auth'));
app.use('/cart',     require('./routes/cart'));
app.use('/profile',  require('./routes/profile'));
app.use('/',         require('./routes/admin'));

app.get('/', async (req, res) => {
  try {
    const Product = require('./models/Product');
    const [featured, newest, games, totalProducts] = await Promise.all([
      Product.find({ featured: true, stock: { $gt:0 } }).limit(4),
      Product.find({ stock: { $gt:0 } }).sort({ createdAt:-1 }).limit(8),
      Product.find({ category:'Games' }).sort({ createdAt:-1 }).limit(6),
      Product.countDocuments()
    ]);
    res.render('home', { featured, newest, games, totalProducts });
  } catch { res.render('home', { featured:[], newest:[], games:[], totalProducts:0 }); }
});

app.use((req, res) => res.status(404).send('<div style="text-align:center;padding:5rem;font-family:sans-serif"><h1 style="color:#6366f1">404</h1><h2>Page Not Found</h2><a href="/" style="color:#6366f1">← Home</a></div>'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 ShopZone → http://localhost:${PORT}`));
module.exports = app;
