const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, maxlength: 1000 },
  price:       { type: Number, required: true, min: 0 },
  category: {
    type: String, required: true,
    enum: ['Electronics','Clothing','Books','Home & Garden','Sports','Beauty','Toys','Automotive','Games','Other']
  },
  platform: { type: String, enum: ['XBOX','PC','PlayStation',null], default: null },
  brand:      { type: String, default: 'Generic' },
  stock:      { type: Number, default: 0, min: 0 },
  image:      { type: String, default: '/images/placeholder.svg' },
  images:     [{ type: String }],   // gallery images
  rating:     { type: Number, default: 0, min: 0, max: 5 },
  numReviews: { type: Number, default: 0 },
  featured:   { type: Boolean, default: false },
  tags:       [String]
}, { timestamps: true });

productSchema.index({ name: 'text', description: 'text', brand: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
