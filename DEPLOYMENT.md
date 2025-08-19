# MemeTee Vercel Deployment Checklist ✅

Follow these steps to deploy your AI meme t-shirt generator to Vercel:

## 📋 Pre-Deployment Checklist

### ✅ 1. Get Your API Keys Ready

**OpenAI (Required for AI generation):**
- [ ] Go to https://platform.openai.com/api-keys
- [ ] Create a new API key
- [ ] Add billing method (costs ~$0.04 per meme)
- [ ] Copy key (starts with `sk-`)

**Gmail (Required for contact form):**
- [ ] Enable 2-Factor Authentication on your Gmail account
- [ ] Go to Google Account → Security → App passwords
- [ ] Generate app password for "Mail"
- [ ] Copy 16-character password

**Replicate (Optional alternative to OpenAI):**
- [ ] Go to https://replicate.com/account/api-tokens
- [ ] Create API token
- [ ] Copy token (starts with `r8_`)

## 🚀 Deployment Steps

### ✅ 2. Deploy to Vercel

**Option A - Vercel Dashboard (Recommended):**
- [ ] Go to https://vercel.com/new
- [ ] Connect your GitHub/GitLab account
- [ ] Import this repository
- [ ] Click "Deploy" (Vercel auto-detects the config)

**Option B - Vercel CLI:**
- [ ] Install Vercel CLI: `npm i -g vercel`
- [ ] Run: `vercel --prod`
- [ ] Follow prompts

### ✅ 3. Add Environment Variables

In your Vercel project dashboard:
- [ ] Go to Settings → Environment Variables
- [ ] Add these variables:

**Required:**
```
OPENAI_API_KEY = sk-your-openai-key-here
EMAIL_SERVICE = gmail
GMAIL_USER = your-email@gmail.com
GMAIL_APP_PASSWORD = your-16-char-app-password
ADMIN_EMAIL = your-admin-email@gmail.com
```

**Optional:**
```
REPLICATE_API_TOKEN = r8_your-replicate-token-here
```

- [ ] Click "Save" after adding each variable
- [ ] Redeploy the project (Vercel → Deployments → Redeploy)

## 🧪 Testing

### ✅ 4. Test Your Deployment

- [ ] Visit your Vercel URL
- [ ] Test health endpoint: `yoursite.vercel.app/api/health`
- [ ] Upload a test image and generate meme
- [ ] Submit contact form with your email
- [ ] Check spam folder for contact confirmation

## 🎯 Verification Checklist

**AI Generation Working:**
- [ ] Image upload shows preview
- [ ] Loading animation displays
- [ ] Meme generates successfully
- [ ] T-shirt mockup appears
- [ ] "Order" button shows coming soon message

**Contact Form Working:**
- [ ] Form submits without errors
- [ ] Customer receives confirmation email
- [ ] Admin receives notification email
- [ ] Rate limiting works (try submitting rapidly)

**General Functionality:**
- [ ] Site loads on mobile devices
- [ ] All animations work smoothly
- [ ] Navigation links work
- [ ] No console errors

## 🐛 Troubleshooting

**If AI generation fails:**
- [ ] Check Vercel function logs
- [ ] Verify OpenAI API key is correct
- [ ] Ensure you have OpenAI credits
- [ ] Try with Replicate as backup

**If contact form fails:**
- [ ] Verify Gmail app password (not regular password)
- [ ] Check environment variables spelling
- [ ] Ensure 2FA is enabled on Gmail
- [ ] Check spam folder

**If deployment fails:**
- [ ] Check vercel.json syntax
- [ ] Verify package.json dependencies
- [ ] Review Vercel build logs
- [ ] Ensure no syntax errors in API files

## 🎉 Success!

When everything works:
- [ ] AI meme generation ✅
- [ ] T-shirt mockup creation ✅  
- [ ] Contact form emails ✅
- [ ] Coming soon messages ✅
- [ ] Mobile responsive ✅

**Your AI meme t-shirt generator is live! 🚀**

Share your URL and start collecting feedback!

## 📈 Next Steps

- [ ] Set up analytics (Google Analytics)
- [ ] Add payment processing (Stripe)
- [ ] Integrate print-on-demand (Printful)
- [ ] Collect user feedback
- [ ] Plan marketing strategy

## 📞 Need Help?

- Check README.md for detailed instructions
- Review Vercel function logs for errors
- Test API endpoints individually
- Verify all environment variables are set correctly