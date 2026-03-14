# 🛒 ShopZone — Full-Stack E-Commerce (Node.js + Express + MySQL)

A complete e-commerce web application built for deployment on **AWS EC2 (IaaS)** and **AWS Elastic Beanstalk (PaaS)** with **Amazon RDS (MySQL)** as the database backend.

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js 4 |
| ORM | Sequelize 6 |
| Database | MySQL 8 / Amazon RDS (MySQL) |
| Templating | EJS |
| Auth | Sessions + bcryptjs + Passport (Google OAuth) |
| Storage | Amazon S3 (static assets / app zip) |

---

## 🔧 Local Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Create MySQL database locally
```sql
CREATE DATABASE shopzone;
```

### 3. Configure `.env`
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_NAME=shopzone
DB_USER=root
DB_PASS=your_mysql_password

SESSION_SECRET=any_long_random_string

GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=ShopZone <your@gmail.com>
BASE_URL=http://localhost:3000
```

### 4. Seed database & start
```bash
npm run seed    # creates all tables + demo data
npm start       # http://localhost:3000
```

**Demo accounts:**
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@shopzone.com | admin123 |
| User | user@shopzone.com | user123 |

---

---

# ☁️ AWS Deployment Guide

---

## PART I — Deploy on Amazon EC2 (IaaS)

### Step 1: Launch EC2 Instance

1. Log in to **AWS Management Console** → EC2 → **Launch Instance**
2. Configure:
   - **Name:** `shopzone-server`
   - **AMI:** Ubuntu Server 22.04 LTS (Free Tier eligible)
   - **Instance type:** `t2.micro` (Free Tier)
   - **Key pair:** Create new → name it `shopzone-key` → Download `.pem` file
3. **Security Group** — Add inbound rules:
   | Type | Port | Source |
   |------|------|--------|
   | SSH | 22 | My IP |
   | HTTP | 80 | 0.0.0.0/0 |
   | Custom TCP | 3000 | 0.0.0.0/0 |
4. Click **Launch Instance**

---

### Step 2: Connect via SSH

```bash
# On your local machine (Mac/Linux)
chmod 400 shopzone-key.pem
ssh -i "shopzone-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>

# Windows: use PuTTY or PowerShell
ssh -i shopzone-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
```

---

### Step 3: Install Node.js and MySQL on EC2

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v && npm -v

# Install MySQL Server
sudo apt install -y mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL and create database
sudo mysql
```

```sql
-- Inside MySQL prompt
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'ShopZone@123';
CREATE DATABASE shopzone;
FLUSH PRIVILEGES;
EXIT;
```

---

### Step 4: Upload Application Code

**Option A — Git (recommended)**
```bash
# On EC2
sudo apt install -y git
git clone https://github.com/YOUR_USERNAME/shopzone.git
cd shopzone
```

**Option B — SCP from local machine**
```bash
# On your local machine
scp -i shopzone-key.pem -r ./ecommerce ubuntu@<EC2_IP>:/home/ubuntu/shopzone
```

**Option C — Via Amazon S3**
```bash
# Upload zip to S3 from local
aws s3 cp ecommerce-shopzone.zip s3://YOUR_BUCKET_NAME/

# Download on EC2
sudo apt install -y awscli
aws s3 cp s3://YOUR_BUCKET_NAME/ecommerce-shopzone.zip .
unzip ecommerce-shopzone.zip
cd ecommerce
```

---

### Step 5: Configure and Run

```bash
cd /home/ubuntu/shopzone

# Install dependencies
npm install

# Create .env file
nano .env
```

Paste your `.env` content with:
```
DB_HOST=localhost
DB_USER=root
DB_PASS=ShopZone@123
DB_NAME=shopzone
BASE_URL=http://<YOUR_EC2_PUBLIC_IP>:3000
```

```bash
# Seed the database (creates tables + demo data)
npm run seed

# Test run
npm start
```

Visit: `http://<YOUR_EC2_PUBLIC_IP>:3000` ✅

---

