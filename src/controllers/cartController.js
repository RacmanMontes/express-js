const Cart = require('../models/Cart');
const db = require('../config/database'); // Add this if you have a database connection file

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

// PUBLIC ACCESS (NO AUTH REQUIRED)
const getPublicCart = async (req, res) => {
    try {
        // You can pass user_id as query parameter or use default
        const testUserId = req.query.user_id || 1; // Allow dynamic user_id
        const cart = await Cart.getOrCreateCart(testUserId);
        const cartItems = await Cart.getCartItems(cart.id);
        
        const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
        
        res.json({
            success: true,
            id: cart.id,
            user_id: parseInt(testUserId),
            items: cartItems,
            total: total,
            item_count: cartItems.length,
            message: 'Public cart data'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET ALL CARTS FROM DATABASE (Admin/Dev only)
const getAllCarts = async (req, res) => {
    try {
        // Get all carts with user information
        const carts = await db.query(`
            SELECT 
                c.id as cart_id,
                c.user_id,
                c.created_at,
                c.updated_at,
                u.email,
                u.first_name,
                u.last_name
            FROM cart c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.id DESC
        `);
        
        // Get cart items for each cart
        for (let cart of carts) {
            const items = await db.query(`
                SELECT 
                    ci.id as cart_item_id,
                    ci.product_id,
                    ci.quantity,
                    ci.added_at,
                    p.name as product_name,
                    p.price,
                    p.discount_price,
                    p.image_urls,
                    p.brand,
                    (CAST(p.price AS DECIMAL(10,2)) * ci.quantity) as subtotal
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.cart_id = ?
            `, [cart.cart_id]);
            
            cart.items = items;
            cart.total = items.reduce((sum, item) => sum + parseFloat(item.subtotal), 0);
            cart.item_count = items.length;
        }
        
        res.json({
            success: true,
            count: carts.length,
            data: carts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET ALL CART ITEMS FROM DATABASE
const getAllCartItems = async (req, res) => {
    try {
        const cartItems = await db.query(`
            SELECT 
                ci.id as cart_item_id,
                ci.cart_id,
                ci.product_id,
                ci.quantity,
                ci.added_at,
                c.user_id,
                p.name as product_name,
                p.price,
                p.discount_price,
                p.image_urls,
                (CAST(p.price AS DECIMAL(10,2)) * ci.quantity) as subtotal
            FROM cart_items ci
            JOIN cart c ON ci.cart_id = c.id
            JOIN products p ON ci.product_id = p.id
            ORDER BY ci.cart_id, ci.id DESC
        `);
        
        res.json({
            success: true,
            count: cartItems.length,
            data: cartItems
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET CART SUMMARY (Statistics)
const getCartSummary = async (req, res) => {
    try {
        const summary = await db.query(`
            SELECT 
                COUNT(DISTINCT c.id) as total_carts,
                COUNT(ci.id) as total_cart_items,
                SUM(ci.quantity) as total_quantity,
                SUM(CAST(p.price AS DECIMAL(10,2)) * ci.quantity) as total_value,
                AVG(ci.quantity) as avg_items_per_cart
            FROM cart c
            LEFT JOIN cart_items ci ON ci.cart_id = c.id
            LEFT JOIN products p ON ci.product_id = p.id
        `);
        
        // Get carts with most items
        const topCarts = await db.query(`
            SELECT 
                c.id as cart_id,
                c.user_id,
                u.email,
                COUNT(ci.id) as item_count,
                SUM(ci.quantity) as total_quantity,
                SUM(CAST(p.price AS DECIMAL(10,2)) * ci.quantity) as total_value
            FROM cart c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN cart_items ci ON ci.cart_id = c.id
            LEFT JOIN products p ON ci.product_id = p.id
            GROUP BY c.id, c.user_id, u.email
            HAVING item_count > 0
            ORDER BY total_value DESC
            LIMIT 10
        `);
        
        res.json({
            success: true,
            summary: summary[0],
            top_carts: topCarts
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// DEBUG: Check database connection and tables
const debugDatabase = async (req, res) => {
    try {
        // Check if tables exist
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = DATABASE()
            AND table_name IN ('cart', 'cart_items', 'users', 'products')
        `);
        
        // Count records
        const counts = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM cart) as cart_count,
                (SELECT COUNT(*) FROM cart_items) as cart_items_count,
                (SELECT COUNT(*) FROM users) as users_count,
                (SELECT COUNT(*) FROM products) as products_count
        `);
        
        // Sample data
        const sampleCart = await db.query('SELECT * FROM cart LIMIT 5');
        const sampleCartItems = await db.query('SELECT * FROM cart_items LIMIT 5');
        
        res.json({
            success: true,
            tables_exist: tables.map(t => t.table_name),
            counts: counts[0],
            sample_cart: sampleCart,
            sample_cart_items: sampleCartItems
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

module.exports = {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    getPublicCart,
    getAllCarts,
    getAllCartItems,
    getCartSummary,
    debugDatabase
};