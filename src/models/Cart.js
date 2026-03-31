const pool = require('../config/database');

class Cart {
    static async getOrCreateCart(userId) {
        try {
            let [carts] = await pool.execute(
                'SELECT * FROM cart WHERE user_id = ?',
                [userId]
            );
            
            let cart = carts[0];
            
            if (!cart) {
                const [result] = await pool.execute(
                    'INSERT INTO cart (user_id) VALUES (?)',
                    [userId]
                );
                
                [carts] = await pool.execute(
                    'SELECT * FROM cart WHERE id = ?',
                    [result.insertId]
                );
                cart = carts[0];
            }
            
            return cart;
        } catch (error) {
            console.error('Error in getOrCreateCart:', error);
            throw error;
        }
    }
    
    static async getCartItems(cartId) {
        try {
            const [items] = await pool.execute(
                `SELECT ci.*, p.name, p.price, p.discount_price, p.image_urls,
                        COALESCE(p.discount_price, p.price) as current_price
                 FROM cart_items ci
                 JOIN products p ON ci.product_id = p.id
                 WHERE ci.cart_id = ?`,
                [cartId]
            );
            
            items.forEach(item => {
                item.price = parseFloat(item.current_price);
                if (item.image_urls) {
                    try {
                        item.image_urls = JSON.parse(item.image_urls);
                    } catch (e) {
                        item.image_urls = [];
                    }
                }
            });
            
            return items;
        } catch (error) {
            console.error('Error in getCartItems:', error);
            throw error;
        }
    }
    
    static async addItem(cartId, productId, quantity = 1) {
        try {
            const [existing] = await pool.execute(
                'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [cartId, productId]
            );
            
            if (existing.length > 0) {
                await pool.execute(
                    'UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?',
                    [quantity, cartId, productId]
                );
            } else {
                await pool.execute(
                    'INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?, ?, ?)',
                    [cartId, productId, quantity]
                );
            }
        } catch (error) {
            console.error('Error in addItem:', error);
            throw error;
        }
    }
    
    static async updateItem(cartId, productId, quantity) {
        try {
            if (quantity <= 0) {
                await this.removeItem(cartId, productId);
            } else {
                await pool.execute(
                    'UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?',
                    [quantity, cartId, productId]
                );
            }
        } catch (error) {
            console.error('Error in updateItem:', error);
            throw error;
        }
    }
    
    static async removeItem(cartId, productId) {
        try {
            await pool.execute(
                'DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?',
                [cartId, productId]
            );
        } catch (error) {
            console.error('Error in removeItem:', error);
            throw error;
        }
    }
    
    static async clearCart(cartId) {
        try {
            await pool.execute(
                'DELETE FROM cart_items WHERE cart_id = ?',
                [cartId]
            );
        } catch (error) {
            console.error('Error in clearCart:', error);
            throw error;
        }
    }
}

module.exports = Cart;
