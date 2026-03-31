// backend/src/models/User.js
const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
    static async create(userData) {
        try {
            const { email, password, first_name, last_name, phone } = userData;
            const password_hash = await bcrypt.hash(password, 10);
            
            const [result] = await pool.execute(
                'INSERT INTO users (email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?)',
                [email, password_hash, first_name || null, last_name || null, phone || null]
            );
            
            return result.insertId;
        } catch (error) {
            console.error('Error in create user:', error);
            throw error;
        }
    }
    
    static async findByEmail(email) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, email, password_hash, first_name, last_name, phone, role, profile_image FROM users WHERE email = ?',
                [email]
            );
            return rows[0];
        } catch (error) {
            console.error('Error in findByEmail:', error);
            throw error;
        }
    }
    
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT id, email, first_name, last_name, phone, role, profile_image, created_at FROM users WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error in findById:', error);
            throw error;
        }
    }
    
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            
            if (updateData.first_name !== undefined) {
                fields.push('first_name = ?');
                values.push(updateData.first_name);
            }
            if (updateData.last_name !== undefined) {
                fields.push('last_name = ?');
                values.push(updateData.last_name);
            }
            if (updateData.phone !== undefined) {
                fields.push('phone = ?');
                values.push(updateData.phone);
            }
            if (updateData.profile_image !== undefined) {
                fields.push('profile_image = ?');
                values.push(updateData.profile_image);
            }
            
            if (fields.length === 0) return false;
            
            values.push(id);
            const [result] = await pool.execute(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error in update user:', error);
            throw error;
        }
    }
    
    static async comparePassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
}

module.exports = User;