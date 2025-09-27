const User = require("../models/userModel");
const PendingUser = require("../models/pendingUserModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/emailService");
const { ethers } = require("ethers");
const crypto = require("crypto");
const challenges = require("../utils/challengeStore");
const { nanoid } = require('nanoid'); 

const generateToken = (user) => {
  const payload = { id: user._id };
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const OTP_RESEND_INTERVAL = 30 * 1000;

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const [existingUser, hashedPassword] = await Promise.all([
      User.findOne({ email }),
      bcrypt.hash(password, 10),
    ]);

    if (existingUser) {
      return res.status(400).json({ message: "An account with this email already exists" });
    }

    await PendingUser.deleteOne({ email });

    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    console.log("Signup OTP:", otpCode); 

    await PendingUser.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      otp: { code: otpCode, expiresAt },
    });

    res.status(200).json({ message: "OTP generated. Please check your email." });

    sendEmail(email, `Your OTP code is ${otpCode}`).catch((err) =>
      console.error("Email sending failed:", err)
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user || !user.password) return res.status(400).json({ message: "Invalid credentials" });
    if (user.provider !== "email")
      return res.status(400).json({ message: `This account was created with ${user.provider}. Please use that method to log in.` });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const now = new Date();

    if (user.otp?.lastSentAt && now - user.otp.lastSentAt < OTP_RESEND_INTERVAL) {
      return res.status(429).json({ message: "Please wait before requesting another OTP" });
    }

    const otpCode = generateOtp();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
    console.log("Login OTP:", otpCode);

    user.otp = { code: otpCode, expiresAt, lastSentAt: now };
    await user.save();

    res.status(200).json({
      message: "OTP sent to your email",
      user: {
        id: user._id,
        email: user.email,
      },
    });

    sendEmail(email, `Your login OTP code is ${otpCode}`).catch((err) =>
      console.error("Email sending failed:", err)
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp, context } = req.body;
    if (!email || !otp || !context) {
      return res.status(400).json({ message: "Email, OTP, and context are required" });
    }

    let user;
    let token;
    let sessionId; // Store sessionId for response

    if (context === "signup") {
      const pendingUser = await PendingUser.findOne({ email });
      if (!pendingUser || pendingUser.otp.code !== otp || pendingUser.otp.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      const [newUser] = await Promise.all([
        User.create({
          fullName: { firstName: pendingUser.firstName, lastName: pendingUser.lastName },
          email: pendingUser.email,
          password: pendingUser.password,
          provider: "email",
          isVerified: true,
        }),
        PendingUser.deleteOne({ email }),
      ]);
      user = newUser;
      token = generateToken(user);
    } else if (context === "login") {
      const foundUser = await User.findOne({ email });
      if (!foundUser || !foundUser.otp || foundUser.otp.code !== otp || foundUser.otp.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      // Create session for login
      sessionId = nanoid(32);
      const userAgent = req.headers['user-agent'] || '';
      
      // Parse device info (simplified)
      const deviceInfo = {
        userAgent: userAgent,
        browser: userAgent.includes('Chrome') ? 'Chrome' : userAgent.includes('Firefox') ? 'Firefox' : 'Unknown',
        os: userAgent.includes('Windows') ? 'Windows' : userAgent.includes('Mac') ? 'macOS' : userAgent.includes('Linux') ? 'Linux' : 'Unknown',
        device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'
      };

      const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'Unknown';

      // Initialize settings structure if it doesn't exist
      if (!foundUser.settings) {
        foundUser.settings = {
          preferences: {
            theme: "system",
            language: "en",
            notifications: { email: true, push: true, marketing: false, security: true },
            timezone: "UTC"
          },
          security: {
            twoFactorEnabled: false,
            sessionTimeout: 30,
            loginNotifications: true,
            activeSessions: []
          },
          privacy: {
            profileVisibility: "public",
            showEmail: false,
            showCredentials: true,
            allowProfileIndexing: true
          }
        };
      }

      if (!foundUser.settings.security) {
        foundUser.settings.security = {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          loginNotifications: true,
          activeSessions: []
        };
      }

      if (!foundUser.settings.security.activeSessions) {
        foundUser.settings.security.activeSessions = [];
      }

      // Create new session
      const newSession = {
        sessionId: sessionId,
        deviceInfo: JSON.stringify(deviceInfo),
        ipAddress: ipAddress,
        lastActive: new Date(),
        createdAt: new Date()
      };

      // Add session to user
      foundUser.settings.security.activeSessions.push(newSession);
      
      // Clear OTP and save
      foundUser.otp = undefined;
      await foundUser.save();
      
      user = foundUser;
      token = generateToken(user);

      // Send login notification email if enabled
      if (user.settings?.security?.loginNotifications) {
        const loginTime = new Date().toLocaleString();
        const loginNotificationSubject = "New Login to Your Credexa Account";
        const loginNotificationMessage = `
          Dear ${user.fullName?.firstName || 'User'},
          
          We detected a new login to your Credexa account.
          
          Login Details:
          • Time: ${loginTime}
          • Device: ${deviceInfo.device} (${deviceInfo.os})
          • Browser: ${deviceInfo.browser}
          • IP Address: ${ipAddress}
          • Session ID: ${sessionId}
          
          If this was you, no further action is needed.
          
          If you don't recognize this login, please:
          1. Change your password immediately
          2. Contact our support team
          3. Review your account security settings
          
          Stay secure,
          The Credexa Team
        `;
        
        // Send login notification asynchronously (don't wait for it)
        sendEmail(user.email, loginNotificationMessage, loginNotificationSubject)
          .then(() => console.log(`Login notification sent to ${user.email}`))
          .catch((err) => console.error("Login notification failed:", err));
      }
    } else if (context === "forgot") {
      const userToReset = await User.findOne({ email });
      if (!userToReset || userToReset.resetPasswordToken !== otp || userToReset.resetPasswordExpires < new Date()) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }
      return res.status(200).json({ message: "OTP verified successfully", resetAllowed: true });
    } else {
      return res.status(400).json({ message: "Invalid context. Must be 'signup', 'login', or 'forgot'" });
    }
    
    return res.status(context === 'signup' ? 201 : 200).json({
      message: `OTP verified successfully for ${context}`,
      token,
      ...(sessionId && { sessionId }), // Only include sessionId if it exists (for login)
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        provider: user.provider,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const otpCode = generateOtp();
    
    user.resetPasswordToken = otpCode;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    res.status(200).json({ message: "Password reset OTP sent to your email" });

    sendEmail(email, `Your password reset OTP is ${otpCode}`).catch((err) =>
      console.error("Email sending failed:", err)
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword)
      return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({
      email,
      resetPasswordToken: otp,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email, context } = req.body;

    if (!email || !context) {
      return res.status(400).json({ message: "Email and context are required" });
    }

    const now = new Date();

    if (context === "signup") {
      const pendingUser = await PendingUser.findOne({ email });
      if (!pendingUser) {
        return res.status(404).json({ message: "Pending signup not found for this email" });
      }

      if (pendingUser.otp?.lastSentAt && now - pendingUser.otp.lastSentAt < OTP_RESEND_INTERVAL) {
        const waitTime = Math.ceil((OTP_RESEND_INTERVAL - (now - pendingUser.otp.lastSentAt)) / 1000);
        return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting another OTP.` });
      }

      const otpCode = generateOtp();

      pendingUser.otp = {
        code: otpCode,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        lastSentAt: now,
      };
      await pendingUser.save();

      res.status(200).json({ message: "OTP resent for signup" });
      return sendEmail(email, `Your signup OTP code is ${otpCode}`).catch(err =>
        console.error("Email sending failed:", err)
      );
    }

    if (context === "login") {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      if (user.otp?.lastSentAt && now - user.otp.lastSentAt < OTP_RESEND_INTERVAL) {
        const waitTime = Math.ceil((OTP_RESEND_INTERVAL - (now - user.otp.lastSentAt)) / 1000);
        return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting another OTP.` });
      }

      const otpCode = generateOtp();

      user.otp = {
        code: otpCode,
        expiresAt: new Date(now.getTime() + 10 * 60 * 1000),
        lastSentAt: now,
      };
      await user.save();

      res.status(200).json({ message: "OTP resent for login" });
      return sendEmail(email, `Your login OTP code is ${otpCode}`).catch(err =>
        console.error("Email sending failed:", err)
      );
    }

    if (context === "forgot") {
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: "User not found" });

      const otpCode = generateOtp();

      user.resetPasswordToken = otpCode;
      user.resetPasswordExpires = new Date(now.getTime() + 10 * 60 * 1000);
      await user.save();

      res.status(200).json({ message: "OTP resent for password reset" });
      return sendEmail(email, `Your password reset OTP is ${otpCode}`).catch(err =>
        console.error("Email sending failed:", err)
      );
    }

    return res.status(400).json({ message: "Invalid context. Must be 'signup', 'login', or 'forgot'" });

  } catch (error) {
    console.error("Resend OTP Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const generateWeb3Challenge = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ message: "A valid wallet address is required." });
    }

    const nonce = crypto.randomBytes(32).toString("hex");
    const message = `Welcome to our platform!\n\nPlease sign this message to authenticate your wallet. This is a free action and will not trigger a blockchain transaction.\n\nNonce: ${nonce}`;
    
    const lowerCaseAddress = address.toLowerCase();
    challenges.set(lowerCaseAddress, message);

    setTimeout(() => {
        if (challenges.get(lowerCaseAddress) === message) {
            challenges.delete(lowerCaseAddress);
        }
    }, 10 * 60 * 1000); 

    res.json({ message });
  } catch (error) {
    console.error("Web3 Challenge Error:", error);
    res.status(500).json({ message: "Server error during challenge generation." });
  }
};

