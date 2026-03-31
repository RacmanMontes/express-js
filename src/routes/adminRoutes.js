const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getUsers,
    updateUserRole,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getOrders,
    updateOrderStatus,
    getStats,
    getCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    getOrdersOverTime,      // Add this import
    getRevenueOverTime,     // Add this import
    getProductsByCategory,  // Add this import
    getTopProducts          // Add this import
} = require('../controllers/adminController');

// All admin routes are protected and require admin role
router.use(protect, admin);

// Dashboard stats
router.get('/stats', getStats);

// Chart data endpoints - place these BEFORE the /stats route to avoid conflicts
router.get('/stats/orders-over-time', getOrdersOverTime);
router.get('/stats/revenue-over-time', getRevenueOverTime);
router.get('/stats/products-by-category', getProductsByCategory);
router.get('/stats/top-products', getTopProducts);

// User management
router.get('/users', getUsers);
router.put('/users/:id/role', updateUserRole);

// Product management
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Order management
router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Category management
router.get('/categories', getCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Test endpoint
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Admin API is working!',
        user: {
            id: req.user.id,
            name: `${req.user.first_name} ${req.user.last_name}`,
            email: req.user.email,
            role: req.user.role
        }
    });
});

module.exports = router;        