require('dotenv').config();
const mongoose = require('mongoose');
const Product  = require('./models/Product');
const User     = require('./models/User');

const products = [
  // ── Electronics ──────────────────────────────────────────────────────────
  { name:'Samsung Galaxy S24 Ultra', description:'6.8" Dynamic AMOLED, 200MP camera, Snapdragon 8 Gen 3, 5000mAh battery. Available at Samsung Pakistan.', price:289999, category:'Electronics', brand:'Samsung', stock:30, rating:4.8, numReviews:412, featured:true, image:'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&q=80', tags:['smartphone','samsung','5g'] },
  { name:'iPhone 15 128GB', description:'A16 Bionic chip, 48MP main camera, Dynamic Island. Official Apple Pakistan warranty included.', price:219999, category:'Electronics', brand:'Apple', stock:45, rating:4.7, numReviews:876, featured:true, image:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500&q=80', tags:['iphone','apple','smartphone'] },
  { name:'Haier 55" 4K Smart TV', description:'55-inch 4K UHD, Android TV, built-in WiFi, HDR10+. Popular in Pakistan for its value and local warranty.', price:89999, category:'Electronics', brand:'Haier', stock:20, rating:4.5, numReviews:234, image:'https://images.unsplash.com/photo-1593359677879-a4bb92f829e1?w=500&q=80', tags:['tv','4k','haier'] },
  { name:'Dell Laptop Core i5 13th Gen', description:'Intel Core i5-1335U, 8GB RAM, 512GB SSD, 15.6" FHD display. Ideal for students and professionals in Pakistan.', price:119999, category:'Electronics', brand:'Dell', stock:25, rating:4.6, numReviews:567, featured:true, image:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&q=80', tags:['laptop','dell','i5'] },
  { name:'JBL Tune 760NC Headphones', description:'Active noise cancelling, 35-hour battery, foldable design. Available at all major electronics shops in Pakistan.', price:24999, category:'Electronics', brand:'JBL', stock:60, rating:4.4, numReviews:321, image:'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80', tags:['headphones','jbl','wireless'] },
  { name:'Canon EOS 250D DSLR Camera', description:'24.1MP APS-C sensor, 4K video, Wi-Fi connectivity. Great entry-level DSLR popular among Pakistani photography enthusiasts.', price:84999, category:'Electronics', brand:'Canon', stock:15, rating:4.7, numReviews:189, image:'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&q=80', tags:['camera','dslr','canon'] },

  // ── Clothing ─────────────────────────────────────────────────────────────
  { name:'Gul Ahmed Summer Lawn 3-Piece', description:'Premium printed lawn fabric with embroidered dupatta. Classic Pakistani summer collection for women.', price:3499, category:'Clothing', brand:'Gul Ahmed', stock:150, rating:4.8, numReviews:1243, featured:true, image:'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=500&q=80', tags:['lawn','women','summer','pakistani'] },
  { name:'Bonanza Satrangi Kameez Shalwar', description:'Pure cotton kameez shalwar for men. Comfortable everyday wear with traditional Pakistani embroidery on collar.', price:2999, category:'Clothing', brand:'Bonanza Satrangi', stock:200, rating:4.5, numReviews:876, image:'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&q=80', tags:['shalwar','kameez','men','cotton'] },
  { name:'Khaadi Unstitched Fabric', description:'Premium quality unstitched fabric from Khaadi. Perfect for custom stitching. Available in multiple colors.', price:4500, category:'Clothing', brand:'Khaadi', stock:100, rating:4.6, numReviews:654, image:'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=500&q=80', tags:['khaadi','unstitched','fabric'] },
  { name:'Service Shoes Casual Sneakers', description:'Comfortable everyday casual sneakers by Service — Pakistan\'s most popular footwear brand. Sizes 38-46.', price:3299, category:'Clothing', brand:'Service Shoes', stock:120, rating:4.3, numReviews:432, image:'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', tags:['shoes','sneakers','service'] },

  // ── Books ─────────────────────────────────────────────────────────────────
  { name:'Urdu Digest — Annual Collection', description:'Complete annual collection of Urdu Digest short stories. A staple in every Pakistani household library.', price:1200, category:'Books', brand:'Urdu Digest', stock:300, rating:4.7, numReviews:2341, image:'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80', tags:['urdu','digest','stories'] },
  { name:'PPSC/CSS Preparation Guide 2025', description:'Complete guide for PPSC, CSS and PMS competitive exams. Includes past papers, MCQs, and essay tips. Widely used by aspirants.', price:1800, category:'Books', brand:'Caravan Book House', stock:250, rating:4.6, numReviews:1876, image:'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=500&q=80', tags:['css','ppsc','competitive','exam'] },
  { name:"Iblees Kay Mazaahir — Bano Qudsia", description:"Classic Urdu novel by the legendary Bano Qudsia. A must-read for every Pakistani literature lover.", price:950, category:'Books', brand:'Sang-e-Meel Publications', stock:180, rating:4.9, numReviews:3421, image:'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500&q=80', tags:['urdu','novel','bano qudsia'] },

  // ── Home & Garden ─────────────────────────────────────────────────────────
  { name:'Dawlance Inverter AC 1.5 Ton', description:'1.5 Ton DC Inverter Air Conditioner with heat and cool function. Energy-saving inverter technology. 5-year warranty.', price:109999, category:'Home & Garden', brand:'Dawlance', stock:25, rating:4.7, numReviews:1234, featured:true, image:'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80', tags:['ac','inverter','dawlance'] },
  { name:'PEL Refrigerator 14 CFT', description:'Double door refrigerator with large capacity, anti-bacterial coating, and fast cooling technology. Made in Pakistan.', price:64999, category:'Home & Garden', brand:'PEL', stock:18, rating:4.5, numReviews:567, image:'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=500&q=80', tags:['fridge','pel','refrigerator'] },
  { name:'Anex Microwave Oven 30L', description:'30-litre microwave oven with grill function, auto cook menu, and child safety lock. Best seller in Pakistan.', price:18999, category:'Home & Garden', brand:'Anex', stock:40, rating:4.3, numReviews:432, image:'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&q=80', tags:['microwave','anex','kitchen'] },
  { name:'Royal Doulton Dinner Set 24-Piece', description:'Complete 24-piece bone china dinner set. Elegant design suitable for Pakistani formal dining and family gatherings.', price:12999, category:'Home & Garden', brand:'Royal Doulton', stock:35, rating:4.6, numReviews:234, image:'https://images.unsplash.com/photo-1584990347449-a2d4c2c044f2?w=500&q=80', tags:['dinner set','crockery','kitchen'] },

  // ── Sports ────────────────────────────────────────────────────────────────
  { name:'Grays Hockey Stick', description:'Professional hockey stick used by Pakistani players. Full-size composite stick with carbon fibre construction.', price:8500, category:'Sports', brand:'Grays', stock:50, rating:4.8, numReviews:345, featured:true, image:'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=500&q=80', tags:['hockey','grays','sports'] },
  { name:'Slazenger Cricket Bat', description:'English willow cricket bat, Grade 1. Ideal for club and tape-ball cricket. Popular choice among Pakistani cricketers.', price:7999, category:'Sports', brand:'Slazenger', stock:65, rating:4.6, numReviews:678, image:'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=500&q=80', tags:['cricket','bat','slazenger'] },
  { name:'Adidas Football Size 5', description:'Official size 5 football with durable stitching. Perfect for street football and 5-a-side — the most popular sport in Pakistan.', price:4500, category:'Sports', brand:'Adidas', stock:90, rating:4.5, numReviews:543, image:'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?w=500&q=80', tags:['football','soccer','adidas'] },

  // ── Beauty ────────────────────────────────────────────────────────────────
  { name:'Hemani Herbal Hair Oil 200ml', description:'100% natural herbal hair oil with amla, coconut and olive. Trusted Pakistani brand for hair growth and strengthening.', price:650, category:'Beauty', brand:'Hemani', stock:400, rating:4.7, numReviews:5678, image:'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=500&q=80', tags:['hair','oil','herbal','hemani'] },
  { name:'Fair & Lovely Advanced Multi Vitamin', description:'Skin brightening cream with multi-vitamin formula. One of the top-selling beauty products in Pakistan.', price:450, category:'Beauty', brand:'Fair & Lovely', stock:500, rating:4.2, numReviews:8901, image:'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&q=80', tags:['cream','beauty','skincare'] },

  // ── Automotive ────────────────────────────────────────────────────────────
  { name:'Suzuki Mehran Car Seat Cover', description:'High quality leatherette seat covers custom-made for Suzuki Mehran. Protect your seats in style — a classic choice for Pakistani car owners.', price:3500, category:'Automotive', brand:'Local Brand', stock:80, rating:4.4, numReviews:321, image:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&q=80', tags:['car','suzuki','seat cover'] },
  { name:'Mobil 1 Engine Oil 4L', description:'Full synthetic engine oil 5W-30 for petrol engines. Trusted by mechanics and car owners all across Pakistan.', price:6500, category:'Automotive', brand:'Mobil', stock:120, rating:4.8, numReviews:1234, image:'https://images.unsplash.com/photo-1635274605638-d44babc08a4f?w=500&q=80', tags:['engine oil','mobil','car'] },

  // ── Games — PlayStation ───────────────────────────────────────────────────
  { name:'EA FC 25 (PS5)', description:'The latest EA Sports football game. Play as your favourite Pakistani Super League teams and international clubs.', price:12999, category:'Games', platform:'PlayStation', brand:'EA Sports', stock:80, rating:4.7, numReviews:3421, featured:true, image:'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=500&q=80', tags:['football','ea','sports'] },
  { name:'God of War Ragnarök (PS5)', description:'Kratos and Atreus venture through the Nine Realms. One of the highest rated PS5 games available in Pakistan.', price:11999, category:'Games', platform:'PlayStation', brand:'Santa Monica Studio', stock:50, rating:4.9, numReviews:2100, image:'https://images.unsplash.com/photo-1625805866449-f01f2b40a38a?w=500&q=80', tags:['action','adventure','ps5'] },
  { name:'Spider-Man 2 (PS5)', description:"Marvel's Spider-Man 2 — play as both Peter Parker and Miles Morales in this blockbuster PS5 exclusive.", price:12499, category:'Games', platform:'PlayStation', brand:'Insomniac Games', stock:45, rating:4.9, numReviews:1543, image:'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&q=80', tags:['action','marvel','ps5'] },

  // ── Games — XBOX ──────────────────────────────────────────────────────────
  { name:'Forza Horizon 5 (Xbox)', description:'Race through Mexico in the ultimate open-world driving game. Available on Xbox Series X/S and Xbox One in Pakistan.', price:9999, category:'Games', platform:'XBOX', brand:'Playground Games', stock:55, rating:4.8, numReviews:2310, featured:true, image:'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&q=80', tags:['racing','cars','xbox'] },
  { name:'Halo Infinite (Xbox)', description:"Master Chief's latest adventure on Xbox. Gripping campaign with free-to-play multiplayer. Huge fan base in Pakistan.", price:8499, category:'Games', platform:'XBOX', brand:'343 Industries', stock:60, rating:4.4, numReviews:1820, image:'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=500&q=80', tags:['fps','halo','xbox'] },
  { name:'Mortal Kombat 1 (Xbox)', description:'The iconic fighting game series returns. Play as classic and new fighters. Extremely popular in Pakistani gaming cafes.', price:9499, category:'Games', platform:'XBOX', brand:'NetherRealm', stock:40, rating:4.5, numReviews:987, image:'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&q=80', tags:['fighting','mortal kombat','xbox'] },

  // ── Games — PC ────────────────────────────────────────────────────────────
  { name:"Baldur's Gate 3 (PC)", description:'5× Game of the Year 2023. The ultimate D&D RPG experience. Very popular among Pakistani PC gamers.', price:7999, category:'Games', platform:'PC', brand:'Larian Studios', stock:999, rating:5.0, numReviews:8800, featured:true, image:'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&q=80', tags:['rpg','fantasy','pc'] },
  { name:'GTA V Premium Edition (PC)', description:'Grand Theft Auto V with all DLCs. The most played PC game in Pakistan — available at all major game shops.', price:2999, category:'Games', platform:'PC', brand:'Rockstar Games', stock:999, rating:4.8, numReviews:15000, image:'https://images.unsplash.com/photo-1614854262318-831574f15f1f?w=500&q=80', tags:['open-world','gta','pc'] },
  { name:'FIFA 23 (PC)', description:'Classic FIFA 23 for PC. Budget-friendly option for Pakistani football gaming fans. Works on most mid-range PCs.', price:1999, category:'Games', platform:'PC', brand:'EA Sports', stock:999, rating:4.5, numReviews:12000, image:'https://images.unsplash.com/photo-1500964757637-c85e8a162699?w=500&q=80', tags:['football','fifa','pc'] },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ MongoDB connected');

  await Product.deleteMany({});
  await User.deleteMany({});
  console.log('🗑️  Cleared old data');

  await Product.insertMany(products);
  console.log(`✅ ${products.length} Pakistani products added`);

  await User.create({ name:'Admin User', email:'admin@shopzone.com', password:'admin123', role:'admin' });
  await User.create({ name:'Ali Hassan', email:'user@shopzone.com', password:'user123' });
  console.log('✅ admin@shopzone.com / admin123');
  console.log('✅ user@shopzone.com  / user123');
  console.log('\n🚀 Done! Run: npm start → http://localhost:3000');
  process.exit(0);
}

seed().catch(err => { console.error('❌ Seed failed:', err.message); process.exit(1); });
