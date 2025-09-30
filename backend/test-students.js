const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/userModel');

async function testStudentsEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the Heritage Institute user
    const instituteUser = await User.findOne({ 
      role: 'institute',
      'institute.name': 'Heritage Institute of Technology 126'
    });
    
    if (!instituteUser) {
      console.log('No institute user found');
      return;
    }
    
    console.log('Testing students endpoint for:', instituteUser.institute.name);
    
    // Create a JWT token for this user
    const token = jwt.sign(
      { id: instituteUser._id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    // Test the students endpoint
    const response = await fetch('http://localhost:4000/api/institute/students', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('\n=== STUDENTS WITH CREDENTIALS ===');
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

testStudentsEndpoint();