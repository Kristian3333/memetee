import nodemailer from 'nodemailer';

const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const key = `contact_${ip}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const limit = 2;

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key);
  const validRequests = requests.filter(time => now - time < windowMs);

  if (validRequests.length >= limit) {
    return false;
  }

  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  return true;
}

function validateInput(data) {
  const { name, email, message } = data;

  if (!name || !email || !message) {
    return 'All fields are required';
  }
  if (name.length < 2 || name.length > 100) {
    return 'Name must be between 2 and 100 characters';
  }
  if (message.length < 10 || message.length > 1000) {
    return 'Message must be between 10 and 1000 characters';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createEmailTransporter() {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    return nodemailer.createTransporter({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendEmail(to, subject, html, text) {
  const transporter = createEmailTransporter();
  const mailOptions = {
    from: `"${process.env.BUSINESS_NAME || 'MemeTee'}" <${process.env.FROM_EMAIL || process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  };
  return await transporter.sendMail(mailOptions);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again in 5 minutes.',
      });
    }

    const validationError = validateInput(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const { name, email, message } = req.body;

    if (!process.env.GMAIL_USER && !process.env.SENDGRID_API_KEY && !process.env.SMTP_HOST) {
      return res.status(200).json({
        success: true,
        message: "Thank you for your message! We'll get back to you within 24 hours. (Demo mode - email not actually sent)",
      });
    }

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeMessage = escapeHtml(message);

    const customerEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">Thank you for contacting MemeTee!</h2>
        <p>Hi ${safeName},</p>
        <p>We've received your message and will get back to you within 24 hours.</p>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>Your Message:</h3>
          <p><em>"${safeMessage}"</em></p>
        </div>
        <p>Best regards,<br>The MemeTee Team</p>
      </div>
    `;

    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ff6b6b;">New Contact Form Submission</h2>
        <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>Customer Details:</h3>
          <p><strong>Name:</strong> ${safeName}</p>
          <p><strong>Email:</strong> ${safeEmail}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>IP:</strong> ${ip}</p>
        </div>
        <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 20px 0;">
          <h3>Message:</h3>
          <p>"${safeMessage}"</p>
        </div>
        <p><strong>Action Required:</strong> Please respond to ${safeEmail} within 24 hours.</p>
      </div>
    `;

    try {
      await sendEmail(
        email,
        "Thanks for contacting MemeTee! We'll be in touch soon",
        customerEmailHtml,
        `Hi ${name},\n\nThanks for contacting MemeTee! We've received your message: "${message}"\n\nWe'll get back to you within 24 hours.\n\nBest regards,\nThe MemeTee Team`
      );

      await sendEmail(
        process.env.ADMIN_EMAIL || process.env.GMAIL_USER || 'hello@memetee.com',
        `New Contact Form Submission from ${name}`,
        adminEmailHtml,
        `New contact form submission:\n\nName: ${name}\nEmail: ${email}\nMessage: "${message}"\n\nTime: ${new Date().toLocaleString()}\nIP: ${ip}`
      );

      res.status(200).json({
        success: true,
        message: "Thank you for your message! We'll get back to you within 24 hours.",
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);

      res.status(200).json({
        success: true,
        message: "Thank you for your message! We'll get back to you within 24 hours. (Note: There was an issue with our email system, but your message was received)",
      });
    }
  } catch (error) {
    console.error('Contact form error:', error);

    res.status(500).json({
      success: false,
      error: 'Sorry, there was an error sending your message. Please try again or email us directly at hello@memetee.com',
    });
  }
}
