const { ethers } = require("ethers");
const crypto = require("crypto");
const { nanoid } = require("nanoid");
const challenges = require("../utils/challengeStore");
const { uploadFile } = require("../services/storageService");
const sendEmail = require("../utils/emailService");
const User = require("../models/userModel");
const Credential = require("../models/credentialModel");
const { calculateUserPoints } = require("./leaderboardController");

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();
const OTP_RESEND_INTERVAL = 30 * 1000;

const getUserProfile = async (req, res) => {
  const user = req.user;
  if (user) {
    res.status(200).json({
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        profilePic: user.profilePic,
        provider: user.provider,
        walletAddress: user.walletAddress,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
      }
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

// --- Public/Employer APIs ---

// Helper to get display name and avatar based on privacy settings
const buildPublicIdentity = (user) => {
    const isProfilePublic = user.settings?.preferences?.privacy?.profileVisibility !== 'private';
    let displayName = 'Anonymous User';
    let displayAvatar = `https://avatar.vercel.sh/${user._id}.png`;

    if (isProfilePublic) {
        if (user.fullName?.firstName || user.fullName?.lastName) {
            const first = user.fullName?.firstName || '';
            const last = user.fullName?.lastName || '';
            displayName = `${first} ${last}`.trim() || displayName;
        }
        displayAvatar = user.profileImage || user.profilePic || user.avatar || displayAvatar;
    }
    return { displayName, displayAvatar, isProfilePublic };
};

// GET /api/users/search?q=&skills=react,node&limit=&page=
// Returns a lightweight list of learner candidates for employer search
const searchLearners = async (req, res) => {
    try {
        const q = (req.query.q || '').toString().trim();
        const skillsParam = (req.query.skills || '').toString().trim();
        const experience = (req.query.experience || '').toString().trim(); // reserved for future use
        const skills = skillsParam ? skillsParam.split(',').map(s => s.trim()).filter(Boolean) : [];
        const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 24, 100));
        const page = Math.max(1, parseInt(req.query.page) || 1);

        // Build regex for text query (reuse across collections)
        const regex = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null;

        // Phase 1: find users via names/institute, and also via credentials if query/skills provided
        const userQuery = { role: 'learner' };
        let credUserIds = [];
        let userOr = [];
        if (regex) {
            userOr = [
                { 'fullName.firstName': regex },
                { 'fullName.lastName': regex },
                { 'institute.name': regex },
            ];
        }

        // If skills or q provided, pre-select users having matching credentials too
        if (skills.length || regex) {
            const credQueryForUsers = {};
            if (skills.length) credQueryForUsers.skills = { $in: skills };
            if (regex) {
                credQueryForUsers.$or = [
                    { title: regex },
                    { issuer: regex },
                    { skills: regex },
                ];
            }
            try {
                credUserIds = await Credential.distinct('user', credQueryForUsers);
            } catch (_) {
                credUserIds = [];
            }
        }

        if (userOr.length || credUserIds.length) {
            userQuery.$or = [];
            if (userOr.length) userQuery.$or.push(...userOr);
            if (credUserIds.length) userQuery.$or.push({ _id: { $in: credUserIds } });
        }

        const users = await User.find(userQuery)
            .select('fullName email institute profileImage profilePic avatar settings')
            .lean();

        if (!users.length) {
            return res.json({ success: true, total: 0, candidates: [] });
        }

        const userIds = users.map(u => u._id);

        // Phase 2: fetch credentials for these users, optionally filter by skill
            const credQuery = { user: { $in: userIds } };
        if (skills.length) {
            credQuery.skills = { $in: skills };
        }
            // If text query present, also try to match within credential fields (non-strict)
            let credRegex = null;
            if (regex) credRegex = regex;

            const credentials = await Credential.find(credQuery)
                .select('user skills type createdAt creditPoints nsqfLevel transactionHash title issuer')
                .lean();

        // Group credentials by user
        const credsByUser = new Map();
        for (const c of credentials) {
            const key = c.user.toString();
            if (!credsByUser.has(key)) credsByUser.set(key, []);
            credsByUser.get(key).push(c);
        }

        // Compose candidate list
            const rawCandidates = users.map(u => {
            const { displayName, displayAvatar, isProfilePublic } = buildPublicIdentity(u);
            // Respect opt-out
            const showInLeaderboard = u.settings?.preferences?.privacy?.showInLeaderboard !== false;
            if (!showInLeaderboard) return null;

            const uCreds = credsByUser.get(u._id.toString()) || [];
                // If no credentials and no text query, skip to keep results meaningful
                if (!uCreds.length && !q) return null;

                // If text query provided, ensure either user's name/institute matched or
                // credential fields match the query
                if (credRegex && !([
                    u.fullName?.firstName,
                    u.fullName?.lastName,
                    u.institute?.name
                ].some(v => v && credRegex.test(v))) ) {
                    const hasCredTextMatch = uCreds.some(c => (
                        credRegex.test(c.title || '') || credRegex.test(c.issuer || '') || (c.skills || []).some(s => credRegex.test(s))
                    ));
                    if (!hasCredTextMatch) return null;
                }

            // Unique skills and top skill
            const skillCounts = {};
            for (const c of uCreds) {
                (c.skills || []).forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; });
            }
            const uniqueSkills = Object.keys(skillCounts);
            const topSkill = uniqueSkills.sort((a, b) => (skillCounts[b] - skillCounts[a]))[0] || 'General';

            // Points to derive simple scores
            const points = calculateUserPoints(uCreds);
            const credentialCount = uCreds.length;
            const perf = Math.min(100, Math.max(60, Math.floor(points / 50) + 60));
            const eff = Math.min(120, Math.max(70, credentialCount * 8 + 70));
            const soc = Math.min(120, Math.max(70, uniqueSkills.length * 3 + 70));

            // Build username-like handle
            const first = u.fullName?.firstName || '';
            const last = u.fullName?.lastName || '';
            const handle = (first + last).trim().toLowerCase() || (u.email ? u.email.split('@')[0] : `user_${u._id.toString().slice(-6)}`);

                    return {
                id: u._id.toString(),
                name: displayName,
                username: handle,
                avatarUrl: displayAvatar,
                role: `${topSkill} Professional`,
                scores: { efficiency: eff, social: soc, performance: perf },
                topSkills: uniqueSkills.sort((a,b) => skillCounts[b]-skillCounts[a]).slice(0, 3),
                onChainVerified: uCreds.some(c => !!c.transactionHash),
            };
        }).filter(Boolean);

        // Simple pagination on the array
        const start = (page - 1) * limit;
        const paged = rawCandidates.slice(start, start + limit);

                res.json({ success: true, total: rawCandidates.length, page, limit, candidates: paged });
    } catch (err) {
        console.error('Search learners error:', err);
        res.status(500).json({ success: false, message: 'Failed to search learners' });
    }
};

