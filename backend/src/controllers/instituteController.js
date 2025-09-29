const User = require('../models/userModel');
const Credential = require('../models/credentialModel');
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

// Dashboard Stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const instituteCode = user.institute.aishe_code;

    // Get students count (users with same institute)
    const studentsCount = await User.countDocuments({
      'institute.aishe_code': instituteCode,
      role: 'learner'
    });

    // Get credentials issued count
    const credentialsCount = await Credential.countDocuments({
      issuer: user.institute.name
    });

    // Get current month stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const credentialsThisMonth = await Credential.countDocuments({
      issuer: user.institute.name,
      createdAt: { $gte: currentMonth }
    });

    const studentsThisMonth = await User.countDocuments({
      'institute.aishe_code': instituteCode,
      role: 'learner',
      createdAt: { $gte: currentMonth }
    });

    res.json({
      success: true,
      stats: {
        totalStudents: studentsCount,
        studentsChange: `+${studentsThisMonth} this month`,
        credentialsIssued: credentialsCount,
        credentialsChange: `+${credentialsThisMonth} this month`,
        activeCourses: 12, // Mock data - implement course model if needed
        coursesChange: "+2 new courses",
        nsqfCompliance: "98.5%",
        complianceChange: "+2.3% improvement"
      }
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics'
    });
  }
};

// Get Students
const getStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const { page = 1, limit = 10, search = '', course = '', status = '' } = req.query;

    const instituteCode = user.institute.aishe_code;
    
    // Build query
    const query = {
      'institute.aishe_code': instituteCode,
      role: 'learner'
    };

    if (search) {
      query.$or = [
        { 'fullName.firstName': { $regex: search, $options: 'i' } },
        { 'fullName.lastName': { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await User.find(query)
      .select('fullName email profilePic createdAt isVerified')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    // Get credentials count for each student
    const studentsWithCreds = await Promise.all(
      students.map(async (student) => {
        const credentialsCount = await Credential.countDocuments({
          user: student._id
        });
        return {
          ...student.toObject(),
          credentialsCount
        };
      })
    );

    res.json({
      success: true,
      students: studentsWithCreds,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching students'
    });
  }
};

// Get Credentials
const getCredentials = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const { page = 1, limit = 10, search = '', type = '', status = '' } = req.query;

    // Build query for credentials issued by this institute
    const query = {
      issuer: user.institute.name
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (type) query.type = type;
    if (status) query.status = status;

    const credentials = await Credential.find(query)
      .populate('user', 'fullName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Credential.countDocuments(query);

    res.json({
      success: true,
      credentials,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });

  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching credentials'
    });
  }
};

// Issue Credential
const issueCredential = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const {
      studentId,
      title,
      type,
      description,
      skills,
      issueDate,
      nsqfLevel,
      creditPoints
    } = req.body;

    // Validate required fields
    if (!studentId || !title || !type || !issueDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const Credential = require('../models/credentialModel');
    const newCredential = new Credential({
      user: studentId,
      title,
      issuer: user.institute.name,
      type,
      description,
      skills: skills || [],
      issueDate: new Date(issueDate),
      nsqfLevel,
      creditPoints,
      status: 'verified', // Institute-issued credentials are automatically verified
      issuerLogo: '', // Add institute logo if available
    });

    await newCredential.save();

    res.status(201).json({
      success: true,
      message: 'Credential issued successfully',
      credential: newCredential
    });

  } catch (error) {
    console.error('Error issuing credential:', error);
    res.status(500).json({
      success: false,
      message: 'Error issuing credential'
    });
  }
};

