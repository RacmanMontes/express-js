// backend/src/controllers/orderController.js
const db = require('../config/database');
const Address = require('../models/Address');

const createOrder = async (req, res) => {
    try {
        console.log('📦 Received order data:', JSON.stringify(req.body, null, 2));
        console.log('👤 User ID:', req.user.id);
        
        const { items, total, shipping_address, payment_method } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }
        
        // Create shipping address
        const shippingAddressId = await Address.create({
            user_id: req.user.id,
            address_line1: shipping_address.address,
            city: shipping_address.city,
            state: shipping_address.state,
            postal_code: shipping_address.zipCode,
            is_default: false
        });
        
        // Use same address for billing
        const billingAddressId = shippingAddressId;
        
        // Generate order number
        const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
        
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Insert order
            const [orderResult] = await connection.execute(
                `INSERT INTO orders (
                    user_id, order_number, total_amount, 
                    shipping_address_id, billing_address_id, payment_method,
                    payment_status, order_status, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [
                    req.user.id, 
                    orderNumber, 
                    total,
                    shippingAddressId,
                    billingAddressId,
                    payment_method,
                    'pending',
                    'pending',
                    null
                ]
            );
            
            const orderId = orderResult.insertId;
            
            // Insert order items - include total (quantity * price)
            for (const item of items) {
                const itemTotal = parseFloat(item.price) * item.quantity;
                
                await connection.execute(
                    `INSERT INTO order_items (order_id, product_id, quantity, price, total) 
                     VALUES (?, ?, ?, ?, ?)`,
                    [orderId, item.product_id, item.quantity, parseFloat(item.price), itemTotal]
                );
            }
            
            await connection.commit();
            
            res.status(201).json({ 
                success: true, 
                order_id: orderId,
                order_number: orderNumber,
                message: 'Order placed successfully!' 
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('❌ Error creating order:', error);
        res.status(500).json({ 
            message: 'Server error', 
            error: error.message 
        });
    }
};

const getOrders = async (req, res) => {
    try {
        const [orders] = await db.execute(
            `SELECT o.*, 
                    sa.address_line1 as shipping_address, 
                    sa.city as shipping_city, 
                    sa.state as shipping_state,
                    sa.postal_code as shipping_postal_code,
                    ba.address_line1 as billing_address
             FROM orders o
             LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
             LEFT JOIN addresses ba ON o.billing_address_id = ba.id
             WHERE o.user_id = ? 
             ORDER BY o.created_at DESC`,
            [req.user.id]
        );
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getOrderById = async (req, res) => {
    try {
        const [orders] = await db.execute(
            `SELECT o.*, 
                    sa.address_line1 as shipping_address, 
                    sa.city as shipping_city, 
                    sa.state as shipping_state,
                    sa.postal_code as shipping_postal_code,
                    ba.address_line1 as billing_address
             FROM orders o
             LEFT JOIN addresses sa ON o.shipping_address_id = sa.id
             LEFT JOIN addresses ba ON o.billing_address_id = ba.id
             WHERE o.id = ? AND o.user_id = ?`,
            [req.params.id, req.user.id]
        );
        
        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        // Get order items
        const [items] = await db.execute(
            `SELECT * FROM order_items WHERE order_id = ?`,
            [req.params.id]
        );
        
        const order = orders[0];
        order.items = items;
        
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    createOrder,
    getOrders,
    getOrderById
};