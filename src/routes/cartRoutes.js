const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCart, addToCart, updateCartItem, removeFromCart } = require('../controllers/cartController');

router.get('/public', getPublicCart);
router.use(protect); // All cart routes require authentication

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/item/:itemId', updateCartItem);
router.delete('/item/:itemId', removeFromCart);

module.exports = router;
