const Credential = require('../models/credentialModel');
const User = require('../models/userModel');
const ApiUsage = require('../models/apiUsageModel');
const crypto = require('crypto');
const axios = require('axios');
const { verifyCredential } = require('../services/blockchainService');
const { generatePdfPreview, getFileType } = require('../services/pdfPreviewService');
const ActivityTracker = require('../utils/activityTracker');

// Validate certificate URL
const validateCertificateUrl = async (url) => {
  try {
    if (!url) return { valid: false, error: 'Certificate URL is required' };
    
    // Basic URL validation
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(url)) {
      return { valid: false, error: 'Invalid URL format. Must start with http:// or https://' };
    }

    // Check if URL is accessible (with production-friendly error handling)
    const response = await axios.head(url, { 
      timeout: 15000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Credexa-Bot/1.0'
      },
      validateStatus: (status) => status < 500 // Accept redirects and client errors
    });

    // More flexible content type validation for production
    const contentType = response.headers['content-type'] || '';
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    
    // If no content-type header, try to determine from URL
    if (!contentType) {
      const urlLower = url.toLowerCase();
      if (!urlLower.includes('.pdf') && !urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return { 
          valid: false, 
          error: 'Unable to determine file type. Please ensure URL points to a PDF or image file' 
        };
      }
    } else if (!validTypes.some(type => contentType.includes(type))) {
      return { 
        valid: false, 
        error: `Invalid file type: ${contentType}. Must be PDF, JPEG, PNG, GIF, or WebP` 
      };
    }

    return { valid: true, contentType };
  } catch (error) {
    return { 
      valid: false, 
      error: `Certificate URL not accessible: ${error.message}` 
    };
  }
};

// Find or create user by email
const findOrCreateUser = async (email, userData = {}) => {
  try {
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Create new user if not found
      user = new User({
        email: email.toLowerCase(),
        fullName: {
          firstName: userData.firstName || 'Unknown',
          lastName: userData.lastName || 'User'
        },
        role: 'learner',
        isVerified: false
      });
      await user.save();
    }
    
    return user;
  } catch (error) {
    throw new Error(`User creation failed: ${error.message}`);
  }
};

