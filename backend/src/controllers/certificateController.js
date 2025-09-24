const axios = require('axios');
const cheerio = require('cheerio');
const { uploadFile } = require('../services/storageService');
const { extractCredentialInfo, isExtractionServiceAvailable } = require('../services/extractionService');

function pickImageFromHtml($) {
  const og = $('meta[property="og:image"]').attr('content');
  const tw = $('meta[name="twitter:image"]').attr('content');
  let inline = null;
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (!inline && /certificate|accomplish|share|verify|coursera/i.test(src)) inline = src;
  });
  // JSON-LD image
  let jsonLdImage = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).contents().text().trim());
      const arr = Array.isArray(json) ? json : [json];
      for (const node of arr) {
        if (node && node.image) {
          jsonLdImage = typeof node.image === 'string' ? node.image : node.image.url;
          if (jsonLdImage) break;
        }
      }
    } catch {}
  });
  return jsonLdImage || og || tw || inline || null;
}

// POST /api/certificates/import-url
async function importCertificateFromUrl(req, res) {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, message: 'Certificate URL is required' });
    if (!/^https?:\/\/(www\.)?coursera\.org\/share\/[A-Za-z0-9]+/.test(url)) {
      return res.status(400).json({ success: false, message: 'Only Coursera certificate share URLs are supported currently' });
    }

    // Fetch share page
    const htmlResp = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 15000,
      maxRedirects: 3,
      validateStatus: s => s >= 200 && s < 400,
    });
    const $ = cheerio.load(htmlResp.data);
    const imgUrl = pickImageFromHtml($);
    if (!imgUrl) return res.status(422).json({ success: false, message: 'Could not locate certificate image on the page' });
    const resolvedImageUrl = new URL(imgUrl, url).toString();

    // Download image
    const imgResp = await axios.get(resolvedImageUrl, { responseType: 'arraybuffer', timeout: 20000 });
    const imgBuffer = Buffer.from(imgResp.data);

    // Upload to ImageKit (optional if configured)
    let uploaded = null;
    try {
      uploaded = await uploadFile(imgBuffer, `coursera_certificate_${Date.now()}.png`);
    } catch (e) {
      console.warn('Image upload skipped/failed:', e.message);
    }

    // OCR via extraction service with platform rules
    let ocr = { success: false, extracted: null, error: null };
    try {
      console.log('Checking OCR service availability...');
      const available = await isExtractionServiceAvailable();
      console.log('OCR service available:', available);
      if (available) {
        console.log('Calling OCR with platform: coursera');
        ocr = await extractCredentialInfo(imgBuffer, `coursera_${Date.now()}.png`, 'coursera');
        console.log('OCR result:', ocr);
      }
    } catch (e) {
      console.error('OCR extraction failed:', e);
      ocr = { success: false, extracted: null, error: e.message };
    }

    const e = ocr.extracted || {};
    const data = {
      platform: 'Coursera',
      originalUrl: url,
      storedImageUrl: uploaded?.url || null,
      title: e.title || '',
      issuer: e.issuer || '',
      completionDate: e.issueDate || null,
      credentialId: e.credentialId || '',
      description: e.description || '',
      ocrAvailable: !!ocr.success,
    };

    return res.json({ success: true, data, message: 'Certificate downloaded, uploaded and parsed' });
  } catch (err) {
    console.error('Certificate import error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to import certificate' });
  }
}

module.exports = { importCertificateFromUrl };
