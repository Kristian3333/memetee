// Vercel serverless function for health check - Updated for GPT Image 1
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
    replicate: !!process.env.REPLICATE_API_TOKEN, // Legacy fallback (optional)
  };

  const emailServices = {
    gmail: !!(process.env.EMAIL_SERVICE === 'gmail' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD),
    sendgrid: !!(process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY),
    smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
  };

  // Determine primary AI service
  let primaryAI = 'none';
  if (aiServices.openai) {
    primaryAI = 'openai-gpt-image-1';
  } else if (aiServices.replicate) {
    primaryAI = 'replicate-fallback';
  }

  // Determine primary email service
  let primaryEmail = 'none';
  if (emailServices.gmail) {
    primaryEmail = 'gmail';
  } else if (emailServices.sendgrid) {
    primaryEmail = 'sendgrid';
  } else if (emailServices.smtp) {
    primaryEmail = 'smtp';
  }
  
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: 'vercel',
    models: {
      meme_generation: primaryAI === 'openai-gpt-image-1' ? 'GPT Image 1 (latest 2025)' : 'Not configured',
      tshirt_mockup: 'Template overlay (no AI needed)',
      fallback_available: aiServices.replicate ? 'Yes' : 'No'
    },
    services: {
      ai: aiServices,
      email: emailServices,
      primary_ai: primaryAI,
      primary_email: primaryEmail
    },
    version: '2.0.0-gpt-image-1'
  });
}