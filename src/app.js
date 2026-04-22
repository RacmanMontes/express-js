const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();

// ==============================
// 🔐 SECURITY (Helmet)
// ==============================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));

// ==============================
// 🌐 CORS (FIXED CLEAN VERSION)
// ==============================
const allowedOrigins = [
    'http://localhost',
    'https://localhost', // ✅ VERY IMPORTANT FIX
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8100',
    'http://localhost:8200',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:8100',
    'https://express-js-dtzo.onrender.com',
    'https://shoepee-customer.onrender.com'
];

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (mobile apps, curl, postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS: ' + origin));
        }
    },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization']
}));

// ==============================
// 🚦 RATE LIMIT
// ==============================
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100
});
app.use('/api', limiter);

// ==============================
// 📦 BODY PARSER
// ==============================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==============================
// 🔌 API ROUTES
// ==============================
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', uploadRoutes);

// ==============================
// ❤️ HEALTH CHECK
// ==============================
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString()
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// ==============================
// 🖼️ STATIC FILES (UPLOADS)
// ==============================
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res, filePath) => {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.jpg' || ext === '.jpeg') {
            res.set('Content-Type', 'image/jpeg');
        } else if (ext === '.png') {
            res.set('Content-Type', 'image/png');
        } else if (ext === '.gif') {
            res.set('Content-Type', 'image/gif');
        } else if (ext === '.webp') {
            res.set('Content-Type', 'image/webp');
        }

        res.set('Cache-Control', 'public, max-age=31536000');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// ==============================
// 🌐 FRONTEND SERVING
// ==============================
app.use('/', express.static(path.join(__dirname, '../customer')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ==============================
// ❌ ERROR HANDLER
// ==============================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: err.message
    });
});

// ==============================
// 🚫 404 HANDLER
// ==============================
app.use((req, res) => {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ message: 'API route not found' });
    }

    if (req.path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        return res.status(404).send('Image not found');
    }

    res.sendFile(path.join(__dirname, '../customer/index.html'));
});

module.exports = app;