// Get Courses (Mock implementation - implement Course model if needed)
const getCourses = async (req, res) => {
  try {
    // Mock data for now
    const courses = [
      {
        _id: '1',
        title: 'Data Science Fundamentals',
        code: 'DS101',
        description: 'Introduction to data science concepts',
        credits: 4,
        duration: '12 weeks',
        status: 'active',
        studentsEnrolled: 45,
        nsqfLevel: 5,
        createdAt: new Date('2024-01-15')
      },
      {
        _id: '2',
        title: 'Web Development Bootcamp',
        code: 'WD201',
        description: 'Full-stack web development course',
        credits: 6,
        duration: '16 weeks',
        status: 'active',
        studentsEnrolled: 32,
        nsqfLevel: 4,
        createdAt: new Date('2024-02-01')
      }
    ];

    res.json({
      success: true,
      courses,
      total: courses.length
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching courses'
    });
  }
};

// Add Course (Mock implementation)
const addCourse = async (req, res) => {
  try {
    const { title, code, description, credits, duration, nsqfLevel } = req.body;

    if (!title || !code) {
      return res.status(400).json({
        success: false,
        message: 'Title and code are required'
      });
    }

    // Mock response
    const newCourse = {
      _id: Date.now().toString(),
      title,
      code,
      description,
      credits,
      duration,
      nsqfLevel,
      status: 'active',
      studentsEnrolled: 0,
      createdAt: new Date()
    };

    res.status(201).json({
      success: true,
      message: 'Course added successfully',
      course: newCourse
    });

  } catch (error) {
    console.error('Error adding course:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding course'
    });
  }
};

// Update Course (Mock implementation)
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    res.json({
      success: true,
      message: 'Course updated successfully',
      course: { _id: id, ...updateData }
    });

  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating course'
    });
  }
};

// Delete Course (Mock implementation)
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting course'
    });
  }
};