const verifyWeb3Signature = async (req, res) => {
  try {
    const { address, signature } = req.body;
    if (!address || !signature) {
      return res.status(400).json({ message: "Wallet address and signature are required." });
    }

    const lowerCaseAddress = address.toLowerCase();
    const originalMessage = challenges.get(lowerCaseAddress);

    if (!originalMessage) {
      return res.status(400).json({ message: "Challenge not found or expired. Please try connecting again." });
    }
    
    challenges.delete(lowerCaseAddress);

    const recoveredAddress = ethers.verifyMessage(originalMessage, signature);

    if (recoveredAddress.toLowerCase() !== lowerCaseAddress) {
      return res.status(401).json({ message: "Signature verification failed. The signature does not match the provided address." });
    }

    let user = await User.findOne({ walletAddress: lowerCaseAddress });

    if (!user) {
      user = await User.create({
        walletAddress: lowerCaseAddress,
        provider: "web3",
        isVerified: true,
      });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Authentication successful",
      token,
      user: {
        id: user._id,
        walletAddress: user.walletAddress,
        provider: user.provider,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error("Web3 Verify Error:", error);
    res.status(500).json({ message: "Server error during signature verification." });
  }
};

const selectRole = async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user.id;

    if (!role || !["learner", "employer", "institute"].includes(role)) {
      return res.status(400).json({ message: "Valid role is required (learner, employer, institute)" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select("-password -otp -resetPasswordToken -refreshToken");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Role updated successfully",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        provider: user.provider,
        profilePic: user.profilePic,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error("Select Role Error:", error);
    res.status(500).json({ message: "Server error during role selection." });
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  requestPasswordReset,
  resetPassword,
  resendOtp,
  generateWeb3Challenge,
  verifyWeb3Signature,
  selectRole,
};

