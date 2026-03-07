export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const xaiConfigured = !!process.env.XAI_API_KEY;
  const geminiConfigured = !!process.env.GOOGLE_AI_API_KEY;
  const falConfigured = !!process.env.FAL_KEY;
  const openaiConfigured = !!process.env.OPENAI_API_KEY;

  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    capabilities: {
      vision: geminiConfigured || xaiConfigured || openaiConfigured,
      meme: xaiConfigured || falConfigured || openaiConfigured,
      email: !!(
        (process.env.EMAIL_SERVICE === 'gmail' && process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) ||
        (process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY) ||
        (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)
      ),
    },
    services: {
      xai: xaiConfigured,
      gemini: geminiConfigured,
      fal: falConfigured,
      openai: openaiConfigured,
      gmail: !!(process.env.EMAIL_SERVICE === 'gmail' && process.env.GMAIL_USER),
      sendgrid: !!(process.env.EMAIL_SERVICE === 'sendgrid' && process.env.SENDGRID_API_KEY),
      smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
    },
  });
}
