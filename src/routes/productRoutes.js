const express = require('express');
const router = express.Router();
const { 
    getProducts, 
    getProductById, 
    getFeaturedProducts,
    createProduct,    // Import the new controller methods
    updateProduct,
    deleteProduct
} = require('../controllers/productController');

// Public routes (no authentication required)
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/:id', getProductById);

// Admin routes (authentication required)
// You should add authentication middleware here
router.post('/', createProduct);           // Create new product
router.put('/:id', updateProduct);         // Update existing product
router.delete('/:id', deleteProduct);      // Delete product


module.exports = router;