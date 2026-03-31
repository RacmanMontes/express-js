// backend/src/models/Address.js
const pool = require('../config/database');

class Address {
    static async create(addressData) {
        const connection = await pool.getConnection();
        try {
            const {
                user_id,
                address_line1,
                address_line2,
                city,
                state,
                postal_code,
                country = 'Philippines',
                is_default = false
            } = addressData;
            
            // Remove created_at and updated_at from the insert - they're not in your table
            const [result] = await connection.execute(
                `INSERT INTO addresses (
                    user_id, address_line1, address_line2, city, 
                    state, postal_code, country, is_default
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [user_id, address_line1, address_line2 || null, city, state, postal_code, country, is_default]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('Error creating address:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM addresses WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding address:', error);
            throw error;
        }
    }
}

module.exports = Address;