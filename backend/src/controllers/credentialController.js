const Credential = require('../models/credentialModel');
const uploadFile = require('../services/storageService');

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

module.exports = {
  listCredentials,
  createCredential,
  updateCredential,
  deleteCredential,
};
 