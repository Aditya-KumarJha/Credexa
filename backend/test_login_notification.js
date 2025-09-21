const axios = require('axios');

async function testLoginNotification() {
    try {
        console.log('=== TESTING LOGIN WITH NOTIFICATION ===\n');

        const email = 'aman.kumar.it27@heritageit.edu.in';
        const password = 'Aman@1819';

        // Step 1: Request OTP
        console.log('Step 1: Requesting OTP...');
        const loginResponse = await axios.post('http://localhost:4000/api/auth/login', {
            email,
            password
        });

        console.log('✅ OTP requested successfully');

        // Step 2: Get OTP from database
        console.log('\nStep 2: Getting OTP from database...');
        const mongoose = require('mongoose');
        await mongoose.connect(process.env.MONGODB_URI);
        const User = require('./src/models/userModel');
        
        const user = await User.findOne({ email });
        const otpCode = user.otp.code;
        console.log('✅ OTP retrieved:', otpCode);

        // Step 3: Verify OTP (this should trigger login notification)
        console.log('\nStep 3: Verifying OTP (should send login notification)...');
        const verifyResponse = await axios.post('http://localhost:4000/api/auth/verify-otp', {
            email,
            otp: otpCode,
            context: 'login'
        });

        console.log('✅ Login successful!');
        console.log('Session ID:', verifyResponse.data.sessionId);
        
        // Wait a moment for the email to be processed
        console.log('\nStep 4: Waiting for login notification email...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ Login notification should have been sent to:', email);
        console.log('📧 Check your email for the login notification!');

        await mongoose.connection.close();

    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

require('dotenv').config();
testLoginNotification();