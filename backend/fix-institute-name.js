const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./src/models/userModel');

async function fixInstituteName() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Update the Heritage Institute user to have the correct name
    const result = await User.updateOne(
      { 'institute.name': 'Heritage Institute of Technology 126' },
      { $set: { 'institute.name': 'Heritage Institute of Technology' } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update
    const updatedUser = await User.findOne({ 'institute.name': 'Heritage Institute of Technology' })
      .select('username institute');
    
    console.log('Updated user:', {
      id: updatedUser._id,
      username: updatedUser.username,
      instituteName: updatedUser.institute.name,
      issuerType: updatedUser.institute.issuerType
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixInstituteName();