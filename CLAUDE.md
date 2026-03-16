# MemeTee Landing Page

## Overview
AI-powered meme t-shirt generator. Users upload photos, the app creates hilarious memes using a two-stage AI pipeline (Gemini 2.5 Flash vision analysis + Grok Imagine image-to-image editing via xAI), displays realistic t-shirt mockups, and allows ordering (coming soon, EUR 22.99). Includes contact form for launch notifications. FLUX 2 Pro edit (fal.ai) and GPT Image 1 edit (OpenAI) serve as fallbacks.

## Tech Stack
- Language: JavaScript (Node.js)
- Frontend: HTML5, CSS3, vanilla JavaScript (ES modules in src/)
- Backend: Vercel Serverless Functions
- AI (primary): Google Gemini 2.5 Flash (vision), xAI Grok Imagine (img2img generation)
- AI (fallback): FLUX 2 Pro edit via fal.ai, GPT Image 1 edit via OpenAI
- Email: Nodemailer
- Payments: Stripe (future)
- Testing: Jest
- Build: Vercel deployment

## Architecture
Static HTML frontend with Vercel serverless API functions. Frontend uses modular ES modules in src/.
- index.html — Main landing page
- src/app.js — Entry point: wires upload, generator, display, contact, notify modules
- src/upload.js — File upload validation and drag-drop setup
- src/generator.js — AI meme generation pipeline (base64 conversion, API call, 45s timeout)
- src/display.js — DOM rendering for meme results and CSS t-shirt mockup
- src/contact.js — Contact form validation and API submission
- src/notify.js — Toast notification system
- styles.css — Styling with CSS t-shirt mockup
- api/generate-meme.js — Gemini vision → Grok Imagine img2img edit (fallback: FLUX 2 Pro edit → GPT Image 1 edit)
- api/contact.js — Contact form handler (Nodemailer)
- api/health.js — Health check with service status

## Key Conventions
- Serverless functions in api/
- Frontend is vanilla HTML/CSS/JS (no framework)
- Rate limiting: 3 requests per 5-minute window per IP (meme), 2 per 5 min (contact)
- AI fallbacks: Gemini → Grok vision → GPT-4o Mini (vision); Grok Imagine edit → FLUX 2 Pro edit → GPT Image 1 edit (image gen)
- Belgium/Europe focused (EUR pricing)

## Engineering Standards

### Test-Driven Development (Strict TDD)

This project follows strict TDD. The workflow is ALWAYS:

1. **Design tests first** based on the specification
2. **Freeze the tests** — once written, tests are NOT modified to make them pass
3. **Write code** that makes the frozen tests pass
4. **Refactor** only after all tests are green

#### Test Structure
- Unit tests for every public function
- Integration tests for API endpoints
- Coverage target: 90% minimum
- Tests must be deterministic

### Security
- Never hardcode secrets, API keys, tokens, or credentials anywhere
- All secrets via environment variables (.env)
- Validate and sanitize ALL external input
- HTML-escape user input in email templates
- Rate limiting on all public-facing endpoints
- No dynamic code execution from external input

### Code Quality
- Functions do one thing and are short enough to read without scrolling
- Errors are handled explicitly — never silently swallowed
- Dead code is deleted, not commented out

## NEVER Do
- NEVER modify test assertions to make tests pass — fix the code instead
- NEVER hardcode API keys, tokens, passwords, or any secret
- NEVER use dynamic code execution
- NEVER catch broad exceptions without re-raising or logging
- NEVER store sensitive data in logs
- NEVER commit .env files, credentials, or private keys
- NEVER expose internal errors or stack traces to clients
- NEVER assume external input is safe — validate everything

## Common Commands
- `vercel dev` — Run Vercel dev server
- `vercel --prod` — Deploy to production
- `npm test` — Run tests
- `npm install` — Install dependencies

## Current Status
- [x] Meme generator (upload → AI vision → img2img → display)
- [x] CSS t-shirt mockup preview
- [x] Contact form with email notifications
- [x] Health check endpoint
- [ ] Order processing (api/process-order.js — planned)
- [ ] Stripe payment integration (planned)
