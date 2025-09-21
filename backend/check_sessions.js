require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/userModel');

async function checkUserSessions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'aman.kumar.it27@heritageit.edu.in';
        
        console.log('\n=== CHECKING USER SESSIONS ===');
        
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found');
        console.log('User ID:', user._id);
        
        console.log('\n=== SETTINGS STRUCTURE ===');
        console.log('Has settings:', !!user.settings);
        
        if (user.settings) {
            console.log('Has settings.security:', !!user.settings.security);
            
            if (user.settings.security) {
                console.log('Has activeSessions:', !!user.settings.security.activeSessions);
                console.log('Sessions count:', user.settings.security.activeSessions ? user.settings.security.activeSessions.length : 0);
                
                if (user.settings.security.activeSessions && user.settings.security.activeSessions.length > 0) {
                    console.log('\n=== ACTIVE SESSIONS ===');
                    user.settings.security.activeSessions.forEach((session, index) => {
                        console.log(`Session ${index + 1}:`, {
                            sessionId: session.sessionId,
                            createdAt: session.createdAt,
                            lastActive: session.lastActive,
                            ipAddress: session.ipAddress,
                            deviceInfo: session.deviceInfo ? JSON.parse(session.deviceInfo) : 'No device info'
                        });
                    });
                } else {
                    console.log('❌ No active sessions found');
                }
            } else {
                console.log('❌ No security settings found');
            }
        } else {
            console.log('❌ No settings found on user');
        }

        // Check the complete user document structure
        console.log('\n=== COMPLETE USER STRUCTURE ===');
        const userKeys = Object.keys(user.toObject());
        console.log('User document keys:', userKeys);
        
        if (user.settings) {
            const settingsKeys = Object.keys(user.settings);
            console.log('Settings keys:', settingsKeys);
            
            if (user.settings.security) {
                const securityKeys = Object.keys(user.settings.security);
                console.log('Security keys:', securityKeys);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

checkUserSessions();