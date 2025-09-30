const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/userModel');

async function listUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all institute users
    const instituteUsers = await User.find({ role: 'institute' })
      .select('username email institute')
      .sort({ createdAt: -1 });
    
    console.log('\n=== ALL INSTITUTE USERS ===');
    console.log('Total institute users:', instituteUsers.length);
    
    instituteUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. USER ID: ${user._id}`);
      console.log(`   Username: ${user.username || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Institute Name: ${user.institute?.name || 'N/A'}`);
      console.log(`   AISHE Code: ${user.institute?.aisheCode || 'N/A'}`);
      console.log(`   Issuer Type: ${user.institute?.issuerType || 'N/A'}`);
      console.log(`   Created: ${user.createdAt || 'N/A'}`);
    });
    
    console.log('\n=== LOGIN CREDENTIALS FOR TESTING ===');
    console.log('You can login to the frontend using these credentials:');
    instituteUsers.forEach((user, index) => {
      if (user.email) {
        console.log(`${index + 1}. Email: ${user.email} | Password: test123 (if not changed)`);
        console.log(`   Will show dashboard for: ${user.institute?.name || 'Unknown'} (${user.institute?.issuerType || 'unknown type'})`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

listUsers();