# MemeTee Minimalistic Refactor — Implementation Plan

## Objective

**What:** Complete refactor and redesign of the MemeTee landing page to be fully functional but minimalistic.

**Why:** The current codebase has significant bloat:
- `script.js` is 2200+ lines in a single monolith file
- `config.js` has 175+ lines of feature flags for features that don't exist yet
- Heavy glassmorphism CSS with floating emojis feels busy, not clean
- Dead/stub code (`process-order.js`, payment form, coming soon features) clutters the UX
- No tests despite TDD being mandated in CLAUDE.md
- `backend/` duplicates all API logic

**Goal:** A clean, fast, professional landing page that does exactly what it needs to: let users upload a photo, generate a meme, see it on a t-shirt, and contact the team. Nothing more.

---

## Current State Analysis

### What works and must be preserved
1. **AI meme generation pipeline** — GPT-4o Vision → DALL-E 3 (with fallbacks) — this is the core product
2. **T-shirt CSS overlay** — simple and effective, no AI needed
3. **Contact form** — with email via Nodemailer
4. **Health check** — useful for monitoring
5. **Vercel deployment** — serverless functions architecture
6. **Rate limiting** — security essential

### What should be removed/simplified
1. **Payment/order system** — stub code, "coming soon", no real functionality
2. **Floating emoji animations** — visual noise
3. **Parallax scrolling** — unnecessary complexity
4. **15+ feature flags** for non-existent features
5. **backend/ directory** — duplicates API logic, adds maintenance burden
6. **script.js.backup** — dead file
7. **Replicate fallback** — unused if OpenAI is primary
8. **Over-engineered notification system** — 3 types with GSAP animations
9. **Debug logging** with ASCII art in console

### What should be refactored
1. **script.js** — split into focused modules
2. **styles.css** — minimal, modern design system
3. **index.html** — semantic, clean markup
4. **config.js** — only what's actually used

---

## Design Direction

