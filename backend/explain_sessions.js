require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/userModel');

async function showSessionLocation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'aman.kumar.it27@heritageit.edu.in';
        
        console.log('=== SESSION STORAGE EXPLANATION ===\n');
        
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found in "users" collection');
        console.log('User ID:', user._id);
        
        console.log('\n🔍 WHERE TO FIND SESSIONS:');
        console.log('❌ Sessions are NOT in a separate "sessions" collection');
        console.log('✅ Sessions are stored INSIDE the user document');
        console.log('✅ Path: users collection -> user document -> settings.security.activeSessions');
        
        console.log('\n📍 EXACT DATABASE PATH:');
        console.log('Collection: "users"');
        console.log('Document: user with email "aman.kumar.it27@heritageit.edu.in"');
        console.log('Field: "settings.security.activeSessions"');
        
        if (user.settings?.security?.activeSessions) {
            console.log(`\n✅ SESSIONS FOUND: ${user.settings.security.activeSessions.length} active sessions`);
            
            console.log('\n📋 RECENT SESSIONS:');
            const recentSessions = user.settings.security.activeSessions.slice(-3);
            recentSessions.forEach((session, index) => {
                console.log(`\n  Session ${index + 1}:`);
                console.log(`    Session ID: ${session.sessionId}`);
                console.log(`    Created: ${session.createdAt}`);
                console.log(`    IP Address: ${session.ipAddress}`);
                console.log(`    Device: ${JSON.parse(session.deviceInfo).device}`);
                console.log(`    Browser: ${JSON.parse(session.deviceInfo).browser}`);
            });
        }

        console.log('\n🔧 HOW TO VIEW IN DATABASE:');
        console.log('1. Open your MongoDB database (MongoDB Compass/Atlas)');
        console.log('2. Navigate to "credexa" database');
        console.log('3. Open "users" collection');
        console.log('4. Find the user document with email "aman.kumar.it27@heritageit.edu.in"');
        console.log('5. Expand: settings → security → activeSessions');
        console.log('6. You\'ll see all session IDs there');

        console.log('\n📊 DATABASE STRUCTURE:');
        console.log('users/');
        console.log('  └── user_document/');
        console.log('      └── settings/');
        console.log('          └── security/');
        console.log('              └── activeSessions[] ← YOUR SESSIONS ARE HERE');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

showSessionLocation();