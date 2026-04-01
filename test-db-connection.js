// test-db-connection.js
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

async function testConnection() {
    console.log('Testing database connection...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Port:', process.env.DB_PORT || 3306);
    console.log('User:', process.env.DB_USER);
    console.log('Database:', process.env.DB_NAME);
    console.log('-----------------------------------');

    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            connectTimeout: 10000
        });

        console.log('✅ Connection successful!');
        
        const [rows] = await connection.query('SELECT NOW() as time, DATABASE() as db');
        console.log('Server time:', rows[0].time);
        console.log('Database name:', rows[0].db);
        
        await connection.end();
        console.log('✅ Test completed');
        
    } catch (error) {
        console.error('❌ Connection failed!');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Common error codes and fixes:
        if (error.code === 'ECONNREFUSED') {
            console.log('\n🔧 Fix: MySQL port 3306 is not accessible.');
            console.log('   - Check if Remote MySQL is enabled in Hostinger');
            console.log('   - Verify the hostname is correct');
            console.log('   - Check if your IP is whitelisted');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n🔧 Fix: Wrong username or password.');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.log('\n🔧 Fix: Database name is incorrect.');
        } else if (error.code === 'ETIMEDOUT') {
            console.log('\n🔧 Fix: Connection timeout.');
            console.log('   - Check if Remote MySQL is enabled');
            console.log('   - Verify the hostname is correct');
        }
    }
}

testConnection();
