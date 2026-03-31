const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedProducts() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'shopping_app',
    });

    try {
        console.log('🌱 Starting to seed products...\n');

        // First, clear existing products and categories
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE products');
        await connection.query('TRUNCATE TABLE categories');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ Cleared existing products and categories\n');

        // Insert categories
        const categories = [
            { name: 'Electronics', description: 'Latest electronic gadgets and devices' },
            { name: 'Clothing', description: 'Fashionable apparel for men and women' },
            { name: 'Books', description: 'Best-selling books across all genres' },
            { name: 'Home & Garden', description: 'Everything for your home and garden' },
            { name: 'Sports & Outdoors', description: 'Sports equipment and outdoor gear' },
            { name: 'Toys & Games', description: 'Fun toys and games for all ages' },
            { name: 'Beauty & Health', description: 'Beauty products and health supplies' },
            { name: 'Automotive', description: 'Car accessories and automotive tools' }
        ];

        const categoryIds = {};
        for (const cat of categories) {
            const [result] = await connection.query(
                'INSERT INTO categories (name, description, is_active) VALUES (?, ?, ?)',
                [cat.name, cat.description, true]
            );
            categoryIds[cat.name] = result.insertId;
            console.log(`📁 Created category: ${cat.name}`);
        }
        console.log('\n');

        // Sample products with images
        const products = [
            // Electronics
            {
                name: 'Apple iPhone 15 Pro Max',
                description: 'The latest iPhone with A17 Pro chip, titanium design, and advanced camera system. Features 48MP main camera, 5x optical zoom, and all-day battery life.',
                price: 1199.99,
                discount_price: 1099.99,
                stock_quantity: 50,
                category: 'Electronics',
                brand: 'Apple',
                sku: 'IP15PM-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=300',
                    'https://images.unsplash.com/photo-1695048132963-0e4d6c3f0b1a?w=300'
                ]),
                rating: 4.9,
                num_reviews: 128
            },
            {
                name: 'Samsung Galaxy S24 Ultra',
                description: 'Experience the power of Galaxy AI with built-in S Pen, 200MP camera, and Snapdragon 8 Gen 3 processor. Titanium frame and vibrant display.',
                price: 1299.99,
                discount_price: 1199.99,
                stock_quantity: 45,
                category: 'Electronics',
                brand: 'Samsung',
                sku: 'S24U-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=300'
                ]),
                rating: 4.8,
                num_reviews: 95
            },
            {
                name: 'Sony WH-1000XM5 Headphones',
                description: 'Industry-leading noise cancellation with exceptional sound quality. 30-hour battery life, lightweight design, and multipoint connection.',
                price: 399.99,
                discount_price: 349.99,
                stock_quantity: 120,
                category: 'Electronics',
                brand: 'Sony',
                sku: 'WH1000XM5-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=300'
                ]),
                rating: 4.7,
                num_reviews: 234
            },
            {
                name: 'MacBook Pro 14"',
                description: 'Supercharged by M3 Pro chip, 14-core GPU, and 18GB unified memory. Perfect for developers and creative professionals.',
                price: 1999.99,
                discount_price: null,
                stock_quantity: 30,
                category: 'Electronics',
                brand: 'Apple',
                sku: 'MBP14-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=300'
                ]),
                rating: 4.9,
                num_reviews: 312
            },
            
            // Clothing
            {
                name: 'Premium Cotton T-Shirt',
                description: '100% combed cotton t-shirt with modern fit. Breathable and comfortable for everyday wear. Available in multiple colors.',
                price: 29.99,
                discount_price: 19.99,
                stock_quantity: 200,
                category: 'Clothing',
                brand: 'FashionCo',
                sku: 'TSHIRT-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300'
                ]),
                rating: 4.5,
                num_reviews: 456
            },
            {
                name: 'Classic Denim Jeans',
                description: 'Premium denim jeans with perfect fit. Durable fabric with slight stretch for comfort. Classic five-pocket styling.',
                price: 79.99,
                discount_price: 59.99,
                stock_quantity: 150,
                category: 'Clothing',
                brand: 'DenimCo',
                sku: 'JEANS-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=300'
                ]),
                rating: 4.6,
                num_reviews: 289
            },
            {
                name: 'Winter Hoodie',
                description: 'Warm and cozy hoodie with fleece lining. Adjustable hood and kangaroo pocket. Perfect for cold weather.',
                price: 59.99,
                discount_price: 39.99,
                stock_quantity: 80,
                category: 'Clothing',
                brand: 'UrbanWear',
                sku: 'HOODIE-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300'
                ]),
                rating: 4.4,
                num_reviews: 178
            },
            
            // Books
            {
                name: 'The Midnight Library',
                description: 'A novel about the choices that define our lives, and the libraries that hold the stories of what could have been.',
                price: 24.99,
                discount_price: 14.99,
                stock_quantity: 300,
                category: 'Books',
                brand: 'Penguin',
                sku: 'BOOK-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300'
                ]),
                rating: 4.7,
                num_reviews: 892
            },
            {
                name: 'Atomic Habits',
                description: 'James Clear\'s guide to building good habits and breaking bad ones. Practical strategies that will teach you how to form good habits.',
                price: 27.99,
                discount_price: 19.99,
                stock_quantity: 400,
                category: 'Books',
                brand: 'Random House',
                sku: 'BOOK-002',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1589998059171-988d887df646?w=300'
                ]),
                rating: 4.8,
                num_reviews: 1245
            },
            
            // Home & Garden
            {
                name: 'Smart LED Bulb',
                description: 'WiFi enabled smart bulb with 16 million colors. Compatible with Alexa and Google Assistant. Energy efficient.',
                price: 19.99,
                discount_price: 12.99,
                stock_quantity: 500,
                category: 'Home & Garden',
                brand: 'SmartHome',
                sku: 'LIGHT-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1550985616-10810253b84d?w=300'
                ]),
                rating: 4.3,
                num_reviews: 567
            },
            {
                name: 'Indoor Plant Set',
                description: 'Set of 3 low-maintenance indoor plants in decorative pots. Perfect for home or office decoration.',
                price: 49.99,
                discount_price: 39.99,
                stock_quantity: 75,
                category: 'Home & Garden',
                brand: 'GreenLife',
                sku: 'PLANT-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1463936575829-25148e1db0b8?w=300'
                ]),
                rating: 4.6,
                num_reviews: 234
            },
            
            // Sports & Outdoors
            {
                name: 'Yoga Mat',
                description: 'Non-slip exercise mat with carrying strap. 6mm thickness for extra comfort and support.',
                price: 39.99,
                discount_price: 29.99,
                stock_quantity: 200,
                category: 'Sports & Outdoors',
                brand: 'FitLife',
                sku: 'YOGA-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=300'
                ]),
                rating: 4.5,
                num_reviews: 456
            },
            {
                name: 'Dumbbell Set',
                description: 'Adjustable dumbbell set with stand. Perfect for home workouts and strength training.',
                price: 299.99,
                discount_price: 249.99,
                stock_quantity: 50,
                category: 'Sports & Outdoors',
                brand: 'StrengthPro',
                sku: 'DUMB-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=300'
                ]),
                rating: 4.7,
                num_reviews: 189
            },
            
            // Toys & Games
            {
                name: 'Board Game Collection',
                description: 'Classic board games set including Chess, Checkers, and Backgammon. Perfect for family game night.',
                price: 49.99,
                discount_price: 34.99,
                stock_quantity: 150,
                category: 'Toys & Games',
                brand: 'FamilyFun',
                sku: 'GAME-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=300'
                ]),
                rating: 4.8,
                num_reviews: 345
            },
            
            // Beauty & Health
            {
                name: 'Skincare Set',
                description: 'Complete skincare routine set with cleanser, moisturizer, and serum. Suitable for all skin types.',
                price: 89.99,
                discount_price: 69.99,
                stock_quantity: 120,
                category: 'Beauty & Health',
                brand: 'PureBeauty',
                sku: 'SKIN-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=300'
                ]),
                rating: 4.4,
                num_reviews: 278
            },
            
            // Automotive
            {
                name: 'Car Phone Mount',
                description: 'Universal magnetic phone mount for car dashboard. Strong grip and 360° rotation.',
                price: 24.99,
                discount_price: 14.99,
                stock_quantity: 350,
                category: 'Automotive',
                brand: 'DriveSafe',
                sku: 'CAR-001',
                image_urls: JSON.stringify([
                    'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?w=300'
                ]),
                rating: 4.5,
                num_reviews: 678
            }
        ];

        // Insert products
        for (const product of products) {
            await connection.query(
                `INSERT INTO products 
                 (name, description, price, discount_price, stock_quantity, category_id, brand, sku, image_urls, rating, num_reviews, is_active) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    product.name,
                    product.description,
                    product.price,
                    product.discount_price,
                    product.stock_quantity,
                    categoryIds[product.category],
                    product.brand,
                    product.sku,
                    product.image_urls,
                    product.rating,
                    product.num_reviews,
                    true
                ]
            );
            console.log(`📦 Added product: ${product.name}`);
        }

        console.log('\n✨ Seeding completed successfully!');
        console.log(`📊 Total products added: ${products.length}`);
        console.log(`📁 Total categories: ${Object.keys(categoryIds).length}`);

        // Show summary by category
        console.log('\n📈 Summary by category:');
        for (const [categoryName, categoryId] of Object.entries(categoryIds)) {
            const [count] = await connection.query(
                'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
                [categoryId]
            );
            console.log(`   - ${categoryName}: ${count[0].count} products`);
        }

    } catch (error) {
        console.error('❌ Error seeding products:', error.message);
    } finally {
        await connection.end();
    }
}

// Run the seeding
seedProducts();
