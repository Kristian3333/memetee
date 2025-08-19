// Vercel serverless function for health check - Updated for Vision-Enhanced Generation
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

  // Determine capabilities based on OpenAI availability
  let capabilities = {
    vision_analysis: false,
    meme_generation: false,
    image_editing: false
  };

  if (aiServices.openai) {
    capabilities = {
      vision_analysis: true, // GPT-4o Vision
      meme_generation: true, // DALL-E 3 + GPT Image 1
      image_editing: true // GPT Image 1 image editing
    };
  }

  // Determine primary AI service
  let primaryAI = 'none';
  if (aiServices.openai) {
    primaryAI = 'openai-vision-enhanced';
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
    capabilities: capabilities,
    workflow: {
      step_1: 'Vision Analysis (GPT-4o)',
      step_2: 'Enhanced Meme Generation (DALL-E 3 / GPT Image 1)',
      step_3: 'T-Shirt Mockup (Template Overlay)',
      fallback_chain: 'DALL-E 3 Enhanced → GPT Image 1 Enhanced → GPT Image 1 Edit → Basic Generation'
    },
    models: {
      vision_analysis: capabilities.vision_analysis ? 'GPT-4o Vision' : 'Not available',
      meme_generation: capabilities.meme_generation ? 'DALL-E 3 + GPT Image 1 (vision-enhanced)' : 'Not configured',
      tshirt_mockup: 'Template overlay (no AI needed)',
      fallback_available: aiServices.replicate ? 'Yes (Replicate)' : 'No'
    },
    services: {
      ai: aiServices,
      email: emailServices,
      primary_ai: primaryAI,
      primary_email: primaryEmail
    },
    features: {
      vision_enhanced_generation: capabilities.vision_analysis && capabilities.meme_generation,
      smart_fallbacks: true,
      timeout_optimization: true,
      template_based_mockups: true
    },
    version: '3.0.0-vision-enhanced'
  });
}