const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Credential = require('./src/models/credentialModel');
const User = require('./src/models/userModel');

async function investigateCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find all credentials with Heritage Institute issuer
    const heritageCredentials = await Credential.find({
      issuer: 'Heritage Institute of Technology 126'
    }).populate('user', 'fullName email');
    
    console.log(`\n=== ALL HERITAGE INSTITUTE CREDENTIALS ===`);
    console.log(`Total: ${heritageCredentials.length}`);
    
    heritageCredentials.forEach((cred, index) => {
      console.log(`\n${index + 1}. Title: ${cred.title}`);
      console.log(`   Issuer: ${cred.issuer}`);
      console.log(`   User: ${cred.user?.fullName?.firstName} ${cred.user?.fullName?.lastName} (${cred.user?.email})`);
      console.log(`   User ID: ${cred.user?._id}`);
      console.log(`   Skills: ${cred.skills}`);
      console.log(`   NSQF Level: ${cred.nsqfLevel}`);
      console.log(`   Created: ${cred.createdAt}`);
    });
    
    // Also check for case-insensitive matches
    const allHeritageVariants = await Credential.find({
      issuer: { $regex: /heritage.*technology/i }
    }).populate('user', 'fullName email');
    
    console.log(`\n=== ALL HERITAGE VARIANTS ===`);
    console.log(`Total: ${allHeritageVariants.length}`);
    
    // Group by exact issuer name
    const groupedByIssuer = {};
    allHeritageVariants.forEach(cred => {
      if (!groupedByIssuer[cred.issuer]) {
        groupedByIssuer[cred.issuer] = [];
      }
      groupedByIssuer[cred.issuer].push(cred);
    });
    
    Object.keys(groupedByIssuer).forEach(issuer => {
      console.log(`\n--- ${issuer} (${groupedByIssuer[issuer].length} credentials) ---`);
      groupedByIssuer[issuer].forEach((cred, index) => {
        console.log(`  ${index + 1}. ${cred.title} - User: ${cred.user?.fullName?.firstName} ${cred.user?.fullName?.lastName}`);
      });
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

investigateCredentials();