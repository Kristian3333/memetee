# MemeTee - AI Meme T-Shirt Generator 🎭👕

**Vercel Deployment Ready** - Upload photos, generate AI memes, preview on t-shirts!

## 🎯 What This Does

- **AI Meme Generation**: Upload any photo and get a hilarious AI-generated meme
- **T-Shirt Mockups**: See your meme on realistic t-shirt previews  
- **Contact Form**: Real email functionality for customer inquiries
- **Coming Soon Features**: Payment processing and print-on-demand (implemented as placeholders)

## 🚀 Quick Deployment to Vercel

### 1. Clone/Download Project
```bash
cd memetee-landing-page
npm install
```

### 2. Deploy to Vercel (CLI)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### 3. Deploy to Vercel (Dashboard)
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import this repository
4. Vercel will auto-detect the configuration
5. Click "Deploy"

### 4. Add Environment Variables in Vercel Dashboard

Go to your project settings in Vercel and add these environment variables:

#### Required for AI Generation:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

#### Required for Contact Form:
```env
EMAIL_SERVICE=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password
ADMIN_EMAIL=your-admin-email@gmail.com
```

#### Optional (Alternative AI Provider):
```env
REPLICATE_API_TOKEN=r8_your-replicate-token-here
```

## 📧 Email Setup (Gmail)

### Get Gmail App Password:
1. Go to Google Account settings
2. Security → 2-Step Verification (enable if not already)
3. App passwords → Generate password for "Mail"
4. Use the 16-character password as `GMAIL_APP_PASSWORD`

### Alternative Email Providers:
```env
# SendGrid
EMAIL_SERVICE=sendgrid
SENDGRID_API_KEY=SG.your-sendgrid-api-key

# Custom SMTP
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-username
SMTP_PASS=your-password
```

## 🤖 AI Service Setup

### OpenAI (Recommended)
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create API key
3. Add billing method (DALL-E costs ~$0.04 per image)
4. Use as `OPENAI_API_KEY`

### Replicate (Alternative)
1. Go to [replicate.com](https://replicate.com)
2. Create account and get API token
3. Use as `REPLICATE_API_TOKEN`

## 🏗️ Project Structure

```
memetee-landing-page/
├── api/                     # Vercel serverless functions
│   ├── generate-meme.js     # AI meme generation
│   ├── generate-tshirt-mockup.js # AI t-shirt previews
│   ├── contact.js           # Email contact form
│   ├── process-order.js     # Coming soon placeholder
│   └── health.js            # Health check
├── index.html               # Main landing page
├── script.js                # Frontend JavaScript
├── styles.css               # Styling
├── config.js                # Configuration
├── vercel.json              # Vercel deployment config
└── package.json             # Dependencies
```

## ✨ Features

### ✅ Working Features:
- **AI Meme Generation** - Real OpenAI/Replicate integration
- **T-Shirt Mockups** - AI-generated product previews
- **Contact Form** - Real email sending capability
- **Responsive Design** - Works on all devices
- **File Upload** - Drag & drop image upload
- **Loading Animations** - Beautiful UI transitions

### 🚧 Coming Soon (Placeholders):
- **Payment Processing** - Shows "coming soon" message
- **Print-on-Demand** - Order fulfillment system
- **User Accounts** - Authentication system

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start Vercel dev server (simulates serverless functions)
npm run dev

# Or use basic Python server for frontend only
python -m http.server 8000
```

Visit `http://localhost:3000` (Vercel dev) or `http://localhost:8000`

## 📊 API Endpoints

- `GET /api/health` - Check service status
- `POST /api/generate-meme` - Generate AI meme from image
- `POST /api/generate-tshirt-mockup` - Create t-shirt preview
- `POST /api/contact` - Send contact form email
- `POST /api/process-order` - Coming soon placeholder

## 💰 Costs

### AI Generation:
- **OpenAI DALL-E**: ~$0.04 per meme + ~$0.04 per t-shirt mockup = $0.08 total
- **Replicate**: ~$0.006 per generation (much cheaper alternative)

### Hosting:
- **Vercel**: Free tier includes 100GB bandwidth, serverless functions
- **Email**: Free with Gmail, SendGrid has free tier

## 🛡️ Rate Limiting

Built-in rate limiting protects against abuse:
- AI generation: 3 requests per 5 minutes per IP
- Contact form: 2 requests per 5 minutes per IP
- General API: 5 requests per minute per IP

## 🐛 Troubleshooting

### "AI services not configured"
- Check environment variables in Vercel dashboard
- Ensure API keys are valid and have credit/quota

### "Contact form not working"
- Verify Gmail app password (not regular password)
- Check spam folder for test emails
- Ensure environment variables are set correctly

### "Serverless function timeout"
- AI generation can take 15-30 seconds
- Vercel functions timeout at 30 seconds (should be fine)
- Check function logs in Vercel dashboard

### Images not loading
- Check AI provider status/quotas
- Verify API keys are correct
- Look at Vercel function logs for errors

## 📈 Next Steps

To make this a full business:

1. **Add Payment Processing**
   - Integrate Stripe
   - Update `/api/process-order.js`

2. **Add Print-on-Demand**
   - Integrate Printful/Printify
   - Automatic order fulfillment

3. **Enhanced Features**
   - User accounts
   - Order tracking
   - Multiple meme styles
   - Bulk orders

4. **Analytics**
   - Google Analytics
   - User behavior tracking
   - Conversion optimization

## 📞 Support

For questions about this deployment:
- Check Vercel function logs for errors
- Test API endpoints at `/api/health`
- Verify environment variables are set
- Check AI provider status pages

---

**🎉 Your AI meme t-shirt generator is ready for Vercel!**

Just add your API keys and deploy! 🚀