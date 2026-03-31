// models/Product.js
const pool = require('../config/database');

class Product {
    // ========== PUBLIC METHODS ==========
    
    static async findAll(filters = {}) {
        try {
            let query = `
                SELECT p.*, COALESCE(c.name, 'Uncategorized') as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.is_active = 1
            `;
            const values = [];
            
            if (filters.category_id) {
                query += ' AND p.category_id = ?';
                values.push(parseInt(filters.category_id));
            }
            
            if (filters.search) {
                query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                values.push(searchTerm, searchTerm);
            }
            
            if (filters.min_price) {
                query += ' AND p.price >= ?';
                values.push(parseFloat(filters.min_price));
            }
            
            if (filters.max_price) {
                query += ' AND p.price <= ?';
                values.push(parseFloat(filters.max_price));
            }
            
            // Sorting
            switch (filters.sort) {
                case 'price_asc':
                    query += ' ORDER BY p.price ASC';
                    break;
                case 'price_desc':
                    query += ' ORDER BY p.price DESC';
                    break;
                case 'rating':
                    query += ' ORDER BY p.rating DESC, p.num_reviews DESC';
                    break;
                case 'newest':
                default:
                    query += ' ORDER BY p.created_at DESC';
                    break;
            }
            
            // Pagination - Use direct numbers in query
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 20;
            const offset = (page - 1) * limit;
            
            // Use direct numbers instead of placeholders for LIMIT and OFFSET
            query += ` LIMIT ${limit} OFFSET ${offset}`;
            
            console.log('📝 findAll query:', query);
            console.log('📝 Values:', values);
            
            const [rows] = await pool.execute(query, values);
            
            // Parse image_urls JSON for each product
            const parsedProducts = rows.map(product => {
                const parsedProduct = { ...product };
                if (parsedProduct.image_urls) {
                    try {
                        if (typeof parsedProduct.image_urls === 'string') {
                            parsedProduct.image_urls = JSON.parse(parsedProduct.image_urls);
                        }
                        if (!Array.isArray(parsedProduct.image_urls)) {
                            parsedProduct.image_urls = [];
                        }
                    } catch (e) {
                        parsedProduct.image_urls = [];
                    }
                } else {
                    parsedProduct.image_urls = [];
                }
                return parsedProduct;
            });
            
            // Get total count
            let countQuery = 'SELECT COUNT(*) as total FROM products WHERE is_active = 1';
            const countValues = [];
            
            if (filters.category_id) {
                countQuery += ' AND category_id = ?';
                countValues.push(parseInt(filters.category_id));
            }
            
            if (filters.search) {
                countQuery += ' AND (name LIKE ? OR description LIKE ?)';
                const searchTerm = `%${filters.search}%`;
                countValues.push(searchTerm, searchTerm);
            }
            
            const [countResult] = await pool.execute(countQuery, countValues);
            const total = countResult[0].total;
            
            console.log('✅ Found', parsedProducts.length, 'products out of', total, 'total');
            
            return {
                products: parsedProducts,
                total: total,
                page: page,
                limit: limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error) {
            console.error('❌ Error in findAll:', error);
            return {
                products: [],
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0
            };
        }
    }
    
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                `SELECT p.*, COALESCE(c.name, 'Uncategorized') as category_name 
                 FROM products p 
                 LEFT JOIN categories c ON p.category_id = c.id 
                 WHERE p.id = ? AND p.is_active = 1`,
                [parseInt(id)]
            );
            
            if (rows.length === 0) {
                return null;
            }
            
            const product = rows[0];
            
            if (product.image_urls) {
                try {
                    if (typeof product.image_urls === 'string') {
                        product.image_urls = JSON.parse(product.image_urls);
                    }
                    if (!Array.isArray(product.image_urls)) {
                        product.image_urls = [];
                    }
                } catch (e) {
                    product.image_urls = [];
                }
            } else {
                product.image_urls = [];
            }
            
