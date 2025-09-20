const mongoose = require('mongoose');

const CredentialSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true },
    issuer: { type: String, required: true, trim: true },
    type: { type: String, enum: ['certificate', 'course', 'degree', 'license', 'badge'], required: true },
    status: { type: String, enum: ['verified', 'pending', 'expired'], default: 'pending' },
    issueDate: { type: Date, required: true },
    expiryDate: { type: Date },
    description: { type: String },
    skills: { type: [String], default: [] },
    credentialUrl: { type: String },
    imageUrl: { type: String },
    nsqfLevel: { type: Number },
    blockchainAddress: { type: String },
    transactionHash: { type: String },
    issuerLogo: { type: String },
    credentialId: { type: String },
    creditPoints: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Credential', CredentialSchema);
