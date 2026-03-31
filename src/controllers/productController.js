const Product = require('../models/Product');

const getProducts = async (req, res) => {
    try {
        console.log('🔍 getProducts called with query:', req.query);
        
        const filters = {
            category_id: req.query.category_id,
            search: req.query.search,
            min_price: req.query.min_price,
            max_price: req.query.max_price,
            sort: req.query.sort,
            page: req.query.page,
            limit: req.query.limit
        };
        
        console.log('📊 Filters:', filters);
        
        const result = await Product.findAll(filters);
        
        console.log('✅ Products found:', result.products?.length || 0);
        
        res.json(result);
    } catch (error) {
        console.error('❌ Error in getProducts:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getFeaturedProducts = async (req, res) => {
    try {
        console.log('🔍 getFeaturedProducts called with limit:', req.query.limit);
        const limit = req.query.limit || 10;
        const products = await Product.getFeaturedProducts(limit);
        console.log('✅ Featured products found:', products.length);
        res.json(products);
    } catch (error) {
        console.error('❌ Error in getFeaturedProducts:', error);
        console.error('❌ Error stack:', error.stack);
        res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
    }
};

// ADD THESE CONTROLLER METHODS
const createProduct = async (req, res) => {
    try {
        console.log('Received product data:', req.body);
        const product = await Product.create(req.body);
        console.log('Created product:', product);
        res.status(201).json(product);
    } catch (error) {
        console.error('Error in createProduct:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateProduct = async (req, res) => {
    try {
        console.log('Updating product:', req.params.id);
        console.log('Update data:', req.body);
        
        const product = await Product.update(req.params.id, req.body);
        
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        console.log('Updated product:', product);
        res.json(product);
    } catch (error) {
        console.error('Error in updateProduct:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.delete(req.params.id);
        
        if (!deleted) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error in deleteProduct:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};



module.exports = {
    getProducts,
    getProductById,
    getFeaturedProducts,
    createProduct,
    updateProduct,
    deleteProduct
};