// GET /api/users/:id/public-profile
// Returns public profile summary with verified credentials and skills analytics
const getPublicProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId)
            .select('fullName email institute profileImage profilePic avatar settings role')
            .lean();
        if (!user || user.role !== 'learner') {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const { displayName, displayAvatar, isProfilePublic } = buildPublicIdentity(user);
        if (!isProfilePublic) {
            return res.status(403).json({ success: false, message: 'This profile is private' });
        }

        // Fetch credentials (prefer verified for employer view)
        const creds = await Credential.find({ user: user._id })
            .select('title issuer issueDate skills status transactionHash')
            .lean();

        const verifiedCreds = creds.filter(c => c.status === 'verified');

        // Build skills analytics
        const skillCounts = {};
        creds.forEach(c => (c.skills || []).forEach(s => { skillCounts[s] = (skillCounts[s] || 0) + 1; }));
        const entries = Object.entries(skillCounts).sort((a, b) => b[1] - a[1]);
        const topSkills = entries.slice(0, 6);
        const maxCount = topSkills[0]?.[1] || 1;
        const radar = topSkills.map(([skill, count]) => ({ subject: skill, A: Math.round((count / maxCount) * 100), fullMark: 100 }));

        // Derive simple scores
        const points = calculateUserPoints(creds);
        const credentialCount = creds.length;
        const perf = Math.min(100, Math.max(60, Math.floor(points / 50) + 60));
        const eff = Math.min(120, Math.max(70, credentialCount * 8 + 70));
        const soc = Math.min(120, Math.max(70, Object.keys(skillCounts).length * 3 + 70));

        // Privacy for email exposure
        const showEmail = user.settings?.privacy?.showEmail === true;

        res.json({
            success: true,
            candidate: {
                id: user._id.toString(),
                name: displayName,
                username: (user.fullName?.firstName || '') + (user.fullName?.lastName || ''),
                avatarUrl: displayAvatar,
                role: `${(entries[0]?.[0] || 'General')} Professional`,
                scores: { efficiency: eff, social: soc, performance: perf },
                skills: radar,
                topSkills: entries.slice(0, 3).map(e => e[0]),
                email: showEmail ? user.email : null,
                phone: null,
                verifiedCredentials: verifiedCreds.map(c => ({ id: `${c._id}`, issuer: c.issuer, name: c.title, date: c.issueDate })),
                onChainVerified: creds.some(c => !!c.transactionHash),
            }
        });
    } catch (err) {
        console.error('Get public profile error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch public profile' });
    }
};

// Extend exports
module.exports.searchLearners = searchLearners;
module.exports.getPublicProfile = getPublicProfile;