// Submit credential via API
const submitCredential = async (req, res) => {
  try {
    const startTime = Date.now();
    const {
      studentEmail,
      studentFirstName,
      studentLastName,
      credentialTitle,
      courseCode,
      description,
      nsqfLevel,
      completionDate,
      issueDate,
      certificateUrl,
      skills = [],
      credentialType = 'certificate',
      creditPoints,
      verificationHash,
      blockchainId,
      metadata = {}
    } = req.body;

    // Validation
    const requiredFields = {
      studentEmail: 'Student email is required',
      credentialTitle: 'Credential title is required',
      completionDate: 'Completion date is required',
      certificateUrl: 'Certificate URL is required'
    };

    for (const [field, message] of Object.entries(requiredFields)) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR',
          message,
          field
        });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(studentEmail)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format',
        field: 'studentEmail'
      });
    }

    // Validate dates
    const completionDateObj = new Date(completionDate);
    const issueDateObj = issueDate ? new Date(issueDate) : completionDateObj;
    
    if (isNaN(completionDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid completion date format',
        field: 'completionDate'
      });
    }

    if (completionDateObj > new Date()) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Completion date cannot be in the future',
        field: 'completionDate'
      });
    }

    // Validate NSQF level if provided
    if (nsqfLevel && (nsqfLevel < 1 || nsqfLevel > 10)) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'NSQF level must be between 1 and 10',
        field: 'nsqfLevel'
      });
    }

    // Validate certificate URL
    const urlValidation = await validateCertificateUrl(certificateUrl);
    if (!urlValidation.valid) {
      return res.status(400).json({
        success: false,
        error: 'CERTIFICATE_URL_ERROR',
        message: urlValidation.error,
        field: 'certificateUrl'
      });
    }

    // Find or create user
    const user = await findOrCreateUser(studentEmail, {
      firstName: studentFirstName,
      lastName: studentLastName
    });

    // Check for duplicate credentials
    const existingCredential = await Credential.findOne({
      user: user._id,
      title: credentialTitle,
      issuer: { $regex: new RegExp(`^${req.issuer.institute.name}$`, 'i') },
      issueDate: issueDateObj
    });

    if (existingCredential) {
      return res.status(409).json({
        success: false,
        error: 'DUPLICATE_CREDENTIAL',
        message: 'A credential with the same title and issue date already exists for this student',
        existingCredentialId: existingCredential._id
      });
    }

    // Generate credential hash for verification (using credential id and issuer)
    // Note: credential id is not available until after save, so we will use a temporary id for hash, then update after save
    let credentialHash;
    let credentialId;

    // Create the credential first to get its credentialId
    const newCredential = new Credential({
      user: user._id,
      title: credentialTitle,
      description: description || '',
      issuer: req.issuer.institute.name,
      type: credentialType,
      status: 'verified',
      issuerVerification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: req.issuer._id
      },
      issueDate: issueDateObj,
      skills: Array.isArray(skills) ? skills : [],
      nsqfLevel: nsqfLevel || null,
      creditPoints: creditPoints || null,
      imageUrl: certificateUrl,
      credentialUrl: certificateUrl,
      blockchainAddress: blockchainId || null,
      transactionHash: verificationHash || null,
      metadata: {
        ...metadata,
        submittedViaApi: true,
        apiKeyId: req.apiKey._id,
        courseCode: courseCode || null,
        completionDate: completionDateObj,
        apiSubmissionTime: new Date()
      }
    });
    await newCredential.save();
    credentialId = newCredential.credentialId;
    credentialHash = crypto.createHash('sha256').update(`${credentialId}${req.issuer.institute.name}`).digest('hex');
    newCredential.credentialHash = credentialHash;
    await newCredential.save();

    // Check if a credential with the same hash already exists in DB (after hash is set)
    try {
  const existingByHash = await Credential.findOne({ credentialHash: credentialHash, credentialId: { $ne: newCredential.credentialId } });
      if (existingByHash) {
        // If it's already in DB and has a transactionHash, it's anchored
        if (existingByHash.transactionHash) {
          return res.status(409).json({
            success: false,
            error: 'ALREADY_ANCHORED',
            message: 'A credential with the same contents is already anchored on the blockchain',
            existingCredentialId: existingByHash._id,
            transactionHash: existingByHash.transactionHash,
            credentialHash
          });
        }
        // If exists in DB but not anchored, return conflict with DB id to avoid duplicate entries
        return res.status(409).json({
          success: false,
          error: 'DUPLICATE_CREDENTIAL',
          message: 'A credential with the same contents already exists for this student',
          existingCredentialId: existingByHash._id,
          credentialHash
        });
      }

      // If not found in DB, check on-chain if the hash is anchored (this is a best-effort call)
      try {
        const onChain = await verifyCredential('0x' + credentialHash);
        if (onChain && onChain.timestamp && onChain.timestamp !== 0n) {
          return res.status(409).json({
            success: false,
            error: 'ALREADY_ANCHORED',
            message: 'This credential has already been anchored on the blockchain',
            credentialHash: '0x' + credentialHash,
            blockchain: {
              issuer: onChain.issuer,
              timestamp: Number(onChain.timestamp)
            }
          });
        }
      } catch (chainErr) {
        // If blockchain check fails, log and continue - don't block submission on RPC flakiness
        console.warn('Blockchain verify call failed while checking duplicates:', chainErr.message);
      }
    } catch (checkErr) {
      console.error('Error checking existing credential by hash:', checkErr);
      // proceed - not fatal for submission
    }

    // Create credential
    const credential = new Credential({
      user: user._id,
      title: credentialTitle,
      description: description || '',
      issuer: req.issuer.institute.name,
      type: credentialType,
      status: 'verified', // API submissions are considered verified by the issuer
      issuerVerification: {
        status: 'verified',
        verifiedAt: new Date(),
        verifiedBy: req.issuer._id
      },
      issueDate: issueDateObj,
      skills: Array.isArray(skills) ? skills : [],
      nsqfLevel: nsqfLevel || null,
      creditPoints: creditPoints || null,
      imageUrl: certificateUrl,
      credentialUrl: certificateUrl,
      credentialHash,
      blockchainAddress: blockchainId || null,
      transactionHash: verificationHash || null,
      metadata: {
        ...metadata,
        submittedViaApi: true,
        apiKeyId: req.apiKey._id,
        courseCode: courseCode || null,
        completionDate: completionDateObj,
        apiSubmissionTime: new Date()
      }
    });

    await credential.save();

    // Generate PDF preview if the certificate URL is a PDF (production-safe)
    try {
      const fileType = getFileType(certificateUrl);
      if (fileType === 'pdf') {
        console.log('🔄 Processing PDF for credential:', credential._id);
        
        // In production, we'll use a background job for PDF processing
        // For now, just set the PDF URL as imageUrl for frontend handling
        const previewUrl = await generatePdfPreview(certificateUrl, credential._id.toString());
        if (previewUrl) {
          credential.imageUrl = previewUrl;
          await credential.save();
          console.log('✅ PDF URL set for frontend handling:', previewUrl);
        }
      }
    } catch (previewError) {
      console.error('⚠️ PDF processing error (non-blocking):', previewError.message);
      // Continue processing - PDF preview is nice-to-have, not critical
    }

    // Log successful submission
    await ApiUsage.findOneAndUpdate(
      {
        apiKey: req.apiKey._id,
        endpoint: req.originalUrl,
        createdAt: { $gte: new Date(startTime) }
      },
      {
        $set: {
          credentialId: credential._id,
          responseTime: Date.now() - startTime
        }
      },
      { sort: { createdAt: -1 } }
    );

    // Log activity for issuer
    try {
      await ActivityTracker.logActivity({
        userId: req.issuer._id,
        userRole: 'institute',
        activityType: 'credential_issued',
        description: `Issued credential "${credentialTitle}" to ${studentEmail} via API`,
        metadata: {
          credentialTitle,
          studentEmail,
          studentName: user.fullName ? `${user.fullName.firstName} ${user.fullName.lastName}` : 'N/A',
          credentialType,
          nsqfLevel,
          skills: skills || [],
          apiSubmission: true,
          apiKeyName: req.apiKey.keyName,
          certificateUrl
        },
        relatedEntityType: 'credential',
        relatedEntityId: credential._id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (activityError) {
      console.error('Activity logging failed:', activityError.message);
      // Continue - activity logging failure shouldn't block the response
    }

    // Send webhook notification if configured
    if (req.apiKey.webhookUrl) {
      try {
        await axios.post(req.apiKey.webhookUrl, {
          event: 'credential.created',
          data: {
            credentialId: credential._id,
            studentEmail,
            credentialTitle,
            status: 'verified',
            submittedAt: new Date()
          }
        }, { timeout: 5000 });
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Credential submitted successfully',
      data: {
        credentialId: credential._id,
        studentId: user._id,
        credentialTitle,
        studentEmail,
        issuer: req.issuer.institute.name,
        status: 'verified',
        issueDate: issueDateObj,
        certificateUrl,
        credentialHash,
        submittedAt: credential.createdAt
      }
    });

  } catch (error) {
    console.error('Submit credential error:', error);
    
    // Log error
    if (req.apiKey) {
      await ApiUsage.findOneAndUpdate(
        {
          apiKey: req.apiKey._id,
          endpoint: req.originalUrl,
          createdAt: { $gte: new Date(startTime) }
        },
        {
          $set: {
            errorMessage: error.message,
            responseTime: Date.now() - startTime
          }
        },
        { sort: { createdAt: -1 } }
      );
    }

    res.status(500).json({
      success: false,
      error: 'SUBMISSION_ERROR',
      message: 'Failed to submit credential'
    });
  }
};

// Bulk submit credentials
const bulkSubmitCredentials = async (req, res) => {
  try {
    const { credentials } = req.body;

    if (!Array.isArray(credentials) || credentials.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Credentials array is required and must not be empty'
      });
    }

    if (credentials.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR',
        message: 'Maximum 100 credentials can be submitted at once'
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < credentials.length; i++) {
      try {
        req.body = credentials[i]; // Set current credential as request body
        const mockRes = {
          status: (code) => ({ json: (data) => ({ statusCode: code, data }) }),
          json: (data) => ({ statusCode: 200, data })
        };

        // Call submitCredential for each credential
        await new Promise((resolve, reject) => {
          const originalRes = res;
          req.res = mockRes;
          
          submitCredential(req, mockRes).then(result => {
            if (result.statusCode === 201) {
              results.push({
                index: i,
                success: true,
                credentialId: result.data.data.credentialId,
                studentEmail: credentials[i].studentEmail,
                credentialTitle: credentials[i].credentialTitle
              });
            } else {
              errors.push({
                index: i,
                error: result.data,
                studentEmail: credentials[i].studentEmail,
                credentialTitle: credentials[i].credentialTitle
              });
            }
            resolve();
          }).catch(reject);
        });

      } catch (error) {
        errors.push({
          index: i,
          error: {
            success: false,
            error: 'PROCESSING_ERROR',
            message: error.message
          },
          studentEmail: credentials[i]?.studentEmail,
          credentialTitle: credentials[i]?.credentialTitle
        });
      }
    }

    // Log bulk activity for issuer
    try {
      await ActivityTracker.logActivity({
        userId: req.issuer._id,
        userRole: 'institute',
        activityType: 'bulk_upload_completed',
        description: `Bulk issued ${results.length} credentials via API (${errors.length} failed)`,
        metadata: {
          totalSubmitted: credentials.length,
          successful: results.length,
          failed: errors.length,
          apiSubmission: true,
          apiKeyName: req.apiKey.keyName,
          successfulCredentials: results.map(r => ({
            credentialTitle: r.credentialTitle,
            studentEmail: r.studentEmail
          }))
        },
        relatedEntityType: 'none',
        relatedEntityId: null,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    } catch (activityError) {
      console.error('Bulk activity logging failed:', activityError.message);
      // Continue - activity logging failure shouldn't block the response
    }

    res.json({
      success: true,
      message: `Processed ${credentials.length} credentials`,
      data: {
        totalSubmitted: credentials.length,
        successful: results.length,
        failed: errors.length,
        results,
        errors
      }
    });

  } catch (error) {
    console.error('Bulk submit credentials error:', error);
    res.status(500).json({
      success: false,
      error: 'BULK_SUBMISSION_ERROR',
      message: 'Failed to process bulk submission'
    });
  }
};

// Get credential status
const getCredentialStatus = async (req, res) => {
  try {
    const { credentialId } = req.params;

    const credential = await Credential.findOne({
      _id: credentialId,
      issuer: { $regex: new RegExp(`^${req.issuer.institute.name}$`, 'i') }
    }).populate('user', 'email fullName').select('-__v');

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'CREDENTIAL_NOT_FOUND',
        message: 'Credential not found or you do not have permission to view it'
      });
    }

    res.json({
      success: true,
      data: {
        credentialId: credential._id,
        title: credential.title,
        description: credential.description,
        student: {
          email: credential.user.email,
          name: `${credential.user.fullName.firstName} ${credential.user.fullName.lastName}`
        },
        issuer: credential.issuer,
        status: credential.status,
        issuerVerification: credential.issuerVerification,
        issueDate: credential.issueDate,
        certificateUrl: credential.imageUrl,
        skills: credential.skills,
        nsqfLevel: credential.nsqfLevel,
        creditPoints: credential.creditPoints,
        credentialHash: credential.credentialHash,
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt
      }
    });

  } catch (error) {
    console.error('Get credential status error:', error);
    res.status(500).json({
      success: false,
      error: 'FETCH_ERROR',
      message: 'Failed to fetch credential status'
    });
  }
};

// Revoke credential
const revokeCredential = async (req, res) => {
  try {
    const { credentialId } = req.params;
    const { reason } = req.body;

    const credential = await Credential.findOne({
      _id: credentialId,
      issuer: { $regex: new RegExp(`^${req.issuer.institute.name}$`, 'i') }
    });

    if (!credential) {
      return res.status(404).json({
        success: false,
        error: 'CREDENTIAL_NOT_FOUND',
        message: 'Credential not found or you do not have permission to revoke it'
      });
    }

    credential.status = 'revoked';
    credential.issuerVerification.status = 'revoked';
    credential.metadata = {
      ...credential.metadata,
      revokedAt: new Date(),
      revokedBy: req.issuer._id,
      revocationReason: reason || 'Revoked via API'
    };

    await credential.save();

    res.json({
      success: true,
      message: 'Credential revoked successfully',
      data: {
        credentialId: credential._id,
        status: credential.status,
        revokedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Revoke credential error:', error);
    res.status(500).json({
      success: false,
      error: 'REVOCATION_ERROR',
      message: 'Failed to revoke credential'
    });
  }
};

module.exports = {
  submitCredential,
  bulkSubmitCredentials,
  getCredentialStatus,
  revokeCredential
};