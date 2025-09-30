const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Credential = require('./src/models/credentialModel');

async function updateIssuerNames() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find credentials with incomplete Heritage Institute name
    const incompleteCredentials = await Credential.find({
      issuer: 'Heritage Institute of Technology'
    });
    
    console.log(`Found ${incompleteCredentials.length} credentials with incomplete issuer name`);
    
    if (incompleteCredentials.length > 0) {
      // Update the issuer name to include "126"
      const updateResult = await Credential.updateMany(
        { issuer: 'Heritage Institute of Technology' },
        { $set: { issuer: 'Heritage Institute of Technology 126' } }
      );
      
      console.log(`Updated ${updateResult.modifiedCount} credentials`);
      console.log('Issuer name changed from "Heritage Institute of Technology" to "Heritage Institute of Technology 126"');
    }
    
    // Verify the update
    const updatedCredentials = await Credential.find({
      issuer: 'Heritage Institute of Technology 126'
    });
    
    console.log(`\nVerification: Found ${updatedCredentials.length} credentials with correct issuer name`);
    
    // Show sample updated credentials
    console.log('\nSample updated credentials:');
    updatedCredentials.slice(0, 3).forEach((cred, index) => {
      console.log(`${index + 1}. Title: ${cred.title}`);
      console.log(`   Issuer: ${cred.issuer}`);
      console.log(`   User: ${cred.user}`);
      console.log('   ---');
    });
    
    // Show updated issuer list
    const uniqueIssuers = await Credential.distinct('issuer');
    console.log('\nUpdated unique issuers:');
    uniqueIssuers.forEach((issuer, index) => {
      console.log(`${index + 1}. ${issuer}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateIssuerNames();