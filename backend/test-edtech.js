const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/userModel');

async function createEdTechUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Create a test EdTech platform user
    const edtechUser = new User({
      username: 'coursera_admin',
      email: 'admin@coursera.com',
      password: 'test123', // This will be hashed by the model
      role: 'institute',
      institute: {
        name: 'Coursera',
        issuerType: 'edtech'
        // Note: No AISHE code for EdTech platforms
      }
    });
    
    await edtechUser.save();
    console.log('Created EdTech user:', edtechUser.username);
    console.log('Institute Name:', edtechUser.institute.name);
    console.log('Issuer Type:', edtechUser.institute.issuerType);
    
    // Create a JWT token for this user
    const token = jwt.sign(
      { id: edtechUser._id },
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
      console.log('\n=== COURSERA ANALYTICS RESPONSE ===');
      console.log('This should show Coursera credentials using issuer-based filtering:');
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

createEdTechUser();