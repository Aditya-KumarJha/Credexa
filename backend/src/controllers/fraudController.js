const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Download a remote image to a local temp path
async function downloadImage(url, destPath) {
  const writer = fs.createWriteStream(destPath);
  const response = await axios.get(url, { responseType: 'stream', timeout: 30000 });
  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    let error = null;
    writer.on('error', err => {
      error = err;
      writer.close();
      reject(err);
    });
    writer.on('close', () => {
      if (!error) resolve(destPath);
    });
  });
}

exports.runForensicsOnCredential = async (req, res) => {
  try {
    const { id } = req.params;
    const Credential = require('../models/credentialModel');
    const cred = await Credential.findOne({ _id: id, user: req.user._id });
    if (!cred) return res.status(404).json({ message: 'Credential not found' });

    const imageUrl = cred.imageUrl || cred.credentialUrl;
    if (!imageUrl) return res.status(400).json({ message: 'No image or URL available for this credential' });

    const tmpDir = path.join(process.cwd(), 'fraud_temp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const localImage = path.join(tmpDir, `cred_${id}${path.extname(imageUrl).split('?')[0]}`);

    // Download image
    await downloadImage(imageUrl, localImage);

    // Run the Python wrapper
    const pythonScript = path.join(process.cwd(), '..', '..', 'fraudCertificate', 'run_predict_single.py');
    // Adjust path: backend folder is e:/cdvk/Credexa/backend
    const fraudScript = path.resolve(process.cwd(), '..', '..', 'fraudCertificate', 'run_predict_single.py');

    execFile('python', [fraudScript, '--image', localImage], { cwd: path.join(process.cwd(), '..', '..', 'fraudCertificate') }, (err, stdout, stderr) => {
      if (err) {
        console.error('Forensics script error:', err, stderr);
        return res.status(500).json({ message: 'Forensics failed', details: stderr || err.message });
      }
      const outPath = stdout.trim();
      if (!fs.existsSync(outPath)) {
        return res.status(500).json({ message: 'Forensics output missing' });
      }
      // Read output and return base64
      const outData = fs.readFileSync(outPath);
      const base64 = outData.toString('base64');
      // Clean up temp files
      try { fs.unlinkSync(localImage); } catch(e){}
      try { fs.unlinkSync(outPath); } catch(e){}
      return res.json({ imageBase64: base64 });
    });
  } catch (error) {
    console.error('runForensicsOnCredential error:', error);
    res.status(500).json({ message: 'Internal server error', details: error.message });
  }
};
