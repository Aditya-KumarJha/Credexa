const crypto = require('crypto');
const Credential = require('../models/credentialModel');
const { anchorNewCredential, verifyCredential } = require('../services/blockchainService');
const { uploadFile, deleteFile } = require('../services/storageService');
const { extractCredentialInfo } = require('../services/extractionService');


// --- EXISTING DATABASE FUNCTIONS (UNCHANGED) ---

const listCredentials = async (req, res) => {
  try {
    const items = await Credential.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    console.error('List Credentials Error:', err);
    res.status(500).json({ message: 'Failed to fetch credentials' });
  }
};

const createCredential = async (req, res) => {
  try {
    const body = req.body;
    console.log('Creating credential with body keys:', Object.keys(body));
    
    if (!body.title) {
      return res.status(400).json({
        success: false,
        message: 'Title is required'
      });
    }
    
    const payload = {
      user: req.user._id,
      title: body.title,
      issuer: body.issuer,
      type: body.type,
      status: body.status || 'pending',
      issueDate: body.issueDate,
      description: body.description || '',
      skills: Array.isArray(body.skills)
        ? body.skills
        : typeof body.skills === 'string' && body.skills.trim()
          ? body.skills.split(',').map((s) => s.trim())
          : [],
      credentialUrl: body.credentialUrl || '',
      nsqfLevel: body.nsqfLevel ? Number(body.nsqfLevel) : undefined,
      blockchainAddress: body.blockchainAddress || '',
      transactionHash: body.transactionHash || '',
      issuerLogo: body.issuerLogo || '',
      credentialId: body.credentialId || '',
      creditPoints: body.creditPoints ? Number(body.creditPoints) : undefined,
    };

    if (req.file) {
      const uploaded = await uploadFile(req.file.buffer, `credential_${Date.now()}`);
      payload.imageUrl = uploaded.url;
    } else if (body.imageUrl) {
      // Handle imageUrl - it might be an array from frontend, so take the first value
      payload.imageUrl = Array.isArray(body.imageUrl) ? body.imageUrl[0] : body.imageUrl;
    }

    const created = await Credential.create(payload);
    res.status(201).json(created);
  } catch (err) {
    console.error('Create Credential Error:', err);
    res.status(500).json({ message: 'Failed to create credential' });
  }
};

const updateCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const cred = await Credential.findOne({ _id: id, user: req.user._id });
    if (!cred) return res.status(404).json({ message: 'Credential not found' });

    const body = req.body;
    const fields = [
      'title','issuer','type','status','issueDate','description','credentialUrl','nsqfLevel','blockchainAddress','transactionHash','issuerLogo','credentialId','creditPoints'
    ];
    fields.forEach((f) => {
      if (body[f] !== undefined) cred[f] = body[f];
    });
    if (body.skills !== undefined) {
      cred.skills = Array.isArray(body.skills) ? body.skills : String(body.skills).split(',').map((s) => s.trim());
    }

    if (req.file) {
      const uploaded = await uploadFile(req.file.buffer, `credential_${id}_${Date.now()}`);
      cred.imageUrl = uploaded.url;
    }

    const saved = await cred.save();
    res.json(saved);
  } catch (err) {
    console.error('Update Credential Error:', err);
    res.status(500).json({ message: 'Failed to update credential' });
  }
};

const deleteCredential = async (req, res) => {
  try {
    console.log('DELETE CREDENTIAL REQUEST RECEIVED for ID:', req.params.id);
    const { id } = req.params;
    
    // First, get the credential to access the imageUrl
    const credential = await Credential.findOne({ _id: id, user: req.user._id });
    if (!credential) return res.status(404).json({ message: 'Credential not found' });
    
    console.log('Found credential to delete:', {
      id: credential._id,
      title: credential.title,
      imageUrl: credential.imageUrl
    });
    
    // Delete the image from ImageKit if it exists
    if (credential.imageUrl) {
      console.log('Deleting image from ImageKit:', credential.imageUrl);
      await deleteFile(credential.imageUrl);
    } else {
      console.log('No image URL found for this credential');
    }
    
    // Delete the credential from database
    await Credential.findOneAndDelete({ _id: id, user: req.user._id });
    console.log('Credential deleted from database successfully');
    
    res.json({ message: 'Credential and associated image deleted successfully' });
  } catch (err) {
    console.error('Delete Credential Error:', err);
    res.status(500).json({ message: 'Failed to delete credential' });
  }
};


