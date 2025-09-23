const axios = require('axios');

// Static fallback data in case ML service is unavailable
const staticJobs = [
  {
    id: "techcorp-senior-ds",
    title: "Senior Data Scientist",
    company: "TechCorp Inc",
    location: "San Francisco, CA",
    description: "We're looking for a Senior Data Scientist to join our AI team. You'll work on machine learning models, data analysis, and statistical modeling. Required skills include Python, SQL, machine learning, pandas, and scikit-learn. Experience with cloud platforms (AWS, GCP) is a plus.",
    skills_required: ["python", "sql", "machine learning", "pandas", "scikit-learn", "statistics", "data analysis"],
    experience_level: "senior",
    salary_range: "$130,000 - $180,000",
    job_type: "full-time",
    work_type: "hybrid",
    posted_date: "2024-01-15",
    source: "static",
    applicants: 23
  },
  {
    id: "ai-innovations-ml-eng",
    title: "Machine Learning Engineer",
    company: "AI Innovations",
    location: "Remote",
    description: "Join our ML engineering team to build and deploy machine learning systems at scale. We need someone with Python, TensorFlow/PyTorch, Docker, Kubernetes, and cloud experience. You'll work on MLOps, model deployment, and system architecture.",
    skills_required: ["python", "tensorflow", "pytorch", "docker", "kubernetes", "aws", "mlops"],
    experience_level: "mid",
    salary_range: "$110,000 - $150,000",
    job_type: "full-time",
    work_type: "remote",
    posted_date: "2024-01-12",
    source: "static",
    applicants: 45
  },
  {
    id: "finance-solutions-analyst",
    title: "Data Analyst",
    company: "Finance Solutions Ltd",
    location: "New York, NY",
    description: "Data Analyst position in financial services. Work with large datasets, create visualizations, and provide business insights. Requirements: SQL, Python, Excel, Tableau, and statistical analysis skills.",
    skills_required: ["sql", "python", "excel", "tableau", "statistics", "data visualization"],
    experience_level: "mid",
    salary_range: "$75,000 - $95,000",
    job_type: "full-time",
    work_type: "onsite",
    posted_date: "2024-01-10",
    source: "static",
    applicants: 67
  },
  {
    id: "webtech-python-dev",
    title: "Python Developer",
    company: "WebTech Solutions",
    location: "Austin, TX",
    description: "Full-stack Python developer role. Build web applications using Django/Flask, work with databases, and integrate APIs. Skills needed: Python, Django, JavaScript, HTML/CSS, PostgreSQL, Git.",
    skills_required: ["python", "django", "javascript", "html", "css", "postgresql", "git"],
    experience_level: "mid",
    salary_range: "$85,000 - $115,000",
    job_type: "full-time",
    work_type: "hybrid",
    posted_date: "2024-01-08",
    source: "static",
    applicants: 34
  },
  {
    id: "startuptech-junior-ds",
    title: "Junior Data Scientist",
    company: "StartupTech",
    location: "Boston, MA",
    description: "Entry-level Data Scientist position perfect for recent graduates. Work on predictive modeling, data cleaning, and analysis. Training provided. Requirements: Python, SQL, basic machine learning knowledge.",
    skills_required: ["python", "sql", "machine learning", "pandas", "statistics"],
    experience_level: "entry",
    salary_range: "$65,000 - $85,000",
    job_type: "full-time",
    work_type: "onsite",
    posted_date: "2024-01-14",
    source: "static",
    applicants: 89
  },
  {
    id: "cloudfirst-data-eng",
    title: "Cloud Data Engineer",
    company: "CloudFirst Corp",
    location: "Seattle, WA",
    description: "Design and implement cloud-based data pipelines. Work with AWS services, Apache Spark, and big data technologies. Requirements: Python, SQL, AWS, Spark, data engineering experience.",
    skills_required: ["python", "sql", "aws", "spark", "data engineering", "etl"],
    experience_level: "senior",
    salary_range: "$120,000 - $160,000",
    job_type: "full-time",
    work_type: "hybrid",
    posted_date: "2024-01-11",
    source: "static",
    applicants: 56
  },
  {
    id: "uifirst-frontend-dev",
    title: "Frontend Developer",
    company: "UIFirst Studio",
    location: "Los Angeles, CA",
    description: "Create beautiful, responsive user interfaces using React, TypeScript, and modern CSS. Work closely with designers and backend developers to deliver exceptional user experiences.",
    skills_required: ["react", "typescript", "javascript", "css", "html", "figma"],
    experience_level: "mid",
    salary_range: "$90,000 - $125,000",
    job_type: "full-time",
    work_type: "hybrid",
    posted_date: "2024-01-09",
    source: "static",
    applicants: 78
  },
  {
    id: "scaleops-devops-eng",
    title: "DevOps Engineer",
    company: "ScaleOps Inc",
    location: "Denver, CO",
    description: "Manage cloud infrastructure, CI/CD pipelines, and container orchestration. Experience with AWS, Docker, Kubernetes, and Terraform required. Help scale our platform to millions of users.",
    skills_required: ["aws", "docker", "kubernetes", "terraform", "jenkins", "monitoring"],
    experience_level: "senior",
    salary_range: "$115,000 - $155,000",
    job_type: "full-time",
    work_type: "remote",
    posted_date: "2024-01-13",
    source: "static",
    applicants: 42
  }
];

