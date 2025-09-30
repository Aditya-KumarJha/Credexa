const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Credential = require('./src/models/credentialModel');
const User = require('./src/models/userModel');

async function debugStudentCredentials() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const instituteName = 'Heritage Institute of Technology 126';
    
    // Step 1: Find all credentials from this institution
    const instituteCredentials = await Credential.find({
      issuer: instituteName
    }).populate('user', 'fullName email');
    
    console.log(`\n=== CREDENTIALS FROM ${instituteName} ===`);
    console.log(`Total: ${instituteCredentials.length}`);
    
    instituteCredentials.forEach((cred, index) => {
      console.log(`${index + 1}. Title: ${cred.title}`);
      console.log(`   User: ${cred.user?.fullName?.firstName} ${cred.user?.fullName?.lastName}`);
      console.log(`   User ID: ${cred.user?._id}`);
      console.log(`   Email: ${cred.user?.email}`);
      console.log('   ---');
    });
    
    // Step 2: Get unique user IDs who have credentials from this institution
    const uniqueUserIds = [...new Set(instituteCredentials.map(cred => cred.user?._id?.toString()))];
    console.log(`\nUnique users with credentials from this institution: ${uniqueUserIds.length}`);
    uniqueUserIds.forEach((userId, index) => {
      console.log(`${index + 1}. User ID: ${userId}`);
    });
    
    // Step 3: Test the aggregation logic used in the endpoint
    const credentialsWithUsers = await Credential.aggregate([
      { $match: { issuer: instituteName } },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'userData'
        }
      },
      { $unwind: '$userData' },
      {
        $group: {
          _id: '$user',
          userName: { $first: '$userData.username' },
          userEmail: { $first: '$userData.email' },
          userFullName: { $first: '$userData.fullName' },
          credentialsFromThisInstitute: { $sum: 1 },
          latestCredential: { $max: '$createdAt' }
        }
      },
      { $sort: { latestCredential: -1 } }
    ]);
    
    console.log(`\n=== AGGREGATION RESULT ===`);
    console.log(`Students found: ${credentialsWithUsers.length}`);
    
    credentialsWithUsers.forEach((student, index) => {
      console.log(`${index + 1}. User ID: ${student._id}`);
      console.log(`   Name: ${student.userFullName?.firstName} ${student.userFullName?.lastName}`);
      console.log(`   Email: ${student.userEmail}`);
      console.log(`   Credentials from this institute: ${student.credentialsFromThisInstitute}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
}

debugStudentCredentials();