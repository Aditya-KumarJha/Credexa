const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
    },
    email: {
      type: String,
      unique: true,
      sparse: true, 
      lowercase: true,
      trim: true,
    },
    password: { type: String, minlength: 6 },

    googleId: { type: String, unique: true, sparse: true },
    githubId: { type: String, unique: true, sparse: true },
    facebookId: { type: String, unique: true, sparse: true },
    discordId: { type: String, unique: true, sparse: true },
    linkedinId: { type: String, unique: true, sparse: true },
    walletAddress: { type: String, unique: true, sparse: true },

    profilePic: { type: String, default: "" },
    provider: {
      type: String,
      enum: ["email", "google", "github", "facebook", "web3", "discord", "linkedin"],
      default: "email",
    },
    isVerified: { type: Boolean, default: false },

    otp: {
      code: { type: String },
      expiresAt: { type: Date },
      lastSentAt: { type: Date },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    emailChangeOtp: {
      code: { type: String },
      expiresAt: { type: Date },
      pendingEmail: { type: String, lowercase: true, trim: true },
      lastSentAt: { type: Date },
    },

    refreshToken: { type: String },
    
    // Institute/College information
    institute: {
      aishe_code: { type: String, trim: true },
      name: { type: String, trim: true },
      state: { type: String, trim: true },
      district: { type: String, trim: true },
      university_name: { type: String, trim: true },
      addedAt: { type: Date },
      isVerified: { type: Boolean, default: true }, // false if manually added, pending admin approval
    },
    
    // Settings fields
    settings: {
      preferences: {
        theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
        language: { type: String, default: "en" },
        notifications: {
          email: { type: Boolean, default: true },
          push: { type: Boolean, default: true },
          marketing: { type: Boolean, default: false },
          security: { type: Boolean, default: true },
        },
        timezone: { type: String, default: "UTC" },
      },
      security: {
        twoFactorEnabled: { type: Boolean, default: false },
        twoFactorSecret: { type: String },
        sessionTimeout: { type: Number, default: 30 }, // minutes
        loginNotifications: { type: Boolean, default: true },
        passwordLastChanged: { type: Date },
        activeSessions: [
          {
            sessionId: { type: String },
            deviceInfo: { type: String },
            ipAddress: { type: String },
            lastActive: { type: Date },
            createdAt: { type: Date, default: Date.now },
          }
        ],
      },
      privacy: {
        profileVisibility: { type: String, enum: ["public", "private", "connections"], default: "public" },
        showEmail: { type: Boolean, default: false },
        showCredentials: { type: Boolean, default: true },
        allowProfileIndexing: { type: Boolean, default: true },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', function(next) {
  const hasSocialId = this.googleId || this.githubId || this.facebookId || this.walletAddress || this.discordId || this.linkedinId;

  if (!hasSocialId && !this.password) {
    this.invalidate('password', 'Path `password` is required for email-based accounts.');
  }

  next();
});


const User = mongoose.model("User", userSchema);

module.exports = User;