// Scoring algorithm for static data
function calculateJobScore(job, userProfile, filters) {
  let score = 0;
  
  // Title relevance (40% weight)
  const titleWords = job.title.toLowerCase().split(' ');
  const preferredRoles = userProfile.preferred_roles || [];
  const titleMatch = preferredRoles.some(role => 
    titleWords.some(titleWord => titleWord.includes(role.toLowerCase()) || role.toLowerCase().includes(titleWord))
  );
  if (titleMatch) score += 40;
  
  // Skills match (30% weight)
  const userSkills = userProfile.skills || [];
  const matchingSkills = job.skills_required.filter(skill => 
    userSkills.some(userSkill => skill.toLowerCase().includes(userSkill.toLowerCase()) || userSkill.toLowerCase().includes(skill.toLowerCase()))
  );
  const skillScore = (matchingSkills.length / Math.max(job.skills_required.length, 1)) * 30;
  score += skillScore;
  
  // Experience level match (15% weight)
  if (userProfile.experience_level && job.experience_level === userProfile.experience_level) {
    score += 15;
  }
  
  // Work type match (10% weight)
  if (userProfile.work_type && job.work_type === userProfile.work_type) {
    score += 10;
  }
  
  // Location match (5% weight)
  if (userProfile.location && job.location.toLowerCase().includes(userProfile.location.toLowerCase())) {
    score += 5;
  }
  
  return Math.min(score, 100);
}

// Job search controller
const searchJobs = async (req, res) => {
  try {
    const { query, filters = {}, userProfile = {} } = req.body;
    
    console.log(`🔍 Job search request: "${query}" with filters:`, filters);
    
    let jobs = [];
    let usedMLService = false;
    
    // Try ML service first
    if (process.env.ML_CAREER_SERVICE_URL) {
      try {
        console.log(`🤖 Attempting to use ML Career Service at ${process.env.ML_CAREER_SERVICE_URL}`);
        
        const mlResponse = await axios.post(`${process.env.ML_CAREER_SERVICE_URL}/api/search-jobs`, {
          query: query || 'software developer',
          location: filters.location || '',
          limit: 100,
          user_profile: {
            skills: userProfile.skills || [],
            experience_level: userProfile.experience_level || 'mid',
            preferred_roles: userProfile.preferred_roles || [query || 'software developer'],
            location: userProfile.location || filters.location || '',
            salary_range: userProfile.salary_range || { min: 0, max: 999999 },
            work_type: userProfile.work_type || filters.work_type || ''
          }
        }, {
          timeout: 15000 // 15 second timeout
        });
        
        if (mlResponse.data && mlResponse.data.jobs) {
          jobs = mlResponse.data.jobs;
          usedMLService = true;
          console.log(`✅ ML service returned ${jobs.length} jobs`);
        } else {
          console.log('⚠️ ML service returned no jobs, falling back to static data');
        }
        
      } catch (mlError) {
        console.log(`⚠️ ML service failed: ${mlError.message}, falling back to static data`);
      }
    }
    
    // Fallback to static data if ML service failed or returned no results
    if (!usedMLService || jobs.length === 0) {
      console.log('📊 Using static job data');
      jobs = [...staticJobs];
      
      // Apply basic filtering to static data
      if (query) {
        const queryLower = query.toLowerCase();
        jobs = jobs.filter(job => 
          job.title.toLowerCase().includes(queryLower) ||
          job.company.toLowerCase().includes(queryLower) ||
          job.description.toLowerCase().includes(queryLower) ||
          job.skills_required.some(skill => skill.toLowerCase().includes(queryLower))
        );
      }
      
      if (filters.experience_level) {
        jobs = jobs.filter(job => job.experience_level === filters.experience_level);
      }
      
      if (filters.work_type) {
        jobs = jobs.filter(job => job.work_type === filters.work_type);
      }
      
      if (filters.location) {
        jobs = jobs.filter(job => 
          job.location.toLowerCase().includes(filters.location.toLowerCase()) ||
          job.work_type === 'remote'
        );
      }
      
      // Calculate scores for static data
      jobs = jobs.map(job => ({
        job,
        score: calculateJobScore(job, userProfile, filters)
      }));
      
      // Sort by score
      jobs.sort((a, b) => b.score - a.score);
      
      // Format for response
      jobs = jobs.map(item => item.job);
    }
    
    console.log(`📋 Returning ${jobs.length} jobs (ML: ${usedMLService})`);
    
    res.json({
      success: true,
      jobs: jobs.slice(0, 50), // Limit to 50 jobs
      source: usedMLService ? 'ml-service' : 'static',
      total: jobs.length,
      query,
      filters
    });
    
  } catch (error) {
    console.error('❌ Error in job search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search jobs',
      error: error.message
    });
  }
};

