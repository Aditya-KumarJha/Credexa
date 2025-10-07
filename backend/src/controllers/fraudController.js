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
    // First try to find the credential by id
    const cred = await Credential.findById(id);
    if (!cred) {
      console.log(`Forensics: credential ${id} not found in DB`);
      return res.status(404).json({ message: 'Credential not found' });
    }

    // Check authorization: allow credential owner OR institute users to run forensics
    const ownerId = cred.user ? String(cred.user) : null;
    const requesterId = req.user ? String(req.user._id) : null;
    const requesterRole = req.user ? req.user.role : null;
    
    console.log(`Forensics: credential owner=${ownerId}, requester=${requesterId}, requester role=${requesterRole}`);
    
    const isOwner = requesterId && ownerId === requesterId;
    const isInstitute = requesterRole === 'institute';
    
    if (!requesterId || (!isOwner && !isInstitute)) {
      // Return 403 to indicate the credential exists but user is not authorized
      const message = requesterRole ? 
        `Only credential owners and institutes can run forensics. Your role: ${requesterRole}` :
        'Not authorized to access this credential';
      return res.status(403).json({ message });
    }
    
    console.log(`Forensics: Access granted - isOwner: ${isOwner}, isInstitute: ${isInstitute}`);

    const imageUrl = cred.imageUrl || cred.credentialUrl;
    if (!imageUrl) return res.status(400).json({ message: 'No image or URL available for this credential' });

    const tmpDir = path.join(process.cwd(), 'fraud_temp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    // Extract extension from URL, handling query parameters
    const urlPath = new URL(imageUrl).pathname;
    const ext = path.extname(urlPath) || '.jpg'; // Default to .jpg if no extension
    const localImage = path.join(tmpDir, `cred_${id}${ext}`);

    // Download image
    await downloadImage(imageUrl, localImage);

    // Run the enhanced Python wrapper that returns metrics
    // Backend is at e:/cdvk/Credexa/backend, fraudCertificate is at e:/cdvk/fraudCertificate
    const fraudScript = path.resolve(process.cwd(), '..', '..', 'fraudCertificate', 'run_predict_with_metrics.py');
    const fraudCwd = path.resolve(process.cwd(), '..', '..', 'fraudCertificate');

    console.log('Forensics: Running enhanced Python script at:', fraudScript);
    console.log('Forensics: Working directory:', fraudCwd);
    console.log('Forensics: Input image:', localImage);

    execFile('python', [fraudScript, '--image', localImage], { cwd: fraudCwd }, (err, stdout, stderr) => {
      if (err) {
        console.error('Forensics script error:', err, stderr);
        return res.status(500).json({ message: 'Forensics failed', details: stderr || err.message });
      }
      // Parse JSON response from enhanced Python script
      const lines = stdout.trim().split('\n');
      const jsonLine = lines[lines.length - 1].trim();
      console.log('Forensics: Python script output:', jsonLine);
      
      let resultData;
      try {
        resultData = JSON.parse(jsonLine);
      } catch (parseErr) {
        console.error('Forensics: Failed to parse JSON output:', parseErr);
        return res.status(500).json({ message: 'Invalid forensics output format' });
      }
      
      const outPath = resultData.output_image;
      if (!fs.existsSync(outPath)) {
        console.log('Forensics: Output file not found at:', outPath);
        return res.status(500).json({ message: 'Forensics output missing' });
      }
      
      // Read output image and return base64 along with metrics
      const outData = fs.readFileSync(outPath);
      const base64 = outData.toString('base64');
      
      // Clean up temp files
      try { fs.unlinkSync(localImage); } catch(e){}
      try { fs.unlinkSync(outPath); } catch(e){}
      if (resultData.results_file && fs.existsSync(resultData.results_file)) {
        try { fs.unlinkSync(resultData.results_file); } catch(e){}
      }
      
      return res.json({ 
        imageBase64: base64,
        metrics: resultData.metrics || null,
        analysis: {
          fraudPercentage: resultData.metrics?.fraud_percentage || 0,
          authenticityScore: resultData.metrics?.authenticity_score || 100,
          confidence: resultData.metrics?.confidence || 95,
          classification: resultData.metrics?.classification || 'AUTHENTIC',
          tamperedPixels: resultData.metrics?.tampered_pixels || 0,
          totalPixels: resultData.metrics?.total_pixels || 0
        }
      });
    });
  } catch (error) {
    console.error('runForensicsOnCredential error:', error);
    res.status(500).json({ message: 'Internal server error', details: error.message });
  }
};
