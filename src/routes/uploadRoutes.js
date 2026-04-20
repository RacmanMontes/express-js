const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, admin } = require('../middleware/authMiddleware');
const fs = require('fs');
const pool = require('../config/database');

// Ensure upload directories exist
const productsUploadDir = 'uploads/products';
const profilesUploadDir = 'uploads/profiles';

if (!fs.existsSync(productsUploadDir)) {
    fs.mkdirSync(productsUploadDir, { recursive: true });
}
if (!fs.existsSync(profilesUploadDir)) {
    fs.mkdirSync(profilesUploadDir, { recursive: true });
}

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// Configure storage for product images
const productStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, productsUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// Configure storage for profile pictures
const profileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, profilesUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const productUpload = multer({
    storage: productStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit for profile pictures
    fileFilter: fileFilter
});

// Test endpoint
router.get('/upload/test', (req, res) => {
    res.json({ 
        message: 'Upload routes are working!',
        endpoints: {
            product: '/api/upload',
            profile: '/api/upload/profile',
            test: '/api/upload/test'
        }
    });
});

// Product image upload endpoint (protected by admin middleware)
router.post('/upload', protect, admin, productUpload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        const imageUrl = `${req.protocol}://${req.get('host')}/uploads/products/${req.file.filename}`;
        
        res.json({ 
            imageUrl, 
            message: 'Image uploaded successfully',
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Upload failed', error: error.message });
    }
});

// Profile picture upload endpoint (protected by auth middleware) - Saves to database
router.post('/upload/profile', protect, profileUpload.single('profile_image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        
        // Get the relative path for database storage
        const relativePath = `/uploads/profiles/${req.file.filename}`;
        const fullImageUrl = `${req.protocol}://${req.get('host')}${relativePath}`;
        
        console.log('📸 Uploaded profile picture:', fullImageUrl);
        console.log('👤 User ID:', req.user.id);
        
        // Update the user's profile_image in the database
        const connection = await pool.getConnection();
        try {
            await connection.execute(
                'UPDATE users SET profile_image = ? WHERE id = ?',
                [relativePath, req.user.id]
            );
            
            console.log('✅ Database updated with profile_image:', relativePath);
            
            // Get the updated user data
            const [users] = await connection.execute(
                'SELECT id, email, first_name, last_name, phone, role, profile_image FROM users WHERE id = ?',
                [req.user.id]
            );
            
            connection.release();
            
            // Return both the image URL and the updated user data
            res.json({ 
                imageUrl: fullImageUrl,
                relativePath: relativePath,
                user: users[0],
                message: 'Profile picture uploaded successfully',
                filename: req.file.filename
            });
        } catch (dbError) {
            connection.release();
            console.error('❌ Database error:', dbError);
            res.status(500).json({ 
                message: 'Failed to update profile', 
                error: dbError.message 
            });
        }
        
    } catch (error) {
        console.error('❌ Profile upload error:', error);
        res.status(500).json({ 
            message: 'Upload failed', 
            error: error.message 
        });
    }
});

module.exports = router;
