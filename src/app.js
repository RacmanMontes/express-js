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

// Configure CORS properly
const corsOptions = {
    origin: [
        'http://localhost',
        'https://localhost',
        'http://10.199.197.159:8100',
        'http://localhost:8101',
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://localhost:8100',
        'http://localhost:8200',
        'http://127.0.0.1:3000', 
        'http://127.0.0.1:5173',
        'http://127.0.0.1:8100',
        'https://express-js-dtzo.onrender.com',
        'https://shoepee-customer.onrender.com'
    ],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
};
app.use(cors(corsOptions));

// Add CORS headers for all responses
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost',
         'https://localhost',
        'http://10.199.197.159:8100',
        'http://localhost:8101',
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

// ============================================
// 1. API ROUTES (MOST SPECIFIC - FIRST)
// ============================================
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
// 2. STATIC FILES (SPECIFIC PATHS - SECOND)
// ============================================

// Custom middleware for static files with CORS headers
app.use('/uploads', (req, res, next) => {
    const allowedOrigins = [
        'http://localhost',
         'https://localhost',
        'http://10.199.197.159:8100',
        'http://localhost:8101',
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
        const ext = path.extname(filePath).toLowerCase();
        // Set correct content type based on file extension
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

// ============================================
// 3. FRONTEND APPS (CATCH-ALL - THIRD)
// ============================================

// Serve customer frontend at root (/)
app.use('/', express.static(path.join(__dirname, '../customer')));

// Serve admin frontend at /admin
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// ============================================
// 4. ERROR HANDLERS & 404 (LAST RESORT)
// ============================================

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// 404 handler - serves customer frontend for any non-API routes
app.use((req, res) => {
    // If it's an API route, return JSON 404
    if (req.path.startsWith('/api')) {
        res.status(404).json({ message: 'API route not found' });
    } 
    // If it's an image request that wasn't found, return 404
    else if (req.path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        res.status(404).send('Image not found');
    }
    // For all other routes (including customer routes), serve customer frontend
    // This handles React Router client-side routing for customer
    else {
        res.sendFile(path.join(__dirname, '../customer/index.html'));
    }
});

module.exports = app;
