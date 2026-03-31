const pool = require('../config/database');

class Category {
    static async findAll() {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM categories ORDER BY name ASC'
            );
            return rows;
        } catch (error) {
            console.error('Error in findAll categories:', error);
            throw error;
        }
    }
    
    static async findById(id) {
        try {
            const [rows] = await pool.execute(
                'SELECT * FROM categories WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error in findById category:', error);
            throw error;
        }
    }
    
    static async create(categoryData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const { name, description, image_url, is_active } = categoryData;
            
            const [result] = await connection.execute(
                `INSERT INTO categories (name, description, image_url, is_active, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, NOW(), NOW())`,
                [name, description || null, image_url || null, is_active !== undefined ? is_active : 1]
            );
            
            await connection.commit();
            
            const [newCategory] = await connection.execute(
                'SELECT * FROM categories WHERE id = ?',
                [result.insertId]
            );
            
            return newCategory[0];
        } catch (error) {
            await connection.rollback();
            console.error('Error in create category:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static async update(id, categoryData) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            const { name, description, image_url, is_active } = categoryData;
            
            await connection.execute(
                `UPDATE categories 
                 SET name = ?, description = ?, image_url = ?, is_active = ?, updated_at = NOW()
                 WHERE id = ?`,
                [name, description || null, image_url || null, is_active !== undefined ? is_active : 1, id]
            );
            
            await connection.commit();
            
            const [updatedCategory] = await connection.execute(
                'SELECT * FROM categories WHERE id = ?',
                [id]
            );
            
            return updatedCategory[0];
        } catch (error) {
            await connection.rollback();
            console.error('Error in update category:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
    
    static async delete(id) {
        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();
            
            // Check if category has products
            const [products] = await connection.execute(
                'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
                [id]
            );
            
            if (products[0].count > 0) {
                throw new Error('Cannot delete category with existing products');
            }
            
            const [result] = await connection.execute(
                'DELETE FROM categories WHERE id = ?',
                [id]
            );
            
            await connection.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await connection.rollback();
            console.error('Error in delete category:', error);
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Category;