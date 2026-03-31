const db = require('../config/database');

// Get all users (admin only)
const getUsers = async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, first_name, last_name, email, role, status, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update user role (admin only)
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        const [result] = await db.query(
            'UPDATE users SET role = ? WHERE id = ?',
            [role, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const [users] = await db.query(
            'SELECT id, first_name, last_name, email, role, status FROM users WHERE id = ?',
            [id]
        );
        
        res.json(users[0]);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(400).json({ message: error.message });
    }
};

// Create product (admin only) - FIXED VERSION
const createProduct = async (req, res) => {
    try {
        console.log('========================================');
        console.log('📦 CREATE PRODUCT - Request body:', JSON.stringify(req.body, null, 2));
        
        const { 
            name, 
            price, 
            stock_quantity, 
            description, 
            category_id, 
            brand, 
            sku, 
            image_urls, 
            discount_price, 
            is_active 
        } = req.body;
        
        console.log('📝 Received values:');
        console.log('   name:', name);
        console.log('   price:', price);
        console.log('   stock_quantity:', stock_quantity);
        console.log('   brand:', brand);
        console.log('   sku:', sku);
        console.log('   image_urls:', image_urls);
        
        // Convert image_urls array to JSON string for storage
        let imageUrlsJson = null;
        if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
            imageUrlsJson = JSON.stringify(image_urls);
            console.log('📸 Image URLs as JSON string:', imageUrlsJson);
        } else {
            console.log('📸 No images to save');
        }
        
        const [result] = await db.query(
            `INSERT INTO products (
                name, price, stock_quantity, description, 
                category_id, brand, sku, image_urls, 
                discount_price, is_active, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                name,
                price,
                stock_quantity,
                description,
                category_id || null,
                brand || null,
                sku || null,
                imageUrlsJson,
                discount_price || null,
                is_active !== undefined ? is_active : 1
            ]
        );
        
        console.log('✅ Product inserted with ID:', result.insertId);
        
        // Fetch the created product
        const [products] = await db.query(
            'SELECT * FROM products WHERE id = ?',
            [result.insertId]
        );
        
        if (products[0]) {
            console.log('📦 Raw product from DB - image_urls type:', typeof products[0].image_urls);
            console.log('📦 Raw product from DB - image_urls value:', products[0].image_urls);
            
            // Parse image_urls back to array for response
            if (products[0].image_urls) {
                try {
                    if (typeof products[0].image_urls === 'string') {
                        products[0].image_urls = JSON.parse(products[0].image_urls);
                        console.log('📸 Parsed image_urls (from string):', products[0].image_urls);
                    } else if (Array.isArray(products[0].image_urls)) {
                        console.log('📸 image_urls already an array:', products[0].image_urls);
                    } else {
                        products[0].image_urls = [];
                    }
                } catch (e) {
                    console.error('❌ Error parsing image_urls:', e);
                    products[0].image_urls = [];
                }
            } else {
                products[0].image_urls = [];
            }
        }
        
        console.log('📦 Returned product:', JSON.stringify(products[0], null, 2));
        console.log('========================================\n');
        
        res.status(201).json(products[0]);
    } catch (error) {
        console.error('❌ Error creating product:', error);
        res.status(400).json({ message: error.message });
    }
};

// Get all products (admin with full details)
const getProducts = async (req, res) => {
    try {
        const [products] = await db.query(
            'SELECT * FROM products ORDER BY created_at DESC'
        );
        
        const parsedProducts = products.map(product => {
            if (product.image_urls) {
                try {
                    if (typeof product.image_urls === 'string') {
                        product.image_urls = JSON.parse(product.image_urls);
                    } else if (!Array.isArray(product.image_urls)) {
                        product.image_urls = [];
                    }
                } catch (e) {
                    product.image_urls = [];
                }
            } else {
                product.image_urls = [];
            }
            return product;
        });
        
        res.json(parsedProducts);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update product (admin only)
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`📝 UPDATE PRODUCT ${id} - Request body:`, JSON.stringify(req.body, null, 2));
        
        const { 
            name, 
            price, 
            stock_quantity, 
            description, 
            category_id, 
            brand, 
            sku, 
            image_urls, 
            discount_price, 
            is_active 
        } = req.body;
        
        let imageUrlsJson = null;
        if (image_urls && Array.isArray(image_urls) && image_urls.length > 0) {
            imageUrlsJson = JSON.stringify(image_urls);
        }
        
        const [result] = await db.query(
            `UPDATE products 
             SET name = ?, price = ?, stock_quantity = ?, description = ?,
                 category_id = ?, brand = ?, sku = ?, image_urls = ?,
                 discount_price = ?, is_active = ?, updated_at = NOW()
             WHERE id = ?`,
            [
                name,
                price,
                stock_quantity,
                description,
                category_id || null,
                brand || null,
                sku || null,
                imageUrlsJson,
                discount_price || null,
                is_active !== undefined ? is_active : 1,
                id
            ]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        const [products] = await db.query(
            'SELECT * FROM products WHERE id = ?',
            [id]
        );
        
        if (products[0] && products[0].image_urls) {
            try {
                products[0].image_urls = JSON.parse(products[0].image_urls);
            } catch (e) {
                products[0].image_urls = [];
            }
        }
        
        console.log(`✅ Product ${id} updated successfully`);
        
        res.json(products[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(400).json({ message: error.message });
    }
};

// Delete product (admin only)
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.query(
            'DELETE FROM products WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get all orders (admin only)
const getOrders = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT o.*, u.first_name, u.last_name, u.email 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC
        `);
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const [result] = await db.query(
            'UPDATE orders SET order_status = ? WHERE id = ?',
            [status, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        const [orders] = await db.query(
            'SELECT * FROM orders WHERE id = ?',
            [id]
        );
        
        res.json(orders[0]);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(400).json({ message: error.message });
    }
};

// Get dashboard stats (admin only)
const getStats = async (req, res) => {
    try {
        const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
        const [totalProducts] = await db.query('SELECT COUNT(*) as count FROM products');
        const [totalOrders] = await db.query('SELECT COUNT(*) as count FROM orders');
        
        const [revenue] = await db.query(
            'SELECT SUM(total_amount) as total FROM orders WHERE order_status = "delivered"'
        );
        
        const [recentOrders] = await db.query(`
            SELECT o.*, u.first_name, u.last_name, u.email 
            FROM orders o 
            LEFT JOIN users u ON o.user_id = u.id 
            ORDER BY o.created_at DESC 
            LIMIT 5
        `);
        
        res.json({
            totalUsers: totalUsers[0].count,
            totalProducts: totalProducts[0].count,
            totalOrders: totalOrders[0].count,
            revenue: revenue[0].total || 0,
            recentOrders
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== CATEGORY MANAGEMENT ==========

// Get all categories (admin only)
const getCategories = async (req, res) => {
    try {
        const [categories] = await db.query(
            'SELECT * FROM categories ORDER BY parent_id, name'
        );
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get single category by ID (admin only)
const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );
        
        if (categories.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        res.json(categories[0]);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create category (admin only)
const createCategory = async (req, res) => {
    try {
        const { name, description, parent_id, image_url, is_active } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO categories (name, description, parent_id, image_url, is_active, created_at) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [name, description || null, parent_id || null, image_url || null, is_active !== undefined ? is_active : 1]
        );
        
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json(categories[0]);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(400).json({ message: error.message });
    }
};

// Update category (admin only)
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, parent_id, image_url, is_active } = req.body;
        
        const [result] = await db.query(
            `UPDATE categories 
             SET name = ?, description = ?, parent_id = ?, image_url = ?, is_active = ? 
             WHERE id = ?`,
            [name, description || null, parent_id || null, image_url || null, is_active !== undefined ? is_active : 1, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        const [categories] = await db.query(
            'SELECT * FROM categories WHERE id = ?',
            [id]
        );
        
        res.json(categories[0]);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(400).json({ message: error.message });
    }
};

// Delete category (admin only)
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [children] = await db.query(
            'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?',
            [id]
        );
        
        if (children[0].count > 0) {
            return res.status(400).json({ 
                message: 'Cannot delete category with subcategories. Please delete or reassign subcategories first.' 
            });
        }
        
        const [result] = await db.query(
            'DELETE FROM categories WHERE id = ?',
            [id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ message: error.message });
    }
};

// ========== CHART DATA ENDPOINTS ==========

// Get orders over time
const getOrdersOverTime = async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT 
                DATE(created_at) as day,
                COUNT(*) as orders
            FROM orders
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY day ASC
        `);
        res.json({ data: orders });
    } catch (error) {
        console.error('Error fetching orders over time:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get revenue over time
const getRevenueOverTime = async (req, res) => {
    try {
        const [revenue] = await db.query(`
            SELECT 
                DATE_FORMAT(created_at, '%b') as month,
                SUM(total_amount) as revenue
            FROM orders
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            GROUP BY DATE_FORMAT(created_at, '%b')
            ORDER BY MIN(created_at) ASC
        `);
        res.json({ data: revenue });
    } catch (error) {
        console.error('Error fetching revenue over time:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get products by category
const getProductsByCategory = async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT 
                c.name,
                COUNT(p.id) as value
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            GROUP BY c.id, c.name
            ORDER BY value DESC
        `);
        res.json({ data: categories });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ error: error.message });
    }
};

// Get top selling products
const getTopProducts = async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT 
                p.name,
                COUNT(oi.id) as sales,
                COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
            FROM products p
            LEFT JOIN order_items oi ON oi.product_id = p.id
            GROUP BY p.id, p.name
            ORDER BY sales DESC
            LIMIT 5
        `);
        res.json({ data: products });
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ error: error.message });
    }
};

// ========== EXPORT ALL FUNCTIONS ==========

module.exports = {
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
    getOrdersOverTime,      // Add this
    getRevenueOverTime,     // Add this
    getProductsByCategory,  // Add this
    getTopProducts          // Add this
};