// --- NEW BLOCKCHAIN FUNCTIONS ---

/**
 * Generates a hash for a credential, anchors it on the blockchain,
 * and saves both the credentialHash and transactionHash to the database.
 */
const anchorCredentialController = async (req, res) => {
  try {
    // The credential's database ID is now taken from the URL parameters
    const { id } = req.params; 

    // 1. Find the credential in the database first
    const cred = await Credential.findOne({ _id: id, user: req.user._id });

    if (!cred) {
      return res.status(404).json({ message: 'Credential not found' });
    }
    if (cred.transactionHash) {
      return res.status(400).json({ message: 'This credential has already been anchored.' });
    }

    // 2. Generate the unique, deterministic hash on the backend
    const issueDateISO = new Date(cred.issueDate).toISOString();
    const dataToHash = cred._id.toString() + cred.issuer + issueDateISO;
    const credentialHash = '0x' + crypto.createHash('sha256').update(dataToHash).digest('hex');

    // 3. Call the blockchain service to anchor the generated hash
    const receipt = await anchorNewCredential(credentialHash);

    // 4. Save BOTH the credential hash and the transaction hash to the database
    cred.credentialHash = credentialHash;   // The key used to look up data in the contract
    cred.transactionHash = receipt.hash;    // The proof that the anchoring transaction occurred
    
    const updatedCredential = await cred.save();

    // 5. Send the fully updated credential object back to the frontend
    res.status(200).json(updatedCredential);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to anchor credential.', details: error.message });
  }
};

const verifyCredentialController = async (req, res) => {
    try {
        const { hash } = req.params;
        console.log('Verifying credential hash:', hash);
        
        // First, find the credential in the database to get full details
        let credential = null;
        let user = null;
        
        try {
            credential = await Credential.findOne({ credentialHash: hash }).populate('user', 'fullName email profilePic institute');
            if (credential) {
                user = credential.user;
                console.log('Found credential in database:', credential.title);
            }
        } catch (dbError) {
            console.log('Database lookup failed:', dbError.message);
        }

        // Try to verify on blockchain
        let blockchainData = null;
        try {
            const credentialData = await verifyCredential(hash);
            if (credentialData && credentialData.timestamp !== 0n) {
                blockchainData = {
                    issuer: credentialData.issuer,
                    timestamp: Number(credentialData.timestamp),
                    verified: true
                };
                console.log('Blockchain verification successful');
            }
        } catch (blockchainError) {
            console.log('Blockchain verification failed:', blockchainError.message);
        }

        // If we have credential data, return comprehensive information
        if (credential) {
            const responseData = {
                // Blockchain verification status
                verified: !!blockchainData,
                blockchain: blockchainData || {
                    verified: false,
                    timestamp: Math.floor(new Date(credential.issueDate).getTime() / 1000),
                    source: 'database'
                },
                
                // Credential details
                credential: {
                    id: credential._id,
                    title: credential.title,
                    issuer: credential.issuer,
                    type: credential.type,
                    status: credential.status,
                    issueDate: credential.issueDate,
                    description: credential.description,
                    skills: credential.skills,
                    nsqfLevel: credential.nsqfLevel,
                    creditPoints: credential.creditPoints,
                    credentialId: credential.credentialId,
                    imageUrl: credential.imageUrl,
                    issuerLogo: credential.issuerLogo,
                    transactionHash: credential.transactionHash
                },
                
                // User details (only public information)
                user: user ? {
                    fullName: user.fullName,
                    firstName: user.fullName?.firstName,
                    lastName: user.fullName?.lastName,
                    profilePic: user.profilePic,
                    institute: user.institute ? {
                        name: user.institute.name,
                        state: user.institute.state,
                        district: user.institute.district,
                        university_name: user.institute.university_name
                    } : null
                } : null,
                
                // Verification metadata
                verifiedAt: new Date().toISOString(),
                credentialHash: hash
            };
            
            return res.status(200).json(responseData);
        }

        // If neither blockchain nor database has the credential
        console.log('Credential not found in blockchain or database');
        return res.status(404).json({ 
            error: 'Credential not found on the blockchain.',
            details: 'This credential may not have been properly anchored or the hash may be incorrect.'
        });
        
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ error: 'Failed to verify credential.', details: error.message });
    }
};

