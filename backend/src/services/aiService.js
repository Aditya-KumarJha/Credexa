const { GoogleGenAI } = require("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function generateDetails(base64ImageFile) {
  const contents = [
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: base64ImageFile,
      },
    },
    { text: "Analyze this educational certificate and extract NSQF information." },
  ];
  
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash-exp",
    contents: contents,
    config: { 
      systemInstruction: ` 
      You are an expert in analyzing educational certificates and extracting credential information for NSQF (National Skills Qualifications Framework) tracking.
      
      IMPORTANT: You ONLY work with educational certificates from platforms like NPTEL, Coursera, edX, Udemy, Google, Microsoft, AWS, IBM, and other legitimate educational institutions.
      
      If the image is NOT an educational certificate (like a regular photo, document, or non-educational content), respond with EXACTLY:
      "Sorry, this is not my expertise. I only analyze educational certificates."
      
      If the image IS an educational certificate, extract the following information and return ONLY valid JSON in this EXACT format (no additional text, no markdown, no explanations):
      {
        "title": "Course/Certificate title",
        "issuer": "Organization/Platform name",
        "nsqfLevel": "Number from 1-10 based on course complexity",
        "skillDomain": "Primary skill domain (e.g., Python Programming, Web Development, Data Science, etc.)",
        "creditPoints": "Points this certificate should contribute (15-50 based on complexity)",
        "issueDate": "Date in YYYY-MM-DD format if available, otherwise null",
        "description": "Brief description of what was learned or achieved",
        "credentialId": "Certificate ID or verification number if visible, otherwise null",
        "skills": ["Array of specific skills learned"],
        "estimatedDuration": "Course duration if mentioned (in hours/weeks), otherwise null"
      }
      
      NSQF Level Guidelines:
      - Level 1-2: Basic awareness and foundational skills (15-20 credit points)
      - Level 3-4: Intermediate skills with some complexity (20-30 credit points)
      - Level 5-6: Advanced skills requiring significant knowledge (30-40 credit points)
      - Level 7-8: Specialized professional skills (40-45 credit points)
      - Level 9-10: Expert level with research/innovation capabilities (45-50 credit points)
      
      Skill Domain Examples:
      - "Python Programming", "JavaScript Development", "Web Development"
      - "Data Science", "Machine Learning", "Artificial Intelligence"
      - "Cloud Computing", "AWS Services", "DevOps"
      - "Digital Marketing", "Project Management", "Cybersecurity"
      
      Credit Points Logic:
      - Basic/Introductory courses: 15-25 points
      - Intermediate courses: 25-35 points
      - Advanced/Professional courses: 35-45 points
      - Expert/Specialization courses: 45-50 points
      
      CRITICAL: Return ONLY the JSON object or the exact error message. No markdown formatting, no code blocks, no additional text.
      Extract only what is clearly visible in the certificate. Use null for fields that are not available.
      Be smart about inferring skillDomain from the course title and content.
      `
    }
  });

  return response.text;
}

