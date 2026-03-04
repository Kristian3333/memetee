# MemeTee Landing Page

## Overview
AI-powered meme t-shirt generator. Users upload photos, the app creates hilarious memes using a two-stage AI pipeline (GPT-4o Vision analysis + DALL-E 3 generation), displays realistic t-shirt mockups, and allows ordering (coming soon, EUR 22.99). Includes contact form for launch notifications.

## Tech Stack
- Language: JavaScript (Node.js)
- Frontend: HTML5, CSS3, vanilla JavaScript, GSAP 3.12.2 (animations)
- Backend: Express.js, Vercel Serverless Functions
- AI: OpenAI (GPT-4o Vision, DALL-E 3, GPT Image 1)
- Alternative AI: Replicate
- Image Processing: Sharp
- Email: Nodemailer
- Payments: Stripe (future)
- Security: Helmet, rate-limiter-flexible, Joi (validation)
- Testing: Jest
- Build: Vercel deployment

## Architecture
Static HTML frontend with Vercel serverless API functions. Separate Express backend for development.
- index.html — Main landing page
- script.js — Frontend logic (2200+ lines)
- styles.css — Styling with animations
- config.js — Global config (API endpoints, pricing, AI settings, feature flags)
- api/generate-meme.js — Main feature: GPT-4o vision then DALL-E prompt then meme generation
- api/generate-tshirt-mockup.js — T-shirt mockup creation
- api/contact.js — Contact form handler (Nodemailer)
- api/process-order.js — Order processing
- api/health.js — Health check
- backend/ — Alternative Express.js backend for development

## Key Conventions
- Serverless functions in api/
- Frontend is vanilla HTML/CSS/JS (no framework)
- Config centralized in config.js
- Rate limiting: 3 requests per 5-minute window per IP
- AI fallbacks: DALL-E 3 then GPT Image 1 then Image Editing
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
- Validate and sanitize ALL external input (Joi validation)
- Rate limiting on all public-facing endpoints
- Helmet for security headers
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
- `cd backend && npm run dev` — Run Express backend locally
- `cd backend && npm test` — Run tests
- `npm install` — Install dependencies

## Current Status
<!-- Update this section at the end of each work session -->
- [ ] Initial project setup
