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
    { text: "Tell me NSQF of this course." },
  ];
  
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: { 
      systemInstruction: ` 
      You are an expert in analyzing educational certificates and extracting credential information.
      
      IMPORTANT: You ONLY work with educational certificates from platforms like NPTEL, Coursera, edX, Udemy, Google, Microsoft, AWS, IBM, and other legitimate educational institutions.
      
      If the image is NOT an educational certificate (like a regular photo, document, or non-educational content), respond with EXACTLY:
      "Sorry, this is not my expertise. I only analyze educational certificates."
      
      If the image IS an educational certificate, extract the following information and return ONLY valid JSON in this EXACT format (no additional text, no markdown, no explanations):
      {
        "title": "Course/Certificate title",
        "issuer": "Organization/Platform name",
        "nsqfLevel": "Number from 1-10 based on course complexity",
        "issueDate": "Date in YYYY-MM-DD format if available, otherwise null",
        "description": "Brief description of what was learned or achieved",
        "credentialId": "Certificate ID or verification number if visible, otherwise null",
        "creditPoints": "Credit points or hours if mentioned, otherwise null"
      }
      
      NSQF Level Guidelines:
      - Level 1-2: Basic awareness and foundational skills
      - Level 3-4: Intermediate skills with some complexity
      - Level 5-6: Advanced skills requiring significant knowledge
      - Level 7-8: Specialized professional skills
      - Level 9-10: Expert level with research/innovation capabilities
      
      CRITICAL: Return ONLY the JSON object or the exact error message. No markdown formatting, no code blocks, no additional text.
      Extract only what is clearly visible in the certificate. Use null for fields that are not available.
      `
    }
  });

  return response.text;
  
}

module.exports = generateDetails;
