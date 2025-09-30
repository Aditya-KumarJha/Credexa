const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Import models
const User = require('./src/models/userModel');
const Credential = require('./src/models/credentialModel');

async function testDatabase() {
  try {
    console.log('Connected to MongoDB');
    
    // Find institute users
    const instituteUsers = await User.find({ role: 'institute' }).select('username institute');
    console.log('\n=== INSTITUTE USERS ===');
    console.log('Total institute users:', instituteUsers.length);
    
    instituteUsers.forEach((user, index) => {
      console.log(`${index + 1}. Username: ${user.username}`);
      console.log(`   Institute Name: ${user.institute?.name || 'N/A'}`);
      console.log(`   AISHE Code: ${user.institute?.aisheCode || 'N/A'}`);
      console.log(`   Issuer Type: ${user.institute?.issuerType || 'N/A'}`);
      console.log('   ---');
    });
    
    // Find some sample credentials
    const sampleCredentials = await Credential.find({}).limit(5).select('title issuer user skills nsqfLevel');
    console.log('\n=== SAMPLE CREDENTIALS ===');
    console.log('Total credentials found:', await Credential.countDocuments());
    
    sampleCredentials.forEach((cred, index) => {
      console.log(`${index + 1}. Title: ${cred.title}`);
      console.log(`   Issuer: ${cred.issuer}`);
      console.log(`   User ID: ${cred.user}`);
      console.log(`   Skills: ${cred.skills || 'N/A'}`);
      console.log(`   NSQF Level: ${cred.nsqfLevel || 'N/A'}`);
      console.log('   ---');
    });
    
    // Get unique issuers
    const uniqueIssuers = await Credential.distinct('issuer');
    console.log('\n=== UNIQUE ISSUERS ===');
    console.log('Total unique issuers:', uniqueIssuers.length);
    uniqueIssuers.slice(0, 10).forEach((issuer, index) => {
      console.log(`${index + 1}. ${issuer}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testDatabase();