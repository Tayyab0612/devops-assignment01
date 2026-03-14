const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label:   { type: String, default: 'Home' }, // Home, Work, Other
  street:  String,
  city:    String,
  state:   String,
  zip:     String,
  country: { type: String, default: 'Pakistan' },
  isDefault: { type: Boolean, default: false }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, default: null },
  phone:    { type: String, default: null },
  googleId: { type: String, default: null },
  avatar:   { type: String, default: null },
  role:     { type: String, enum: ['user','admin'], default: 'user' },
  cart: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 }
  }],
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  // Legacy single address (kept for backward compat)
  address: { street: String, city: String, state: String, zip: String, country: String },
  // Multiple saved addresses
  savedAddresses: [addressSchema],
  resetPasswordToken:   { type: String, default: null },
  resetPasswordExpires: { type: Date,   default: null }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