// Get Analytics
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    const instituteCode = user.institute.aishe_code;
    const instituteName = user.institute.name;

    // Get overview stats
    const totalStudents = await User.countDocuments({
      'institute.aishe_code': instituteCode,
      role: 'learner'
    });

    const activeStudents = await User.countDocuments({
      'institute.aishe_code': instituteCode,
      role: 'learner',
      lastActive: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Active in last 30 days
    });

    // Get credentials for users from this institute (using AISHE code)
    const instituteUsers = await User.find({
      'institute.aishe_code': instituteCode,
      role: 'learner'
    }).select('_id');
    
    const instituteUserIds = instituteUsers.map(user => user._id);
    console.log('Institute AISHE Code:', instituteCode);
    console.log('Institute users found:', instituteUserIds.length);

    const credentialsIssued = await Credential.countDocuments({
      user: { $in: instituteUserIds }
    });

    // Calculate graduated students (students with at least 1 credential)
    const studentsWithCredentials = await Credential.distinct('user', {
      user: { $in: instituteUserIds }
    });
    const graduatedStudents = studentsWithCredentials.length;

    // Get monthly growth data for the last 6 months
    const monthlyGrowth = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      const studentsInMonth = await User.countDocuments({
        'institute.aishe_code': instituteCode,
        role: 'learner',
        createdAt: { $gte: startDate, $lte: endDate }
      });

      const credentialsInMonth = await Credential.countDocuments({
        user: { $in: instituteUserIds },
        createdAt: { $gte: startDate, $lte: endDate }
      });

      monthlyGrowth.push({
        month: monthNames[month],
        students: studentsInMonth,
        credentials: credentialsInMonth
      });
    }

    // Get all credentials for institute users  
    const allCredentials = await Credential.find({ user: { $in: instituteUserIds } });
    console.log('Total credentials found for institute users:', allCredentials.length);
    console.log('Sample credentials:', allCredentials.slice(0, 3).map(cred => ({
      title: cred.title,
      issuer: cred.issuer,
      skills: cred.skills,
      nsqfLevel: cred.nsqfLevel,
      type: cred.type
    })));

    // Get skills distribution from credentials of institute users
    const skillsAggregation = await Credential.aggregate([
      { $match: { user: { $in: instituteUserIds } } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { skill: '$_id', count: 1, _id: 0 } }
    ]);

    console.log('Skills aggregation result:', skillsAggregation);

    // Get NSQF levels distribution from credentials of institute users
    const nsqfLevelsAggregation = await Credential.aggregate([
      { $match: { user: { $in: instituteUserIds }, nsqfLevel: { $exists: true, $ne: null } } },
      { $group: { _id: '$nsqfLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { level: { $concat: ['Level ', { $toString: '$_id' }] }, count: 1, _id: 0 } }
    ]);

    console.log('NSQF levels aggregation result:', nsqfLevelsAggregation);

    const analytics = {
      overview: {
        totalStudents,
        activeStudents,
        graduatedStudents,
        credentialsIssued
      },
      monthlyGrowth,
      skillsDistribution: skillsAggregation,
      nsqfLevels: nsqfLevelsAggregation
    };

    res.json({
      success: true,
      analytics
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
};

// Get Compliance Report
const getComplianceReport = async (req, res) => {
  try {
    // Mock compliance data
    const compliance = {
      overallScore: 98.5,
      lastUpdated: new Date(),
      categories: [
        {
          name: 'NSQF Alignment',
          score: 99.2,
          status: 'excellent',
          description: 'All courses properly mapped to NSQF levels'
        },
        {
          name: 'Digital Verification',
          score: 98.8,
          status: 'excellent',
          description: 'All credentials digitally verified and blockchain anchored'
        },
        {
          name: 'Student Progress Tracking',
          score: 97.1,
          status: 'good',
          description: 'Comprehensive tracking of student skill development'
        },
        {
          name: 'Regulatory Reporting',
          score: 99.0,
          status: 'excellent',
          description: 'Automated reports submitted to NCVET and other bodies'
        }
      ],
      recentAudits: [
        {
          date: new Date('2024-11-15'),
          type: 'NCVET Compliance',
          status: 'passed',
          score: 98.5
        },
        {
          date: new Date('2024-10-20'),
          type: 'Quality Assessment',
          status: 'passed',
          score: 97.8
        }
      ]
    };

    res.json({
      success: true,
      compliance
    });

  } catch (error) {
    console.error('Error fetching compliance report:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching compliance report'
    });
  }
};

// Get Recent Activities
const getRecentActivities = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('institute');
    
    if (!user || !user.institute) {
      return res.status(400).json({
        success: false,
        message: 'Institute information not found'
      });
    }

    // Get recent credentials issued
    const Credential = require('../models/credentialModel');
    const recentCredentials = await Credential.find({
      issuer: user.institute.name
    })
    .populate('user', 'fullName')
    .sort({ createdAt: -1 })
    .limit(10);

    // Format activities
    const activities = recentCredentials.map(cred => ({
      action: `${cred.type} "${cred.title}" issued to ${cred.user.fullName.firstName} ${cred.user.fullName.lastName}`,
      time: formatTimeAgo(cred.createdAt),
      type: 'issuance'
    }));

    // Add mock activities
    const mockActivities = [
      {
        action: "New course 'AI Fundamentals' approved",
        time: "3 hours ago",
        type: "course"
      },
      {
        action: "NSQF compliance report submitted",
        time: "1 day ago",
        type: "compliance"
      }
    ];

    const allActivities = [...activities, ...mockActivities].slice(0, 10);

    res.json({
      success: true,
      activities: allActivities
    });

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities'
    });
  }
};

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 60) {
    return `${diffInMins} minutes ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} hours ago`;
  } else {
    return `${diffInDays} days ago`;
  }
};

module.exports = {
  searchColleges,
  updateUserInstitute,
  getUserInstitute,
  addManualInstitute,
  getDashboardStats,
  getStudents,
  getCredentials,
  issueCredential,
  getCourses,
  addCourse,
  updateCourse,
  deleteCourse,
  getAnalytics,
  getComplianceReport,
  getRecentActivities
};