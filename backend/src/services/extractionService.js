const FormData = require('form-data');
const axios = require('axios');

// Configuration for the Flask extraction API
const EXTRACTION_API_URL = process.env.EXTRACTION_API_URL || 'http://localhost:5001';

/**
 * Extract credential information from certificate image using Flask OCR service
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} filename - Original filename
 * @param {string} platform - Platform hint for extraction rules (optional)
 * @returns {Promise<Object>} Extracted credential data
 */
async function extractCredentialInfo(fileBuffer, filename, platform) {
  try {
    // Create form data for the Flask API
    const formData = new FormData();
    formData.append('certificateFile', fileBuffer, {
      filename: filename,
      contentType: 'image/jpeg' // Default, Flask should handle various image types
    });
    
    // Add platform hint if provided
    if (platform) {
      formData.append('platform', platform);
    }

    // Call the Flask extraction API
    const response = await axios.post(`${EXTRACTION_API_URL}/extract`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000, // 30 second timeout for OCR processing
    });

    const extractedData = response.data;

    // Validate extracted data structure
    if (!extractedData || typeof extractedData !== 'object') {
      throw new Error('Invalid response from extraction service');
    }

    // Check if extraction was successful
    if (!extractedData.success) {
      throw new Error(extractedData.message || 'Extraction failed');
    }

    // Get the actual extracted fields from the nested object
    const extracted = extractedData.extracted || {};

    // Return standardized extracted data
    return {
      success: true,
      extracted: {
        title: extracted.title || '',
        issuer: extracted.issuer || '',
        issueDate: extracted.issueDate || '',
        name: extracted.name || '', // Student name for verification
        type: extracted.type || 'certificate', // Use extracted type or default
        status: extracted.status || 'pending', // Use extracted status or default
      }
    };

  } catch (error) {
    console.error('Certificate extraction error:', error.message);
    
    // Handle different error types
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'Extraction service is not available. Please try again later.',
        extracted: null
      };
    }

    if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Invalid image file. Please upload a clear certificate image.',
        extracted: null
      };
    }

    return {
      success: false,
      error: 'Failed to extract certificate information. Please fill the form manually.',
      extracted: null
    };
  }
}

/**
 * Check if extraction service is available
 * @returns {Promise<boolean>} Service availability status
 */
async function isExtractionServiceAvailable() {
  try {
    const response = await axios.get(`${EXTRACTION_API_URL}/`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.warn('Extraction service health check failed:', error.message);
    return false;
  }
}

module.exports = {
  extractCredentialInfo,
  isExtractionServiceAvailable
};