require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/userModel');

async function main() {
  const args = process.argv.slice(2);
  const emailArg = args.find(a => a.startsWith('--email='));
  const platformArg = args.find(a => a.startsWith('--platform='));

  if (!emailArg) {
    console.error('Usage: node scripts/clearPlatformSync.js --email=user@example.com [--platform=coursera|udemy|nptel|edx|linkedinLearning|google|all]');
    process.exit(1);
  }

  const email = emailArg.split('=')[1];
  const platform = (platformArg ? platformArg.split('=')[1] : 'coursera');

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set in environment');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`User not found for email: ${email}`);
      process.exit(2);
    }

    const platforms = ['coursera','udemy','nptel','edx','linkedinLearning','google'];
    const targets = platform === 'all' ? platforms : [platform];

    user.platformSync = user.platformSync || {};
    for (const p of targets) {
      if (!user.platformSync[p]) user.platformSync[p] = {};
      user.platformSync[p].profileUrl = '';
      user.platformSync[p].isConnected = false;
      user.platformSync[p].verified = false;
      user.platformSync[p].verifiedAt = null;
      user.platformSync[p].lastSyncAt = null;
      user.platformSync[p].pendingVerification = undefined;
    }

    await user.save();
    console.log(`Cleared platform sync for ${email} on: ${targets.join(', ')}`);
  } catch (err) {
    console.error('Error:', err);
    process.exit(3);
  } finally {
    await mongoose.disconnect();
  }
}

main();
