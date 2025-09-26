const validateEmailConfig = () => {
  
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('⚠️  SENDGRID_API_KEY not configured. Email functionality will not work.');
    return false;
  }
  
  if (!process.env.SENDGRID_FROM_EMAIL) {
    console.warn('⚠️  SENDGRID_FROM_EMAIL not configured. Using default sender.');
  }
  
  console.log('✅ SendGrid configuration validated successfully');
  return true;
};

const getEmailConfig = () => {
  return {
    service: 'sendgrid',
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'credexaowns@gmail.com',
    }
  };
};

module.exports = {
  validateEmailConfig,
  getEmailConfig
};