// Job recommendations controller
const getJobRecommendations = async (req, res) => {
  try {
    const { userProfile } = req.body;
    
    console.log('🎯 Job recommendations request for user:', userProfile);
    
    let recommendations = [];
    let usedMLService = false;
    
    // Try ML service first
    if (process.env.ML_CAREER_SERVICE_URL) {
      try {
        console.log(`🤖 Requesting recommendations from ML service`);
        
        const mlResponse = await axios.post(`${process.env.ML_CAREER_SERVICE_URL}/api/recommend-jobs`, {
          user_profile: {
            skills: userProfile.skills || [],
            experience_level: userProfile.experience_level || 'mid',
            preferred_roles: userProfile.preferred_roles || ['software developer'],
            location: userProfile.location || '',
            salary_range: userProfile.salary_range || { min: 0, max: 999999 },
            work_type: userProfile.work_type || ''
          },
          limit: 20
        }, {
          timeout: 20000 // 20 second timeout for recommendations
        });
        
        if (mlResponse.data && mlResponse.data.recommendations) {
          recommendations = mlResponse.data.recommendations;
          usedMLService = true;
          console.log(`✅ ML service returned ${recommendations.length} recommendations`);
        }
        
      } catch (mlError) {
        console.log(`⚠️ ML recommendations failed: ${mlError.message}, falling back to static logic`);
      }
    }
    
    // Fallback to static recommendations
    if (!usedMLService || recommendations.length === 0) {
      console.log('📊 Generating static recommendations');
      
      // Simple recommendation logic using static data
      const jobsWithScores = staticJobs.map(job => {
        const score = calculateJobScore(job, userProfile, {});
        
        // Calculate skill match
        const userSkills = userProfile.skills || [];
        const jobSkills = job.skills_required || [];
        const matchingSkills = jobSkills.filter(skill => 
          userSkills.some(userSkill => 
            skill.toLowerCase().includes(userSkill.toLowerCase()) || 
            userSkill.toLowerCase().includes(skill.toLowerCase())
          )
        );
        const skillGaps = jobSkills.filter(skill => !matchingSkills.includes(skill));
        
        const recommendation = {
          job,
          score: {
            skill_score: (matchingSkills.length / Math.max(jobSkills.length, 1)) * 100,
            role_relevance_score: 80,
            experience_match_score: job.experience_level === userProfile.experience_level ? 100 : 70,
            growth_score: 85,
            overall_score: score
          },
          explanation: `This ${job.title} role matches ${matchingSkills.length} of your skills and offers great growth potential in ${job.company}.`,
          pros: [
            `Strong match with ${matchingSkills.length} of your skills`,
            `${job.experience_level} level position`,
            `Competitive salary range: ${job.salary_range}`
          ],
          cons: skillGaps.length > 0 ? [
            `Requires additional skills: ${skillGaps.slice(0, 3).join(', ')}`
          ] : [],
          skill_gaps: skillGaps
        };
        
        return recommendation;
      });
      
      // Sort by overall score and take top 10
      jobsWithScores.sort((a, b) => b.score.overall_score - a.score.overall_score);
      recommendations = jobsWithScores.slice(0, 10);
    }
    
    console.log(`📋 Returning ${recommendations.length} recommendations (ML: ${usedMLService})`);
    
    res.json({
      success: true,
      recommendations,
      source: usedMLService ? 'ml-service' : 'static',
      total: recommendations.length,
      userProfile
    });
    
  } catch (error) {
    console.error('❌ Error in job recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job recommendations',
      error: error.message
    });
  }
};

// Test ML service connection
const testMLService = async (req, res) => {
  try {
    if (!process.env.ML_CAREER_SERVICE_URL) {
      return res.json({
        success: false,
        message: 'ML service URL not configured',
        configured: false
      });
    }
    
    console.log(`🔧 Testing ML service connection to ${process.env.ML_CAREER_SERVICE_URL}`);
    
    const response = await axios.get(`${process.env.ML_CAREER_SERVICE_URL}/health`, {
      timeout: 5000
    });
    
    res.json({
      success: true,
      message: 'ML service is reachable',
      configured: true,
      serviceUrl: process.env.ML_CAREER_SERVICE_URL,
      serviceResponse: response.data
    });
    
  } catch (error) {
    console.error('❌ ML service test failed:', error.message);
    res.json({
      success: false,
      message: `ML service unreachable: ${error.message}`,
      configured: true,
      serviceUrl: process.env.ML_CAREER_SERVICE_URL
    });
  }
};

module.exports = {
  searchJobs,
  getJobRecommendations,
  testMLService
};
