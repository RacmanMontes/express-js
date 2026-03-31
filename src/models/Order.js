// backend/src/models/Order.js
const pool = require('../config/database');

class Order {
    static async create(userId, orderData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const {
                order_number,
                items,
                total_amount,
                shipping_address_id,
                billing_address_id,
                payment_method,
                payment_status = 'pending',
                order_status = 'pending',
                notes
            } = orderData;
            
            // Insert order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (
                    user_id, order_number, total_amount, 
                    shipping_address_id, billing_address_id, payment_method,
                    payment_status, order_status, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [userId, order_number, total_amount, shipping_address_id, billing_address_id, payment_method, payment_status, order_status, notes]
            );
            
            const orderId = orderResult.insertId;
            
            // Insert order items
            for (const item of items) {
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, quantity, price) 
                     VALUES (?, ?, ?, ?)`,
                    [orderId, item.product_id, item.quantity, item.price]
                );
            }
            
            await connection.commit();
            
            // Return the created order
            const [order] = await connection.execute(
                `SELECT * FROM orders WHERE id = ?`,
                [orderId]
            );
            
            return order[0];
        } catch (error) {
            await connection.rollback();
            console.error('Error in Order.create:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static async getUserOrders(userId) {
        try {
            const [orders] = await pool.execute(
                `SELECT o.*, 
                    sa.address_line1 as shipping_address_line1, sa.city as shipping_city, sa.state as shipping_state, sa.zip_code as shipping_zip,
                    ba.address_line1 as billing_address_line1, ba.city as billing_city, ba.state as billing_state, ba.zip_code as billing_zip
                 FROM orders o
                 LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
                 LEFT JOIN addresses ba ON o.billing_address_id = ba.id
                 WHERE o.user_id = ? 
                 ORDER BY o.created_at DESC`,
                [userId]
            );
            
            // Get order items for each order
            for (const order of orders) {
                const [items] = await pool.execute(
                    `SELECT oi.*, p.name, p.image_urls 
                     FROM order_items oi 
                     JOIN products p ON oi.product_id = p.id 
                     WHERE oi.order_id = ?`,
                    [order.id]
                );
                order.items = items;
            }
            
            return orders;
        } catch (error) {
            console.error('Error in Order.getUserOrders:', error);
            throw error;
        }
    }
    
    static async getById(orderId, userId) {
        try {
            const [orders] = await pool.execute(
                `SELECT o.*, 
                    sa.address_line1 as shipping_address_line1, sa.city as shipping_city, sa.state as shipping_state, sa.zip_code as shipping_zip,
                    ba.address_line1 as billing_address_line1, ba.city as billing_city, ba.state as billing_state, ba.zip_code as billing_zip
                 FROM orders o
                 LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
                 LEFT JOIN addresses ba ON o.billing_address_id = ba.id
                 WHERE o.id = ? AND o.user_id = ?`,
                [orderId, userId]
            );
            
            if (orders.length === 0) {
                return null;
            }
            
            const order = orders[0];
            
            const [items] = await pool.execute(
                `SELECT oi.*, p.name, p.image_urls 
                 FROM order_items oi 
                 JOIN products p ON oi.product_id = p.id 
                 WHERE oi.order_id = ?`,
                [orderId]
            );
            order.items = items;
            
            return order;
        } catch (error) {
            console.error('Error in Order.getById:', error);
            throw error;
        }
    }
}

module.exports = Order;