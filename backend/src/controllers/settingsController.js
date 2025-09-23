const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Check if speakeasy is available, fallback for 2FA
let speakeasy, QRCode;
try {
  speakeasy = require("speakeasy");
  QRCode = require("qrcode");
} catch (error) {
  console.warn("2FA packages not installed. Two-factor authentication will be disabled.");
}

// Get user settings
const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password -refreshToken -resetPasswordToken -otp -emailChangeOtp");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {
        preferences: {
          theme: "system",
          language: "en",
          notifications: {
            email: true,
            push: true,
            marketing: false,
            security: true,
          },
          timezone: "UTC",
        },
        security: {
          twoFactorEnabled: false,
          sessionTimeout: 30,
          loginNotifications: true,
          activeSessions: [],
        },
        privacy: {
          profileVisibility: "public",
          showEmail: false,
          showCredentials: true,
          allowProfileIndexing: true,
        },
      };
      await user.save();
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update profile settings
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate current password if trying to change password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to change password" });
      }

      if (user.password) {
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
      }

      // Validate new password strength
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      user.password = hashedNewPassword;
      user.settings = user.settings || {};
      user.settings.security = user.settings.security || {};
      user.settings.security.passwordLastChanged = new Date();
    }

    // Update profile fields
    if (fullName) {
      user.fullName = fullName;
    }

    if (email && email !== user.email) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({ message: "Email already exists" });
      }

      user.email = email;
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select("-password -refreshToken -resetPasswordToken -otp -emailChangeOtp");

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update preferences
const updatePreferences = async (req, res) => {
  try {
    const { theme, language, notifications, timezone } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.preferences) {
      user.settings.preferences = {};
    }

    // Update preferences
    if (theme !== undefined) {
      user.settings.preferences.theme = theme;
    }
    if (language !== undefined) {
      user.settings.preferences.language = language;
    }
    if (notifications !== undefined) {
      user.settings.preferences.notifications = {
        ...user.settings.preferences.notifications,
        ...notifications,
      };
    }
    if (timezone !== undefined) {
      user.settings.preferences.timezone = timezone;
    }

    await user.save();

    res.json({
      success: true,
      message: "Preferences updated successfully",
      data: user.settings.preferences,
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update security settings
const updateSecurity = async (req, res) => {
  try {
    const { sessionTimeout, loginNotifications } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.security) {
      user.settings.security = {};
    }

    // Update security settings
    if (sessionTimeout !== undefined) {
      user.settings.security.sessionTimeout = sessionTimeout;
    }
    if (loginNotifications !== undefined) {
      user.settings.security.loginNotifications = loginNotifications;
    }

    await user.save();

    res.json({
      success: true,
      message: "Security settings updated successfully",
      data: user.settings.security,
    });
  } catch (error) {
    console.error("Update security error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Enable/Disable 2FA
const toggle2FA = async (req, res) => {
  try {
    if (!speakeasy || !QRCode) {
      return res.status(501).json({ message: "Two-factor authentication is not available" });
    }

    const { enable, token } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.security) {
      user.settings.security = {};
    }

    if (enable) {
      // Generate secret for 2FA
      const secret = speakeasy.generateSecret({
        name: `Credexa (${user.email})`,
        issuer: 'Credexa'
      });

      if (token) {
        // Verify the token before enabling
        const verified = speakeasy.totp.verify({
          secret: secret.base32,
          encoding: 'base32',
          token,
          window: 1
        });

        if (!verified) {
          return res.status(400).json({ message: "Invalid verification code" });
        }

        user.settings.security.twoFactorEnabled = true;
        user.settings.security.twoFactorSecret = secret.base32;
        await user.save();

        res.json({
          success: true,
          message: "Two-factor authentication enabled successfully"
        });
      } else {
        // Return QR code for setup
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
        
        res.json({
          success: true,
          qrCode: qrCodeUrl,
          secret: secret.base32,
          message: "Scan QR code with your authenticator app"
        });
      }
    } else {
      // Disable 2FA
      if (token && user.settings.security.twoFactorSecret) {
        const verified = speakeasy.totp.verify({
          secret: user.settings.security.twoFactorSecret,
          encoding: 'base32',
          token,
          window: 1
        });

        if (!verified) {
          return res.status(400).json({ message: "Invalid verification code" });
        }
      }

      user.settings.security.twoFactorEnabled = false;
      user.settings.security.twoFactorSecret = undefined;
      await user.save();

      res.json({
        success: true,
        message: "Two-factor authentication disabled successfully"
      });
    }
  } catch (error) {
    console.error("Toggle 2FA error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get active sessions
const getActiveSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.settings || !user.settings.security) {
      return res.json({
        success: true,
        data: []
      });
    }

    res.json({
      success: true,
      data: user.settings.security.activeSessions || []
    });
  } catch (error) {
    console.error("Get active sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Revoke session
const revokeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.settings || !user.settings.security || !user.settings.security.activeSessions) {
      return res.status(404).json({ message: "Session not found" });
    }

    user.settings.security.activeSessions = user.settings.security.activeSessions.filter(
      session => session.sessionId !== sessionId
    );

    await user.save();

    res.json({
      success: true,
      message: "Session revoked successfully"
    });
  } catch (error) {
    console.error("Revoke session error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update privacy settings
const updatePrivacy = async (req, res) => {
  try {
    const { profileVisibility, showEmail, showCredentials, allowProfileIndexing, showInLeaderboard } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.privacy) {
      user.settings.privacy = {};
    }

    // Update privacy settings
    if (profileVisibility !== undefined) {
      user.settings.privacy.profileVisibility = profileVisibility;
    }
    if (showEmail !== undefined) {
      user.settings.privacy.showEmail = showEmail;
    }
    if (showCredentials !== undefined) {
      user.settings.privacy.showCredentials = showCredentials;
    }
    if (allowProfileIndexing !== undefined) {
      user.settings.privacy.allowProfileIndexing = allowProfileIndexing;
    }
    if (showInLeaderboard !== undefined) {
      user.settings.privacy.showInLeaderboard = showInLeaderboard;
    }

    await user.save();

    res.json({
      success: true,
      message: "Privacy settings updated successfully",
      data: user.settings.privacy,
    });
  } catch (error) {
    console.error("Update privacy error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Clear all sessions
const clearAllSessions = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize settings if they don't exist
    if (!user.settings) {
      user.settings = {};
    }
    if (!user.settings.security) {
      user.settings.security = {};
    }

    // Clear all sessions
    user.settings.security.activeSessions = [];
    await user.save();

    res.json({
      success: true,
      message: "All sessions cleared successfully"
    });
  } catch (error) {
    console.error("Clear sessions error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getSettings,
  updateProfile,
  updatePreferences,
  updateSecurity,
  toggle2FA,
  getActiveSessions,
  revokeSession,
  updatePrivacy,
  clearAllSessions,
};