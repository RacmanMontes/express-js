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


app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
}));


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
    
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});


const limiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 100 
});
app.use('/api', limiter);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', uploadRoutes);


app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
});


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


app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
    setHeaders: (res, filePath, stat) => {
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


app.use('/admin', express.static(path.join(__dirname, '../admin')));


app.get('/', (req, res) => {
    res.redirect('/admin');
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});


app.use((req, res) => {
    
    if (req.path.startsWith('/api')) {
        res.status(404).json({ message: 'API route not found' });
    } 
   
    else if (req.path.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        res.status(404).send('Image not found');
    }
    
    else if (req.path.startsWith('/admin')) {
        res.sendFile(path.join(__dirname, '../admin/index.html'));
    }
    
    else {
        res.redirect('/admin');
    }
});

module.exports = app;