### Visual: "Clean & Confident"
- White/light background with a single accent color (purple #7c3aed)
- Large typography, generous whitespace
- No glassmorphism, no floating emojis, no gradients on everything
- Cards with subtle borders, not blur effects
- One font weight hierarchy: regular (400) and bold (700)
- Mobile-first, max-width 800px content area (focused reading width)

### UX: "Three screens, one flow"
1. **Hero** — headline + upload area (the only CTA above the fold)
2. **Results** — meme + t-shirt side by side (appears after generation)
3. **Contact** — simple form at the bottom

### Sections to keep
- Header (logo + minimal nav)
- Hero with upload
- Results (hidden until generation)
- How it works (3 steps, text only — no cards)
- Pricing (single price, clean)
- Contact form
- Footer

### Sections to remove
- Features grid (redundant with "how it works")
- Payment form
- Floating emojis

---

## Architecture After Refactor

```
memetee-landing-page/
├── index.html                    # Semantic, minimal HTML
├── styles.css                    # Minimal design system (~200 lines)
├── src/
│   ├── app.js                    # Entry point, initialization
│   ├── upload.js                 # File handling & validation
│   ├── generator.js              # AI generation pipeline
│   ├── display.js                # Result rendering (meme + t-shirt)
│   ├── contact.js                # Contact form logic
│   └── notify.js                 # Simple notification helper
├── config.js                     # Trimmed config (~50 lines)
├── api/
│   ├── generate-meme.js          # AI meme generation (cleaned up)
│   ├── generate-tshirt-mockup.js # T-shirt mockup (simplified)
│   ├── contact.js                # Contact form handler (cleaned up)
│   └── health.js                 # Health check (simplified)
├── tests/
│   ├── unit/
│   │   ├── upload.test.js
│   │   ├── generator.test.js
│   │   ├── display.test.js
│   │   ├── contact.test.js
│   │   └── notify.test.js
│   └── integration/
│       ├── generate-meme.test.js
│       ├── contact.test.js
│       └── health.test.js
├── package.json                  # Updated deps
├── vercel.json                   # Simplified
├── jest.config.js                # Test configuration
└── CLAUDE.md
```

### Removed
- `backend/` — entire directory (use `vercel dev` instead)
- `script.js` — replaced by `src/` modules
- `script.js.backup` — dead file
- `api/process-order.js` — stub with no real functionality
- `debug/` — development artifacts
- `import pyautogui.py` — unrelated file

---

## TDD Sequence

Following CLAUDE.md's strict TDD mandate: **write tests first, freeze them, then implement.**

### Phase 0: Setup & Infrastructure
**No tests needed — project scaffolding only**

1. Install test dependencies (`jest`, `@testing-library/dom`, `jsdom`)
2. Create `jest.config.js`
3. Create `src/` directory structure
4. Update `package.json` with test scripts

### Phase 1: Frontend Modules (Unit Tests → Implementation)

#### 1A. notify.js — Notification Helper
**Tests first** (`tests/unit/notify.test.js`):
```
- showNotification('message', 'error') creates an error notification element
- showNotification('message', 'success') creates a success notification element
- notification auto-removes after timeout
- clearNotifications() removes all active notifications
- notification has correct CSS class for type
```
**Then implement** `src/notify.js`:
- Simple DOM-based notifications (no GSAP)
- CSS class-based styling (`.notification--error`, `.notification--success`)
- Auto-dismiss with configurable timeout
- Max 3 notifications visible

#### 1B. upload.js — File Handling
**Tests first** (`tests/unit/upload.test.js`):
```
- validateFile() rejects files over 10MB
- validateFile() rejects non-image files
- validateFile() accepts valid JPEG under 10MB
- validateFile() accepts valid PNG under 10MB
- setupUploadArea() attaches drag-drop listeners to element
- handleFile() calls onFile callback with valid file
- handleFile() calls onError callback with invalid file
- getPreviewUrl() returns object URL for valid image
```
**Then implement** `src/upload.js`:
- Pure functions for validation
- Event handler setup (drag-drop, click-to-upload)
- Returns callbacks, no DOM manipulation beyond upload area

#### 1C. generator.js — AI Generation Pipeline
**Tests first** (`tests/unit/generator.test.js`):
```
- generateMeme(file) calls /api/generate-meme with base64 image
- generateMeme(file) returns meme URL on success
- generateMeme(file) throws on network error
- generateMeme(file) throws on API error response
- generateMeme(file) aborts on timeout (45s)
- generateMeme(file) converts File to base64 correctly
- fileToBase64(file) returns base64 string
```
**Then implement** `src/generator.js`:
- `fileToBase64(file)` — utility
- `generateMeme(file)` — calls API, handles errors
- AbortController for timeout
- Returns `{ memeUrl, provider, visionPrompt }`

#### 1D. display.js — Result Rendering
**Tests first** (`tests/unit/display.test.js`):
```
- showMeme(url, container) creates img element with correct src
- showMeme(url, container) shows loading state then image
- showTshirt(memeUrl, container) creates t-shirt DOM structure
- showTshirt(memeUrl, container) overlays meme on t-shirt body
- showResults(container) makes results section visible
- hideResults(container) hides results section
- resetResults(container) clears previous results
```
**Then implement** `src/display.js`:
- `showMeme(url, container)` — renders meme image
- `showTshirt(memeUrl, container)` — CSS t-shirt with overlay
- `showResults()` / `hideResults()` / `resetResults()`
- No GSAP — use CSS transitions

#### 1E. contact.js — Contact Form
**Tests first** (`tests/unit/contact.test.js`):
```
- validateContactForm({ name, email, message }) returns valid for good input
- validateContactForm() returns error for missing name
- validateContactForm() returns error for invalid email
- validateContactForm() returns error for short message (<10 chars)
- submitContact(data) calls /api/contact with form data
- submitContact(data) returns success message
- submitContact(data) handles rate limit error (429)
- isValidEmail() validates correct emails
- isValidEmail() rejects invalid emails
```
**Then implement** `src/contact.js`:
- `validateContactForm(data)` — pure validation
- `submitContact(data)` — API call
- `isValidEmail(email)` — regex check

#### 1F. app.js — Entry Point
**Tests first** (`tests/unit/app.test.js`):
```
- init() finds all required DOM elements
- init() sets up upload area
- init() sets up contact form
- init() checks backend health
- init() does not throw if health check fails
```
**Then implement** `src/app.js`:
- Wire up modules
- DOM element lookup
- Health check (non-blocking)
- Error boundary

### Phase 2: API Endpoints (Integration Tests → Cleanup)

#### 2A. /api/generate-meme.js
**Tests first** (`tests/integration/generate-meme.test.js`):
```
- POST with valid image returns meme URL
- POST without image returns 400
- POST with oversized image returns 400
- POST with invalid content type returns 400
- GET request returns 405
- Rate limited request returns 429
- Missing API key returns 503
- Response includes required fields (success, meme_url, provider)
```
**Then refactor** `api/generate-meme.js`:
- Remove console.log debug noise
- Extract helper functions
- Simplify error handling
- Keep the GPT-4o Vision → DALL-E pipeline intact
- Keep fallback chain (DALL-E 3 → GPT Image 1 → Image Edit)

#### 2B. /api/contact.js
**Tests first** (`tests/integration/contact.test.js`):
```
- POST with valid data returns success
- POST with missing name returns 400
- POST with invalid email returns 400
- POST with short message returns 400
- GET request returns 405
- Rate limited request returns 429
- Works without email configured (demo mode)
```
**Then refactor** `api/contact.js`:
- Clean up email HTML templates
- Simplify rate limiting
- Remove unnecessary logging

#### 2C. /api/health.js
**Tests first** (`tests/integration/health.test.js`):
```
- GET returns status OK
- Response includes capabilities
- Response includes services status
- Non-GET returns 405
```
**Then refactor** `api/health.js`:
- Simplify to essential fields only
- Remove version info bloat

### Phase 3: Frontend Redesign (HTML + CSS)

#### 3A. index.html — Clean Markup
- Semantic HTML5 (header, main, section, footer)
- Remove floating emojis
- Remove payment section
- Remove GSAP CDN script tag
- Add module script tags for `src/` files
- Clean, readable structure
- Proper meta tags and accessibility

#### 3B. styles.css — Minimal Design System
- CSS custom properties for colors, spacing, typography
- No glassmorphism (remove backdrop-filter)
- No floating emoji animations
- Clean white background, subtle gray accents
- Purple accent (#7c3aed) for CTAs and highlights
- Simple card borders instead of glass effects
- CSS-only transitions (no GSAP dependency)
- Mobile-first responsive (2 breakpoints: 768px, 480px)
- ~200 lines target

### Phase 4: Config & Cleanup

#### 4A. config.js — Trim to essentials
Keep only:
- API endpoints (4 URLs)
- Upload limits (maxSize, acceptedTypes)
- Pricing (price, currency)
- Business info (name, email)
- Loading step labels

Remove:
- 15+ feature flags for non-existent features
- AI provider config (hardcoded in API functions)
- Notification durations (use CSS/defaults)
- Development helpers
- Browser support list
- Duplicate settings

Target: ~50 lines

#### 4B. Cleanup
- Delete `backend/` directory
- Delete `script.js` and `script.js.backup`
- Delete `api/process-order.js`
- Delete `debug/` directory
- Delete `import pyautogui.py`
- Update `vercel.json` (remove process-order function)
- Update `package.json` (add jest, remove unused deps)
- Update `.gitignore`

---

## Implementation Order

```
Phase 0: Setup (scaffolding)
  ↓
Phase 1: Frontend modules (TDD: tests → code)
  1A. notify.js
  1B. upload.js
  1C. generator.js
  1D. display.js
  1E. contact.js
  1F. app.js
  ↓
Phase 2: API cleanup (TDD: tests → refactor)
  2A. generate-meme.js
  2B. contact.js
  2C. health.js
  ↓
Phase 3: Frontend redesign (HTML + CSS)
  3A. index.html
  3B. styles.css
  ↓
Phase 4: Config & cleanup
  4A. config.js trim
  4B. File deletion & project cleanup
  ↓
Phase 5: Integration testing & verification
```

---

## Security Considerations

### Preserved (no changes needed)
- Rate limiting on all API endpoints (3 req / 5 min / IP)
- Input validation (file type, size, form fields)
- Environment variables for all secrets
- CORS headers on API responses
- No dynamic code execution

### Improved by this refactor
- **Removed `process-order.js`** — stub endpoint was a potential attack surface with no value
- **Removed `backend/` server** — eliminates duplicate security surface
- **Smaller attack surface** — fewer files, fewer dependencies, less code to audit
- **No GSAP CDN** — one fewer third-party script (XSS vector)

### Must verify
- CSP headers still work after removing Helmet (Vercel handles this)
- Rate limiting still functional after API cleanup
- No secrets leaked in simplified error messages

---

## Scalability Impact

### Positive
- Smaller bundle = faster page load
- No GSAP = ~50KB less JavaScript to parse
- Modular code = easier to extend later
- Tests = safer to modify

### Neutral
- AI pipeline unchanged — same latency, same cost
- Vercel serverless functions — same scaling model
- Rate limiting — same protection

### No negative impacts expected

---

## Acceptance Criteria

### Functional
- [ ] User can upload an image (drag-drop or click)
- [ ] AI generates a meme from the uploaded image
- [ ] T-shirt mockup displays with meme overlay
- [ ] Contact form sends email successfully
- [ ] Health check endpoint returns status
- [ ] Rate limiting works on all API endpoints
- [ ] Error states show user-friendly messages
- [ ] Mobile responsive (works on 375px+ screens)

### Quality
- [ ] All unit tests pass (Phase 1)
- [ ] All integration tests pass (Phase 2)
- [ ] Test coverage ≥ 90%
- [ ] No file exceeds 150 lines
- [ ] `script.js` monolith is gone (replaced by `src/` modules)
- [ ] Zero hardcoded secrets
- [ ] No dead code or commented-out code

### Performance
- [ ] Page loads in < 2s on 3G (no GSAP, no heavy CSS)
- [ ] Total JS bundle < 20KB (minified)
- [ ] CSS < 10KB

### Design
- [ ] Clean, minimal aesthetic — no visual clutter
- [ ] Single accent color system
- [ ] Proper whitespace and typography hierarchy
- [ ] No floating emojis or parallax effects

---

## Risks and Rollback Strategy

### Risks
1. **AI pipeline regression** — refactoring API files could break the generation flow
   - Mitigation: Integration tests cover the API before we touch it
   - Rollback: API files are individually versioned in git

2. **Missing functionality** — something in the 2200-line script.js does something important we missed
   - Mitigation: Thorough codebase analysis (completed above)
   - Rollback: `script.js.backup` exists, original `script.js` in git history

3. **Email delivery** — contact form refactor could break Nodemailer setup
   - Mitigation: Integration test for contact endpoint
   - Rollback: Revert `api/contact.js` independently

4. **Vercel deployment** — new file structure might not deploy correctly
   - Mitigation: Test with `vercel dev` before `vercel --prod`
   - Rollback: Vercel keeps previous deployments, instant rollback via dashboard

### Rollback strategy
- Every phase is a separate git commit
- Each phase can be reverted independently
- Vercel deployment history provides instant rollback
- No database changes — purely frontend + serverless functions

---

## Estimated Effort

- **Phase 0:** Scaffolding — small
- **Phase 1:** Frontend modules (6 modules × tests + implementation) — largest phase
- **Phase 2:** API cleanup (3 endpoints × tests + refactor) — medium
- **Phase 3:** HTML + CSS redesign — medium
- **Phase 4:** Config trim + file cleanup — small
- **Phase 5:** Integration verification — small
