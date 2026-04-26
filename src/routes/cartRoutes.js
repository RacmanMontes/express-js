// backend/routes/cartRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getCart, 
    addToCart, 
    updateCartItem, 
    removeFromCart,
    getPublicCart   // ← Make sure to import getPublicCart here
} = require('../controllers/cartController');

// PUBLIC ROUTE - No authentication required (for testing)
router.get('/public', getPublicCart);

// PROTECTED ROUTES - Authentication required
router.use(protect);
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/item/:itemId', updateCartItem);
router.delete('/item/:itemId', removeFromCart);

module.exports = router;