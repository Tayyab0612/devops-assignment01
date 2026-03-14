const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const passport = require('passport');
const User     = require('../models/User');
const { sendPasswordResetEmail } = require('../config/mailer');

router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/register');
});
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, confirm } = req.body;
    if (password !== confirm) { req.flash('error','Passwords do not match'); return res.redirect('/auth/register'); }
    if (await User.findOne({ email })) { req.flash('error','Email already registered'); return res.redirect('/auth/register'); }
    const user = await User.create({ name, email, password });
    req.session.user = { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
    req.flash('success', `Welcome, ${user.name}!`);
    res.redirect('/');
  } catch (err) { req.flash('error','Registration failed: '+err.message); res.redirect('/auth/register'); }
});

router.get('/login', (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('auth/login');
});
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      req.flash('error','Invalid email or password'); return res.redirect('/auth/login');
    }
    req.session.user = { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar };
    req.flash('success', `Welcome back, ${user.name}!`);
    const to = req.session.returnTo || '/'; delete req.session.returnTo;
    res.redirect(to);
  } catch (err) { req.flash('error','Login failed'); res.redirect('/auth/login'); }
});

router.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

router.get('/google', passport.authenticate('google', { scope: ['profile','email'] }));
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/auth/login', failureFlash: true }),
  (req, res) => {
    const u = req.user;
    req.session.user = { _id: u._id, name: u.name, email: u.email, role: u.role, avatar: u.avatar };
    req.flash('success', `Welcome, ${u.name}!`);
    res.redirect('/');
  }
);

router.get('/forgot', (req, res) => { if (req.session.user) return res.redirect('/'); res.render('auth/forgot'); });
router.post('/forgot', async (req, res) => {
  try {
    const msg = 'If that email is registered, a reset link has been sent.';
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user || (user.googleId && !user.password)) { req.flash('success', msg); return res.redirect('/auth/forgot'); }
    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken   = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    const resetURL = `${process.env.BASE_URL}/auth/reset/${token}`;
    try { await sendPasswordResetEmail(user.email, user.name, resetURL); }
    catch (e) { console.log('RESET LINK (dev):', resetURL); }
    req.flash('success', msg); res.redirect('/auth/forgot');
  } catch (err) { req.flash('error','Something went wrong.'); res.redirect('/auth/forgot'); }
});

router.get('/reset/:token', async (req, res) => {
  const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
  if (!user) { req.flash('error','Reset link is invalid or expired.'); return res.redirect('/auth/forgot'); }
  res.render('auth/reset', { token: req.params.token });
});
router.post('/reset/:token', async (req, res) => {
  try {
    const { password, confirm } = req.body;
    if (password !== confirm) { req.flash('error','Passwords do not match'); return res.redirect(`/auth/reset/${req.params.token}`); }
    const user = await User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } });
    if (!user) { req.flash('error','Reset link expired.'); return res.redirect('/auth/forgot'); }
    user.password = password; user.resetPasswordToken = null; user.resetPasswordExpires = null;
    await user.save();
    req.flash('success','Password updated! Please log in.'); res.redirect('/auth/login');
  } catch (err) { req.flash('error','Error resetting password'); res.redirect('/auth/forgot'); }
});

module.exports = router;