            return product;
        } catch (error) {
            console.error('❌ Error in findById:', error);
            return null;
        }
    }
    
    static async getFeaturedProducts(limit = 10) {
        try {
            const productLimit = parseInt(limit);
            
            console.log('📦 getFeaturedProducts - limit:', productLimit);
            
            // Use direct number in query instead of placeholder
            const [rows] = await pool.execute(`
                SELECT p.*, COALESCE(c.name, 'Uncategorized') as category_name 
                FROM products p 
                LEFT JOIN categories c ON p.category_id = c.id 
                WHERE p.is_active = 1 
                ORDER BY p.rating DESC, p.num_reviews DESC, p.created_at DESC 
                LIMIT ${productLimit}
            `);
            
            console.log('✅ Found', rows.length, 'featured products');
            
            // Parse image_urls for each product
            const parsedProducts = rows.map(product => {
                const parsedProduct = { ...product };
                if (parsedProduct.image_urls) {
                    try {
                        if (typeof parsedProduct.image_urls === 'string') {
                            parsedProduct.image_urls = JSON.parse(parsedProduct.image_urls);
                        }
                        if (!Array.isArray(parsedProduct.image_urls)) {
                            parsedProduct.image_urls = [];
                        }
                    } catch (e) {
                        parsedProduct.image_urls = [];
                    }
                } else {
                    parsedProduct.image_urls = [];
                }
                return parsedProduct;
            });
            
            return parsedProducts;
        } catch (error) {
            console.error('❌ Error in getFeaturedProducts:', error);
            return [];
        }
    }
    
    // ========== ADMIN METHODS ==========
    
    static async create(productData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
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
            } = productData;
            
            const imageUrlsJson = image_urls && Array.isArray(image_urls) && image_urls.length > 0
                ? JSON.stringify(image_urls) 
                : null;
            
            const [result] = await connection.execute(
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
            
            await connection.commit();
            
            const [newProduct] = await connection.execute(
                `SELECT p.*, COALESCE(c.name, 'Uncategorized') as category_name 
                 FROM products p 
                 LEFT JOIN categories c ON p.category_id = c.id 
                 WHERE p.id = ?`,
                [result.insertId]
            );
            
            if (newProduct[0] && newProduct[0].image_urls) {
                try {
                    newProduct[0].image_urls = JSON.parse(newProduct[0].image_urls);
                } catch (e) {
                    newProduct[0].image_urls = [];
                }
            }
            
            return newProduct[0];
        } catch (error) {
            await connection.rollback();
            console.error('Error in create:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static async update(id, productData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
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
            } = productData;
            
            const imageUrlsJson = image_urls && Array.isArray(image_urls) && image_urls.length > 0
                ? JSON.stringify(image_urls) 
                : null;
            
            await connection.execute(
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
            
            await connection.commit();
            
            const [updatedProduct] = await connection.execute(
                `SELECT p.*, COALESCE(c.name, 'Uncategorized') as category_name 
                 FROM products p 
                 LEFT JOIN categories c ON p.category_id = c.id 
                 WHERE p.id = ?`,
                [id]
            );
            
            if (updatedProduct[0] && updatedProduct[0].image_urls) {
                try {
                    updatedProduct[0].image_urls = JSON.parse(updatedProduct[0].image_urls);
                } catch (e) {
                    updatedProduct[0].image_urls = [];
                }
            }
            
            return updatedProduct[0];
        } catch (error) {
            await connection.rollback();
            console.error('Error in update:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static async delete(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const [result] = await connection.execute(
                'DELETE FROM products WHERE id = ?',
                [id]
            );
            
            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            console.error('Error in delete:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static async count() {
        try {
            const [rows] = await pool.execute('SELECT COUNT(*) as count FROM products');
            return rows[0].count;
        } catch (error) {
            console.error('Error in count:', error);
            return 0;
        }
    }
}

module.exports = Product;