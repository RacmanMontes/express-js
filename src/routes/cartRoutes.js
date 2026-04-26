const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    getCart, 
    addToCart, 
    updateCartItem, 
    removeFromCart,
    getPublicCart,
    getAllCarts,
    getAllCartItems,
    getCartSummary,
    debugDatabase
} = require('../controllers/cartController');

// Public routes (no authentication)
router.get('/public', getPublicCart);

// Debug/Admin routes (add authentication middleware in production)
router.get('/debug', debugDatabase);
router.get('/all', getAllCarts);
router.get('/all-items', getAllCartItems);
router.get('/summary', getCartSummary);

// Protected routes (require login)
router.use(protect);
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/item/:itemId', updateCartItem);
router.delete('/item/:itemId', removeFromCart);

module.exports = router;