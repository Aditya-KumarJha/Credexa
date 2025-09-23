import { JobPosting, JobRecommendation, JobSearchFilters } from "@/types/jobs";

// Mock data based on the ML career assistant structure
const mockJobs: JobPosting[] = [
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
    source: "linkedin",
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
    source: "indeed",
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
    source: "glassdoor",
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
    source: "stackoverflow",
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
    source: "linkedin",
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
    source: "indeed",
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
    source: "angel",
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
    source: "glassdoor",
    applicants: 42
  }
];

// Scoring algorithm based on the ML recommendation engine
function calculateJobScore(job: JobPosting, query: string, filters: JobSearchFilters): number {
  let score = 0;
  
  // Title relevance (40% weight)
  const titleWords = job.title.toLowerCase().split(' ');
  const queryWords = query.toLowerCase().split(' ');
  const titleMatch = queryWords.some(word => 
    titleWords.some(titleWord => titleWord.includes(word) || word.includes(titleWord))
  );
  if (titleMatch) score += 40;
  
  // Skills match (30% weight)
  const querySkills = query.toLowerCase().split(' ');
  const matchingSkills = job.skills_required.filter(skill => 
    querySkills.some(q => skill.toLowerCase().includes(q) || q.includes(skill.toLowerCase()))
  );
  const skillScore = (matchingSkills.length / Math.max(job.skills_required.length, 1)) * 30;
  score += skillScore;
  
  // Experience level match (15% weight)
  if (filters.experience_level && job.experience_level === filters.experience_level) {
    score += 15;
  }
  
  // Work type match (10% weight)
  if (filters.work_type && job.work_type === filters.work_type) {
    score += 10;
  }
  
  // Location match (5% weight)
  if (filters.location && job.location.toLowerCase().includes(filters.location.toLowerCase())) {
    score += 5;
  }
  
  return Math.min(score, 100);
}

export class JobSearchService {
  static async searchJobs(
    query: string, 
    filters: Partial<JobSearchFilters> = {}
  ): Promise<{ job: JobPosting; score: number }[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const defaultFilters: JobSearchFilters = {
      location: "",
      experience_level: "",
      work_type: "",
      salary_min: 0,
      salary_max: 999999,
      skills: [],
      company_type: "",
      posted_within: "",
      ...filters
    };
    
    let filteredJobs = mockJobs;
    
    // Apply filters
    if (defaultFilters.experience_level) {
      filteredJobs = filteredJobs.filter(job => 
        job.experience_level === defaultFilters.experience_level
      );
    }
    
    if (defaultFilters.work_type) {
      filteredJobs = filteredJobs.filter(job => 
        job.work_type === defaultFilters.work_type
      );
    }
    
    if (defaultFilters.location) {
      filteredJobs = filteredJobs.filter(job => 
        job.location.toLowerCase().includes(defaultFilters.location.toLowerCase())
      );
    }
    
    if (defaultFilters.company_type) {
      filteredJobs = filteredJobs.filter(job => 
        job.company.toLowerCase().includes(defaultFilters.company_type.toLowerCase())
      );
    }
    
    if (defaultFilters.posted_within) {
      const now = new Date();
      const daysAgo = defaultFilters.posted_within === "week" ? 7 : 
                     defaultFilters.posted_within === "month" ? 30 : 
                     defaultFilters.posted_within === "3months" ? 90 : 365;
      const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      
      filteredJobs = filteredJobs.filter(job => {
        if (!job.posted_date) return true;
        const jobDate = new Date(job.posted_date);
        return jobDate >= cutoffDate;
      });
    }
    
    // Filter by query (title, company, description, skills)
    if (query.trim()) {
      const queryLower = query.toLowerCase();
      filteredJobs = filteredJobs.filter(job => 
        job.title.toLowerCase().includes(queryLower) ||
        job.company.toLowerCase().includes(queryLower) ||
        job.description.toLowerCase().includes(queryLower) ||
        job.skills_required.some(skill => skill.toLowerCase().includes(queryLower))
      );
    }
    
    // Calculate scores and sort
    const jobsWithScores = filteredJobs.map(job => ({
      job,
      score: calculateJobScore(job, query, defaultFilters)
    }));
    
    // Sort by score (highest first)
    jobsWithScores.sort((a, b) => b.score - a.score);
    
    return jobsWithScores;
  }
  
  static async getJobRecommendations(
    userSkills: string[],
    experienceLevel: string = "mid"
  ): Promise<JobRecommendation[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const recommendations: JobRecommendation[] = mockJobs.map(job => {
      // Calculate skill match
      const matchingSkills = job.skills_required.filter(skill => 
        userSkills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      
      const skillScore = (matchingSkills.length / job.skills_required.length) * 100;
      const experienceMatch = job.experience_level === experienceLevel ? 100 : 70;
      const roleRelevance = 80; // Base relevance
      const growthScore = job.experience_level === "senior" ? 95 : 85;
      
      const overallScore = (skillScore * 0.4 + experienceMatch * 0.3 + roleRelevance * 0.2 + growthScore * 0.1);
      
      const skillGaps = job.skills_required.filter(skill => 
        !userSkills.some(userSkill => 
          userSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(userSkill.toLowerCase())
        )
      );
      
      return {
        job,
        score: {
          skill_score: skillScore,
          role_relevance_score: roleRelevance,
          experience_match_score: experienceMatch,
          growth_score: growthScore,
          overall_score: overallScore
        },
        explanation: `This ${job.title} role matches ${matchingSkills.length} of your skills and offers great growth potential in ${job.company}.`,
        pros: [
          `Strong match with ${matchingSkills.length} of your skills`,
          `${job.experience_level} level position fits your experience`,
          `Competitive salary range: ${job.salary_range}`
        ],
        cons: skillGaps.length > 0 ? [
          `Requires additional skills: ${skillGaps.slice(0, 3).join(', ')}`
        ] : [],
        skill_gaps: skillGaps
      };
    });
    
    // Sort by overall score
    recommendations.sort((a, b) => b.score.overall_score - a.score.overall_score);
    
    return recommendations.slice(0, 10); // Return top 10
  }
}
