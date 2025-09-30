const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Credential = require('./src/models/credentialModel');

async function fixAllHeritageNames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Update the lowercase variant
    const updateResult1 = await Credential.updateMany(
      { issuer: 'heritage institute of technology' },
      { $set: { issuer: 'Heritage Institute of Technology 126' } }
    );
    
    console.log(`Updated ${updateResult1.modifiedCount} credentials with lowercase name`);
    
    // Check for any other Heritage variants
    const allHeritageVariants = await Credential.find({
      issuer: { $regex: /heritage.*technology/i }
    });
    
    console.log('\nAll Heritage Institute credentials after update:');
    allHeritageVariants.forEach((cred, index) => {
      console.log(`${index + 1}. Title: ${cred.title}`);
      console.log(`   Issuer: "${cred.issuer}"`);
      console.log(`   User ID: ${cred.user}`);
      console.log('   ---');
    });
    
    // Final verification
    const finalCount = await Credential.countDocuments({
      issuer: 'Heritage Institute of Technology 126'
    });
    
    console.log(`\nFinal count of credentials with exact issuer name: ${finalCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixAllHeritageNames();