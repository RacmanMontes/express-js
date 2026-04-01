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

// Security middleware - but allow iframes for images
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));

// Configure CORS properly - ADD IONIC PORT 8100
const corsOptions = {
    origin: [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:8100',  // ADD IONIC DEV SERVER
        'http://localhost:8200',  // Alternative Ionic port
        'http://127.0.0.1:3000', 
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8100',
        // Add your Render domain for production
        'https://express-js-dtzo.onrender.com'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};
app.use(cors(corsOptions));

// Add CORS headers for all responses - ADD IONIC PORT 8100
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:8100',  // ADD IONIC DEV SERVER
        'http://localhost:8200',
        'http://127.0.0.1:3000', 
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8100',
        // Add your Render domain for production
        'https://express-js-dtzo.onrender.com'
    ];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Origin, X-Requested-With, Accept');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Rate limiting
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Custom middleware for static files with CORS headers
app.use('/uploads', (req, res, next) => {
    const allowedOrigins = [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:8100',
        'http://localhost:8200',
        'http://127.0.0.1:3000', 
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8100',
        // Add your Render domain for production
        'https://express-js-dtzo.onrender.com'
    ];
    const origin = req.headers.origin;
    
    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        res.header('Access-Control-Allow-Origin', '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    res.header('Cross-Origin-Embedder-Policy', 'credentialless');
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res, filePath, stat) => {
        // Additional headers for images
        res.set('Cache-Control', 'public, max-age=31536000');
        res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});

// ============================================
// SERVE ADMIN FRONTEND
// ============================================

// Serve static files from the 'admin' folder (built Vite app)
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Redirect root to admin
app.get('/', (req, res) => {
    res.redirect('/admin');
});

// ============================================
// ERROR HANDLERS
// ============================================

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler - serves admin frontend for any non-API routes
app.use((req, res) => {
    // If it's an API route, return JSON 404
    if (req.path.startsWith('/api')) {
        res.status(404).json({ message: 'API route not found' });
    } else {
        // For all other routes (including /admin/something), serve the admin app
        // This handles React Router client-side routing
        res.sendFile(path.join(__dirname, '../admin/index.html'));
    }
});

module.exports = app;