### Step 6: Keep App Running with PM2

```bash
# Install PM2 process manager
sudo npm install -g pm2

# Start app
pm2 start server.js --name shopzone

# Auto-start on server reboot
pm2 startup
pm2 save
```

---

### Step 7: (Optional) Run on Port 80 with Nginx

```bash
sudo apt install -y nginx

sudo nano /etc/nginx/sites-available/shopzone
```

Paste:
```nginx
server {
    listen 80;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/shopzone /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

Visit: `http://<YOUR_EC2_PUBLIC_IP>` (port 80) ✅

---
---

## PART II — Deploy on Elastic Beanstalk + RDS (PaaS)

### Step 1: Create Amazon RDS (MySQL) Instance

1. AWS Console → **RDS** → **Create database**
2. Settings:
   - **Engine:** MySQL 8.0
   - **Template:** Free tier
   - **DB instance identifier:** `shopzone-db`
   - **Master username:** `admin`
   - **Master password:** `ShopZone@RDS123`
   - **DB name:** `shopzone`
   - **Public access:** Yes (for initial setup)
3. Note the **Endpoint** after creation (e.g., `shopzone-db.xxxx.us-east-1.rds.amazonaws.com`)

---

### Step 2: Upload Application Code to S3

1. Zip the application (**exclude node_modules**):
```bash
zip -r shopzone-app.zip . -x "node_modules/*" -x ".git/*"
```

2. AWS Console → **S3** → **Create bucket**
   - Name: `shopzone-deployments`
   - Region: same as your EB environment
3. Upload `shopzone-app.zip` to the bucket

---

### Step 3: Create Elastic Beanstalk Environment

1. AWS Console → **Elastic Beanstalk** → **Create Application**
2. Settings:
   - **Application name:** `shopzone`
   - **Platform:** Node.js 18
   - **Application code:** Upload your zip from S3
3. Click **Configure more options** → **Software** → Add Environment variables:

| Key | Value |
|-----|-------|
| PORT | 8080 |
| NODE_ENV | production |
| DB_HOST | `<RDS Endpoint>` |
| DB_PORT | 3306 |
| DB_NAME | shopzone |
| DB_USER | admin |
| DB_PASS | ShopZone@RDS123 |
| SESSION_SECRET | your_secret_here |
| BASE_URL | http://your-eb-url.elasticbeanstalk.com |

4. Click **Create Environment** — wait ~5 minutes

---

### Step 4: Seed the RDS Database

Connect to RDS from your local machine or EC2:

```bash
# From local machine (requires MySQL client)
mysql -h <RDS_ENDPOINT> -u admin -p shopzone

# Or run seed remotely
DB_HOST=<RDS_ENDPOINT> DB_USER=admin DB_PASS=ShopZone@RDS123 DB_NAME=shopzone npm run seed
```

---

### Step 5: Access Your App

Visit the **Elastic Beanstalk URL** shown in the console:
`http://shopzone.us-east-1.elasticbeanstalk.com` ✅

---

## 📊 Database Schema (MySQL / RDS)

Sequelize auto-creates these tables on first run (`sync({ alter: true })`):

```
users          → id, name, email, password, google_id, avatar, role, addr_*, reset_password_*
products       → id, name, description, price, category, platform, brand, stock, image, rating, featured, tags
cart_items     → id, user_id, product_id, quantity
orders         → id, user_id, total_amount, status, payment_status, shipping_*
order_items    → id, order_id, product_id, name, price, quantity, image
```

---

## ✨ Features

- 🔐 Auth — Register, Login, Google OAuth, Forgot/Reset Password (email)
- 🎮 Games — Dedicated section with XBOX / PC / PlayStation sub-filters
- 🔍 Search & Filter — Name, category, platform, price range, brand, sort
- 🛒 Cart — Add / update qty / remove items
- 📦 Orders — Checkout → order history → order detail
- ⚙️ Admin — Dashboard stats, product CRUD (with platform), order management
- 📱 Responsive — Mobile-friendly layout
"# devops-assignment01" 
