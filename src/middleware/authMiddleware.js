const jwt = require('jsonwebtoken');
const db = require('../config/database');

const protect = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            console.log('Decoded token ID:', decoded.id);
            
            // Only select columns that exist in your users table
            const [users] = await db.query(
                'SELECT id, first_name, last_name, email, role FROM users WHERE id = ?',
                [decoded.id]
            );
            
            if (users.length === 0) {
                console.log('User not found with ID:', decoded.id);
                return res.status(401).json({ message: 'User not found' });
            }
            
            req.user = users[0];
            console.log('User authenticated:', req.user.email, 'Role:', req.user.role);
            next();
        } catch (error) {
            console.error('Auth error:', error.message);
            res.status(401).json({ message: 'Not authorized, token failed', error: error.message });
        }
    }
    
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        console.log('Admin check failed. User role:', req.user?.role);
        res.status(403).json({ message: 'Not authorized as admin' });
    }
};

module.exports = { protect, admin };