// Function to determine skill domain from certificate title/description
function determineSkillDomain(title, description = '', skills = []) {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  const allText = `${titleLower} ${descLower} ${skills.join(' ').toLowerCase()}`;
  
  // Programming Languages
  if (allText.match(/\b(python|django|flask|fastapi)\b/)) return "Python Programming";
  if (allText.match(/\b(javascript|js|node|react|vue|angular)\b/)) return "JavaScript Development";
  if (allText.match(/\b(java|spring|hibernate)\b/)) return "Java Programming";
  if (allText.match(/\b(c\+\+|cpp|c programming)\b/)) return "C++ Programming";
  if (allText.match(/\b(c#|csharp|dotnet|\.net)\b/)) return "C# Programming";
  
  // Web Development
  if (allText.match(/\b(web development|frontend|backend|fullstack|html|css)\b/)) return "Web Development";
  if (allText.match(/\b(react|nextjs|next\.js)\b/)) return "React Development";
  if (allText.match(/\b(vue|vuejs|vue\.js)\b/)) return "Vue.js Development";
  if (allText.match(/\b(angular|angularjs)\b/)) return "Angular Development";
  
  // Data & AI
  if (allText.match(/\b(data science|data analysis|analytics)\b/)) return "Data Science";
  if (allText.match(/\b(machine learning|ml|ai|artificial intelligence)\b/)) return "Machine Learning";
  if (allText.match(/\b(deep learning|neural network|tensorflow|pytorch)\b/)) return "Deep Learning";
  if (allText.match(/\b(data visualization|tableau|power bi)\b/)) return "Data Visualization";
  
  // Cloud & DevOps
  if (allText.match(/\b(aws|amazon web services)\b/)) return "AWS Cloud Services";
  if (allText.match(/\b(azure|microsoft azure)\b/)) return "Microsoft Azure";
  if (allText.match(/\b(google cloud|gcp)\b/)) return "Google Cloud Platform";
  if (allText.match(/\b(devops|ci\/cd|docker|kubernetes)\b/)) return "DevOps";
  if (allText.match(/\b(cloud computing|cloud architecture)\b/)) return "Cloud Computing";
  
  // Business & Management
  if (allText.match(/\b(project management|pmp|agile|scrum)\b/)) return "Project Management";
  if (allText.match(/\b(digital marketing|seo|social media)\b/)) return "Digital Marketing";
  if (allText.match(/\b(data analysis|business analysis)\b/)) return "Business Analysis";
  
  // Security
  if (allText.match(/\b(cybersecurity|ethical hacking|penetration testing)\b/)) return "Cybersecurity";
  
  // Design
  if (allText.match(/\b(ui\/ux|user interface|user experience|design)\b/)) return "UI/UX Design";
  if (allText.match(/\b(graphic design|adobe|photoshop)\b/)) return "Graphic Design";
  
  // Mobile
  if (allText.match(/\b(mobile development|android|ios|react native|flutter)\b/)) return "Mobile Development";
  
  // Database
  if (allText.match(/\b(database|sql|mysql|postgresql|mongodb)\b/)) return "Database Management";
  
  // Default categorization
  if (allText.match(/\b(programming|coding|software development)\b/)) return "Software Development";
  if (allText.match(/\b(technology|tech|computer)\b/)) return "Information Technology";
  
  // Fallback to general category
  return "General Skills";
}

// Function to calculate credit points based on NSQF level and course characteristics
function calculateCreditPoints(nsqfLevel, title, description = '', estimatedDuration = null) {
  let basePoints = 0;
  
  // Base points by NSQF level
  switch(nsqfLevel) {
    case 1:
    case 2:
      basePoints = 15;
      break;
    case 3:
    case 4:
      basePoints = 25;
      break;
    case 5:
    case 6:
      basePoints = 35;
      break;
    case 7:
    case 8:
      basePoints = 42;
      break;
    case 9:
    case 10:
      basePoints = 50;
      break;
    default:
      basePoints = 25;
  }
  
  // Adjust based on course characteristics
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();
  
  // Bonus for advanced/professional courses
  if (titleLower.match(/\b(advanced|professional|expert|master|specialization)\b/)) {
    basePoints += 5;
  }
  
  // Bonus for certification programs
  if (titleLower.match(/\b(certification|certified|certificate program)\b/)) {
    basePoints += 3;
  }
  
  // Bonus for comprehensive courses
  if (titleLower.match(/\b(complete|comprehensive|full|bootcamp)\b/)) {
    basePoints += 5;
  }
  
  // Adjust based on estimated duration if available
  if (estimatedDuration) {
    const durationLower = estimatedDuration.toLowerCase();
    if (durationLower.match(/\b(\d+)\s*(week|month)/)) {
      const weeks = durationLower.match(/(\d+)\s*week/) ? parseInt(durationLower.match(/(\d+)\s*week/)[1]) : 0;
      const months = durationLower.match(/(\d+)\s*month/) ? parseInt(durationLower.match(/(\d+)\s*month/)[1]) * 4 : 0;
      const totalWeeks = weeks + months;
      
      if (totalWeeks >= 12) basePoints += 8;
      else if (totalWeeks >= 8) basePoints += 5;
      else if (totalWeeks >= 4) basePoints += 3;
    }
  }
  
  // Ensure points are within reasonable bounds
  return Math.min(Math.max(basePoints, 15), 50);
}

module.exports = {
  generateDetails,
  determineSkillDomain,
  calculateCreditPoints
};
