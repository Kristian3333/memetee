// Vercel serverless function for health check
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const aiServices = {
    openai: !!process.env.OPENAI_API_KEY,
    replicate: !!process.env.REPLICATE_API_TOKEN,
  };

  const emailServices = {
    gmail: !!(process.env.EMAIL_SERVICE === 'gmail' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    sendgrid: !!(process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY),
    smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  };
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'vercel',
    services: {
      ai: aiServices,
      email: emailServices
    },
    version: '1.0.0'
  });
}