const generateCredentialHashController = async (req, res) => {
    try {
        const { id } = req.params;
        // Find the credential ensuring it belongs to the logged-in user
        const cred = await Credential.findOne({ _id: id, user: req.user._id });

        if (!cred) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        // Create a deterministic string from unique credential data
        const issueDateISO = new Date(cred.issueDate).toISOString();
        const dataToHash = cred._id.toString() + cred.issuer + issueDateISO;

        // Create a SHA-256 hash
        const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');

        // Prepend '0x' to make it a valid bytes32 hex string for the blockchain
        const finalHash = '0x' + hash;

        // Optionally, you could save this hash to your database here
        // cred.blockchainHash = finalHash;
        // await cred.save();

        res.status(200).json({ hash: finalHash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to generate credential hash.' });
    }
};

const getCredentialDetails = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('Requested credential ID:', id);
        console.log('Authenticated user ID:', req.user._id);

        // Check if req.user is set
        if (!req.user || !req.user._id) {
            console.log('User not authenticated or req.user missing');
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Find the credential ensuring it belongs to the logged-in user
        const cred = await Credential.findOne({ _id: id, user: req.user._id });
        console.log('Credential found:', cred);

        if (!cred) {
            return res.status(404).json({ message: 'Credential not found' });
        }

        // If the credential has been anchored, also get blockchain verification data
        let blockchainData = null;
        if (cred.credentialHash) {
            try {
                const verificationData = await verifyCredential(cred.credentialHash);
                if (verificationData) {
                    blockchainData = {
                        issuer: verificationData.issuer,
                        timestamp: Number(verificationData.timestamp),
                        timestampDate: new Date(Number(verificationData.timestamp) * 1000).toISOString(),
                        verified: true
                    };
                }
            } catch (verifyError) {
                console.error('Error verifying credential on blockchain:', verifyError);
                blockchainData = { verified: false, error: 'Failed to verify on blockchain' };
            }
        }

        // Return detailed credential information
        const response = {
            credential: cred,
            blockchain: blockchainData,
            anchored: !!cred.transactionHash,
            verificationUrl: cred.credentialHash ? `${req.protocol}://${req.get('host')}/api/credentials/verify/${cred.credentialHash}` : null
        };

        res.status(200).json(response);
    } catch (error) {
        console.error('Get Credential Details Error:', error);
        res.status(500).json({ error: 'Failed to get credential details.', details: error.message });
    }
};

// Certificate Information Extraction Function
const extractCertificateInfo = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No certificate file uploaded'
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload an image file (JPEG, PNG, GIF, BMP, WebP)'
      });
    }

    // Extract credential information using the extraction service
    const extractionResult = await extractCredentialInfo(req.file.buffer, req.file.originalname);

    res.json(extractionResult);
  } catch (error) {
    console.error('Extraction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extract certificate information',
      error: error.message
    });
  }
};

// --- 2. UPDATE MODULE EXPORTS ---

module.exports = {
  listCredentials,
  createCredential,
  updateCredential,
  deleteCredential,
  anchorCredentialController, 
  verifyCredentialController, 
  generateCredentialHashController,
  getCredentialDetails,
  extractCertificateInfo,
};
