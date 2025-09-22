const Credential = require('../models/credentialModel');
const uploadFile = require('../services/storageService');
// 1. IMPORT YOUR NEW BLOCKCHAIN SERVICE
const { anchorNewCredential, verifyCredential } = require('../services/blockchainService');
const crypto = require('crypto'); // <-- ADD THIS LINE
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
    const payload = {
      user: req.user._id,
      title: body.title,
      issuer: body.issuer,
      type: body.type,
      status: body.status || 'pending',
      issueDate: body.issueDate,
      expiryDate: body.expiryDate || undefined,
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
      payload.imageUrl = body.imageUrl;
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
      'title','issuer','type','status','issueDate','expiryDate','description','credentialUrl','nsqfLevel','blockchainAddress','transactionHash','issuerLogo','credentialId','creditPoints'
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
    const { id } = req.params;
    const deleted = await Credential.findOneAndDelete({ _id: id, user: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Credential not found' });
    res.json({ message: 'Credential deleted' });
  } catch (err) {
    console.error('Delete Credential Error:', err);
    res.status(500).json({ message: 'Failed to delete credential' });
  }
};


// --- NEW BLOCKCHAIN FUNCTIONS ---

const anchorCredentialController = async (req, res) => {
    try {
        const { hash } = req.body;
        if (!hash || !hash.startsWith('0x') || hash.length !== 66) {
            return res.status(400).json({ error: 'A valid 32-byte hash (0x...) is required.' });
        }

        const receipt = await anchorNewCredential(hash);
        res.status(201).json({ message: 'Credential anchored successfully!', transactionHash: receipt.hash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to anchor credential.', details: error.message });
    }
};

const verifyCredentialController = async (req, res) => {
    try {
        const { hash } = req.params;
        const credentialData = await verifyCredential(hash);

        if (!credentialData) {
            return res.status(404).json({ error: 'Credential not found on the blockchain.' });
        }
        
        const responseData = {
            issuer: credentialData.issuer,
            timestamp: Number(credentialData.timestamp)
        };
        
        res.status(200).json(responseData);
    } catch (error) {
        console.error(error);
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
        const dataToHash = cred._id.toString() + cred.issuer + cred.issueDate.toISOString();

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
  extractCertificateInfo,
};