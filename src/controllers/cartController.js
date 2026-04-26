const Cart = require('../models/Cart');

const getCart = async (req, res) => {
    try {
        const cart = await Cart.getOrCreateCart(req.user.id);
        const cartItems = await Cart.getCartItems(cart.id);
        
        const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        
        res.json({
            id: cart.id,
            items: cartItems,
            total: total
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ADD THIS NEW FUNCTION FOR PUBLIC ACCESS (NO AUTH REQUIRED)
const getPublicCart = async (req, res) => {
    try {
        // Use a test user ID (change to an existing user ID from your database)
        const testUserId = 1; // Make sure this user exists in your database
        
        const cart = await Cart.getOrCreateCart(testUserId);
        const cartItems = await Cart.getCartItems(cart.id);
        
        const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        
        res.json({
            success: true,
            id: cart.id,
            items: cartItems,
            total: total,
            message: 'Public cart data (demo mode)'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const addToCart = async (req, res) => {
    try {
        const { product_id, quantity = 1 } = req.body;
        
        if (!product_id) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        
        const cart = await Cart.getOrCreateCart(req.user.id);
        await Cart.addItem(cart.id, product_id, quantity);
        
        res.json({ message: 'Item added to cart', success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { itemId } = req.params;
        
        if (!quantity || quantity < 0) {
            return res.status(400).json({ message: 'Valid quantity is required' });
        }
        
        const cart = await Cart.getOrCreateCart(req.user.id);
        await Cart.updateItem(cart.id, itemId, quantity);
        
        res.json({ message: 'Cart updated', success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.params;
        const cart = await Cart.getOrCreateCart(req.user.id);
        await Cart.removeItem(cart.id, itemId);
        
        res.json({ message: 'Item removed from cart', success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// UPDATE THE EXPORT to include getPublicCart
module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    getPublicCart  // Add this line
};