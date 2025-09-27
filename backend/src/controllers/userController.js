const { ethers } = require("ethers");
const crypto = require("crypto");
const { nanoid } = require("nanoid");
const challenges = require("../utils/challengeStore");
const { uploadFile } = require("../services/storageService");
const sendEmail = require("../utils/emailService");
const User = require("../models/userModel");

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const OTP_RESEND_INTERVAL = 30 * 1000;

const getUserProfile = async (req, res) => {
  const user = req.user;
  if (user) {
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
      provider: user.provider,
      walletAddress: user.walletAddress,
      createdAt: user.createdAt,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = req.user;
        const { firstName, lastName, email } = req.body;

        const isSocialProvider = !['email', 'web3'].includes(user.provider);

        if (isSocialProvider && user.fullName?.firstName && (firstName || lastName)) {
            return res.status(403).json({ message: `Your name is managed by ${user.provider} and cannot be updated here.` });
        }
        if (isSocialProvider && user.email && email) {
             return res.status(403).json({ message: `Your email is managed by ${user.provider} and cannot be updated here.` });
        }

        const isAttemptingEmailUpdate = email && email.toLowerCase() !== user.email;

        if (isAttemptingEmailUpdate) {
            const newEmail = email.toLowerCase();
            const existingUser = await User.findOne({ email: newEmail });
            if (existingUser) {
                return res.status(400).json({ message: "This email is already in use by another account." });
            }

            const otpCode = generateOtp();
            user.emailChangeOtp = {
                code: otpCode,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                pendingEmail: newEmail,
                lastSentAt: new Date()
            };

            await sendEmail(newEmail, `Your email verification OTP is: ${otpCode}`, "Verify Your New Email Address");
        }

        if (firstName) user.fullName.firstName = firstName;
        if (lastName) user.fullName.lastName = lastName;
        if (req.file) {
            const uniqueFilename = `profile_${user._id}_${nanoid()}`;
            const uploadResponse = await uploadFile(req.file.buffer, uniqueFilename);
            user.profilePic = uploadResponse.url;
        }

        const updatedUser = await user.save();

        if (isAttemptingEmailUpdate) {
             return res.status(200).json({
                message: "Profile details saved. A verification OTP has been sent to your new email address.",
                emailVerificationRequired: true,
             });
        }

        res.status(200).json({
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            profilePic: updatedUser.profilePic,
            provider: updatedUser.provider,
            walletAddress: updatedUser.walletAddress,
            createdAt: updatedUser.createdAt,
        });

    } catch (error) {
        console.error("Update Profile Error:", error);
        if (error.code === 11000) {
             return res.status(400).json({ message: "This email is already in use by another account." });
        }
        res.status(500).json({ message: "Server error while updating profile." });
    }
};

const verifyEmailUpdate = async (req, res) => {
    try {
        const { otp } = req.body;
        const user = req.user;

        if (!otp) {
            return res.status(400).json({ message: "OTP is required." });
        }

        const otpData = user.emailChangeOtp;

        if (!otpData || otpData.code !== otp || otpData.expiresAt < new Date()) {
            return res.status(400).json({ message: "Invalid or expired OTP." });
        }

        user.email = otpData.pendingEmail;
        user.emailChangeOtp = undefined;
        
        const updatedUser = await user.save();
        
        res.status(200).json({
            message: "Email updated successfully.",
            user: {
                _id: updatedUser._id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                profilePic: updatedUser.profilePic,
                provider: updatedUser.provider,
                walletAddress: updatedUser.walletAddress,
                createdAt: updatedUser.createdAt,
            }
        });

    } catch (error) {
        console.error("Verify Email Error:", error);
        res.status(500).json({ message: "Server error during email verification." });
    }
};

const resendEmailUpdateOtp = async (req, res) => {
    try {
        const user = req.user;
        const otpData = user.emailChangeOtp;

        if (!otpData || !otpData.pendingEmail) {
            return res.status(400).json({ message: "No pending email change to verify." });
        }

        const now = new Date();
        if (otpData.lastSentAt && now - otpData.lastSentAt < OTP_RESEND_INTERVAL) {
            const waitTime = Math.ceil((OTP_RESEND_INTERVAL - (now - otpData.lastSentAt)) / 1000);
            return res.status(429).json({ message: `Please wait ${waitTime} seconds before requesting another OTP.` });
        }

        const newOtpCode = generateOtp();
        user.emailChangeOtp.code = newOtpCode;
        user.emailChangeOtp.expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
        user.emailChangeOtp.lastSentAt = now;

        await user.save();
        await sendEmail(otpData.pendingEmail, `Your new email verification OTP is: ${newOtpCode}`, "Verify Your New Email Address");

        res.status(200).json({ message: "A new OTP has been sent to the pending email address." });

    } catch (error) {
        console.error("Resend Email OTP Error:", error);
        res.status(500).json({ message: "Server error while resending OTP." });
    }
};

const generateLinkChallenge = async (req, res) => {
  try {
    const { address } = req.body;
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({ message: "A valid wallet address is required." });
    }
    const nonce = crypto.randomBytes(32).toString("hex");
    const message = `Please sign this message to link this wallet to your Credexa account.\n\nNonce: ${nonce}`;
    const lowerCaseAddress = address.toLowerCase();
    challenges.set(lowerCaseAddress, message);
    setTimeout(() => {
        if (challenges.get(lowerCaseAddress) === message) {
            challenges.delete(lowerCaseAddress);
        }
    }, 5 * 60 * 1000); 
    res.json({ message });
  } catch (error) {
    console.error("Link Wallet Challenge Error:", error);
    res.status(500).json({ message: "Server error during challenge generation." });
  }
};

const linkWalletAddress = async (req, res) => {
    try {
        const { address, signature } = req.body;
        if (!address || !signature) {
            return res.status(400).json({ message: "Wallet address and signature are required." });
        }
        const lowerCaseAddress = address.toLowerCase();
        const originalMessage = challenges.get(lowerCaseAddress);
        if (!originalMessage) {
            return res.status(400).json({ message: "Challenge not found or expired. Please try again." });
        }
        challenges.delete(lowerCaseAddress); 
        const recoveredAddress = ethers.verifyMessage(originalMessage, signature);
        if (recoveredAddress.toLowerCase() !== lowerCaseAddress) {
            return res.status(401).json({ message: "Signature verification failed." });
        }
        const user = req.user;
        user.walletAddress = lowerCaseAddress;
        await user.save();
        res.status(200).json({
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          profilePic: user.profilePic,
          provider: user.provider,
          walletAddress: user.walletAddress,
          createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("Link Wallet Error:", error);
        res.status(500).json({ message: "Server error during wallet linking." });
    }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  verifyEmailUpdate,
  resendEmailUpdateOtp,
  generateLinkChallenge,
  linkWalletAddress,
};
