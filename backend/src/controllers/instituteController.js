const User = require('../models/userModel');
const fs = require('fs').promises;
const path = require('path');

// Load colleges data
let collegesData = [];

const loadCollegesData = async () => {
  try {
    if (collegesData.length === 0) {
      const filePath = path.join(__dirname, '../..', 'indian_colleges.json');
      const data = await fs.readFile(filePath, 'utf8');
      collegesData = JSON.parse(data);
    }
    return collegesData;
  } catch (error) {
    console.error('Error loading colleges data:', error);
    return [];
  }
};

// Search colleges with autocomplete
const searchColleges = async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const colleges = await loadCollegesData();
    const searchTerm = query.toLowerCase();

    // Search in name field (case-insensitive)
    const filteredColleges = colleges
      .filter(college => 
        college.name && 
        college.name.toLowerCase().includes(searchTerm)
      )
      .slice(0, parseInt(limit))
      .map(college => ({
        aishe_code: college.aishe_code,
        name: college.name,
        state: college.state,
        district: college.district,
        university_name: college.university_name,
        displayName: `${college.name}, ${college.district || college.state}` // For UI display
      }));

    res.json(filteredColleges);
  } catch (error) {
    console.error('Error searching colleges:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error searching colleges' 
    });
  }
};

// Validate college exists in database
const validateCollege = async (aishe_code) => {
  const colleges = await loadCollegesData();
  return colleges.find(college => college.aishe_code === aishe_code);
};

// Update user institute
const updateUserInstitute = async (req, res) => {
  try {
    const userId = req.user.id;
    const { aishe_code, name, state, district, university_name } = req.body;

    // Validation
    if (!aishe_code || !name || !state || !district) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: aishe_code, name, state, district'
      });
    }

    // Validate against colleges database
    const validCollege = await validateCollege(aishe_code);
    if (!validCollege) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid institute from the dropdown'
      });
    }

    // Update user institute
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          institute: {
            aishe_code,
            name,
            state,
            district,
            university_name: university_name || validCollege.university_name,
            addedAt: new Date(),
            isVerified: true // Verified because it's from our database
          }
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Institute updated successfully',
      institute: user.institute
    });

  } catch (error) {
    console.error('Error updating user institute:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating institute information'
    });
  }
};

// Get user institute
const getUserInstitute = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId).select('institute');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      institute: user.institute || null
    });

  } catch (error) {
    console.error('Error fetching user institute:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching institute information'
    });
  }
};

// Add manual institute (pending admin approval)
const addManualInstitute = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, state, district, university_name, reason } = req.body;

    // Validation
    if (!name || !state || !district) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, state, district'
      });
    }

    // Generate temporary AISHE code for manual entries
    const tempAisheCode = `MANUAL-${Date.now()}-${userId.toString().substring(0, 6)}`;

    // Update user institute with manual entry (unverified)
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          institute: {
            aishe_code: tempAisheCode,
            name,
            state,
            district,
            university_name: university_name || 'Not specified',
            addedAt: new Date(),
            isVerified: false, // Manual entry pending approval
            submissionReason: reason || 'Institute not found in database'
          }
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // TODO: Send notification to admin for approval
    console.log(`Manual institute submission from user ${userId}:`, {
      name, state, district, university_name, reason
    });

    res.json({
      success: true,
      message: 'Institute submission received. It will be reviewed by our team within 2-3 business days.',
      institute: user.institute
    });

  } catch (error) {
    console.error('Error adding manual institute:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting institute information'
    });
  }
};

module.exports = {
  searchColleges,
  updateUserInstitute,
  getUserInstitute,
  addManualInstitute
};