/**
 * MongoDB Connection Test Script
 * Run this to verify your MongoDB connection
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sred_db';

console.log('🔍 Testing MongoDB connection...');
console.log('📍 Connection URI:', MONGODB_URI.replace(/\/\/.*@/, '//<credentials>@')); // Hide credentials

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    console.log('📊 Connection details:');
    console.log('   - Host:', mongoose.connection.host);
    console.log('   - Database:', mongoose.connection.name);
    console.log('   - Port:', mongoose.connection.port);
    console.log('   - Ready State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected');
    
    // Close connection and exit
    mongoose.connection.close();
    console.log('\n✔️  Connection test completed successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed!');
    console.error('Error:', err.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   1. Make sure MongoDB is installed and running');
    console.error('   2. Check if MongoDB service is started');
    console.error('   3. Verify the connection string in .env file');
    console.error('   4. Check if port 27017 is accessible');
    process.exit(1);
  });

