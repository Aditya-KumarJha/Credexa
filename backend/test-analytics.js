const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/userModel');

async function testAnalytics() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find an institute user to test with (get the one with proper institute data)
    const instituteUser = await User.findOne({ 
      role: 'institute',
      'institute.name': { $exists: true, $ne: null }
    });
    
    if (!instituteUser) {
      console.log('No institute user found');
      return;
    }
    
    console.log('Testing with institute user:');
    console.log('ID:', instituteUser._id);
    console.log('Username:', instituteUser.username);
    console.log('Institute Name:', instituteUser.institute?.name);
    console.log('AISHE Code:', instituteUser.institute?.aisheCode);
    console.log('Issuer Type:', instituteUser.institute?.issuerType);
    
    // Create a JWT token for this user
    const token = jwt.sign(
      { id: instituteUser._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    console.log('\nGenerated JWT Token (first 50 chars):', token.substring(0, 50) + '...');
    
    // Test the analytics endpoint
    const response = await fetch('http://localhost:4000/api/institute/analytics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n=== ANALYTICS RESPONSE ===');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const error = await response.text();
      console.log('Error response:', error);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAnalytics();