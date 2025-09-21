require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/userModel');

async function checkUserSessionsRaw() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'aman.kumar.it27@heritageit.edu.in';
        
        console.log('\n=== CHECKING USER SESSIONS (RAW) ===');
        
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ User found');
        console.log('Sessions count:', user.settings.security.activeSessions.length);
        
        if (user.settings.security.activeSessions && user.settings.security.activeSessions.length > 0) {
            console.log('\n=== ACTIVE SESSIONS (Last 3) ===');
            const recentSessions = user.settings.security.activeSessions.slice(-3);
            
            recentSessions.forEach((session, index) => {
                console.log(`\nSession ${index + 1}:`, {
                    sessionId: session.sessionId,
                    createdAt: session.createdAt,
                    lastActive: session.lastActive,
                    ipAddress: session.ipAddress,
                    deviceInfo: session.deviceInfo // Don't parse, just show raw
                });
            });
            
            // Check if sessions are from recent login attempts
            const now = new Date();
            const recentSessions24h = user.settings.security.activeSessions.filter(session => {
                const sessionTime = new Date(session.createdAt);
                const timeDiff = now - sessionTime;
                return timeDiff < 24 * 60 * 60 * 1000; // 24 hours
            });
            
            console.log(`\n✅ Sessions in last 24 hours: ${recentSessions24h.length}`);
            console.log(`✅ Total active sessions: ${user.settings.security.activeSessions.length}`);
            
        } else {
            console.log('❌ No active sessions found');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

checkUserSessionsRaw();