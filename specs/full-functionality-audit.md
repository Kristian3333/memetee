# Full Functionality Audit — MemeTee Landing Page

## Objective

Verify all advertised features are properly implemented end-to-end, identify gaps, and plan fixes. The CLAUDE.md lists several API endpoints and features; this audit checks what actually exists and works.

---

## Audit Results

### 1. Meme Generator (Upload → AI → Display)

**Status: IMPLEMENTED — Working**

| Component | File | Status |
|-----------|------|--------|
| Upload area (drag-drop + click) | `src/upload.js` | ✅ Complete |
| File validation (type, size) | `src/upload.js` | ✅ Complete |
| Base64 conversion + API call | `src/generator.js` | ✅ Complete |
| Loading steps UI | `src/app.js` | ✅ Complete |
| Meme display | `src/display.js` | ✅ Complete |
| API: Vision analysis (Gemini → Grok → GPT-4o Mini) | `api/generate-meme.js` | ✅ Complete |
| API: Image generation (Grok edit → FLUX edit → GPT Image 1 edit) | `api/generate-meme.js` | ✅ Complete |
| API: Text-only fallback (Grok → FLUX → DALL-E 3) | `api/generate-meme.js` | ✅ Complete |
| Rate limiting (3 req / 5 min) | `api/generate-meme.js` | ✅ Complete |
| 45s client-side timeout | `src/generator.js` | ✅ Complete |

**No issues found.** Full pipeline from upload to meme display is wired.

---

### 2. T-Shirt Preview (CSS Mockup)

**Status: IMPLEMENTED — CSS-only mockup, working**

| Component | File | Status |
|-----------|------|--------|
| CSS t-shirt shape rendering | `src/display.js` + `styles.css` | ✅ Complete |
| Meme overlay on shirt body | `src/display.js:showTshirt()` | ✅ Complete |

**Note:** The t-shirt mockup is a pure CSS/DOM construction (sleeves, body, neckline, meme overlay with `mix-blend-mode: multiply`). There is **no** `api/generate-tshirt-mockup.js` endpoint despite CLAUDE.md listing it — but the CSS approach is simpler and doesn't need a server-side API. The CLAUDE.md is outdated on this point.

**Issue: CLAUDE.md lists `api/generate-tshirt-mockup.js` but it doesn't exist.** The CSS mockup is the actual implementation. CLAUDE.md should be updated.

---

### 3. Contact Form ("Get in Touch")

**Status: IMPLEMENTED — Working**

| Component | File | Status |
|-----------|------|--------|
| HTML form (name, email, message) | `index.html:103-108` | ✅ Complete |
| Client-side validation | `src/contact.js` | ✅ Complete |
| API submission | `src/contact.js:submitContact()` | ✅ Complete |
| Form reset on success | `src/app.js:103` | ✅ Complete |
| Server validation | `api/contact.js` | ✅ Complete |
| Email sending (Gmail/SendGrid/SMTP) | `api/contact.js` | ✅ Complete |
| Demo mode (no email config) | `api/contact.js:123-128` | ✅ Complete |
| Rate limiting (2 req / 5 min) | `api/contact.js` | ✅ Complete |
| Success/error notifications | `src/notify.js` | ✅ Complete |

**Issue: Contact form inputs lack `name` attributes.** The form uses positional `querySelectorAll('input, textarea')` indexing (line 89 of app.js) instead of named fields. This works but is fragile — adding a field would break it.

**Security issue: XSS in email templates.** In `api/contact.js`, user input (`name`, `message`, `email`) is interpolated directly into HTML email templates (lines 130-158) without escaping. A malicious user could inject HTML/JS into the email body. While this only affects the email recipient (not the website), it's still a stored XSS vector in emails.

---

### 4. Address Input / Ordering

**Status: NOT IMPLEMENTED**

The CLAUDE.md mentions:
- `api/process-order.js` — **Does not exist**
- Stripe payments — **Not configured**
- Address collection — **No UI or backend**

The `index.html` pricing section (line 94) correctly says "Ordering coming soon" — so this is intentionally deferred. The `config.js` has pricing config but no order flow.

**This is expected per the current roadmap — no action needed now.**

---

### 5. Health Check

**Status: IMPLEMENTED — Working**

| Component | File | Status |
|-----------|------|--------|
| Health endpoint | `api/health.js` | ✅ Complete |
| Non-blocking check on init | `src/app.js:139` | ✅ Complete |

---

### 6. Notifications System

**Status: IMPLEMENTED — Working**

Max 3 simultaneous, auto-dismiss after 5s, success/error/info types. All properly wired.

---

## Issues to Fix (Priority Order)

### P1 — Security: XSS in Email Templates

**Files:** `api/contact.js`
**Problem:** User-supplied `name`, `email`, and `message` are interpolated directly into HTML strings without escaping.
**Fix:** Add an HTML-escape utility function and apply it to all user inputs before interpolation into HTML email templates.

```
function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
```

**TDD sequence:**
1. Write test: `escapeHtml('<script>alert("xss")</script>')` → `'&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'`
2. Write test: email template with malicious input produces escaped output
3. Implement the escape function and apply it

---

### P2 — Robustness: Contact Form Input Names

**Files:** `index.html`, `src/app.js`
**Problem:** Form inputs have no `name` attributes; extraction relies on DOM order.
**Fix:** Add `name="name"`, `name="email"`, `name="message"` to the HTML inputs and use `form.elements` or a proper selector in `app.js`.

**TDD sequence:**
1. Write test: `handleContactSubmit` correctly extracts values from named form fields
2. Add name attributes to HTML
3. Update app.js to use named access

---

### P3 — Documentation: Update CLAUDE.md

**Files:** `CLAUDE.md`
**Problem:** Lists `api/generate-tshirt-mockup.js` and `api/process-order.js` as existing; they don't.
**Fix:** Update architecture section to reflect reality:
- T-shirt mockup is CSS-based in `src/display.js` (no API)
- `api/process-order.js` is listed as future/planned
- Add `src/` module descriptions

---

### P4 — Minor: Config not loaded by frontend

**Files:** `config.js`, `index.html`
**Problem:** `config.js` defines `window.MEMETEE_CONFIG` but is never loaded in `index.html` (no `<script src="config.js">`). The frontend modules hardcode values (e.g., 10MB limit in upload.js, `/api/generate-meme` in generator.js, `/api/contact` in contact.js) instead of reading from config.
**Fix:** Either load config.js and use it, or remove it since values are hardcoded in the modules. Given the minimalist approach, removing the unused config.js is cleaner.

---

## What's Working Well

- **Clean module architecture:** `src/` modules are well-separated (upload, generator, display, contact, notify)
- **Full AI fallback chain:** Vision (3 providers) + Image gen (3 providers) + Text-only fallback
- **Rate limiting** on both endpoints
- **Error handling** with user-friendly messages and error codes
- **Client-side timeout** (45s) with AbortController
- **CSS t-shirt mockup** is creative and avoids an extra API call
- **Demo mode** for contact form when no email service is configured
- **Unit tests** exist for all frontend modules

---

## Summary

| Feature | Status | Action Needed |
|---------|--------|---------------|
| Meme generator | ✅ Working | None |
| T-shirt preview | ✅ Working (CSS) | Update CLAUDE.md |
| Contact form | ✅ Working | Fix XSS in emails, add input names |
| Address/ordering | ⏳ Planned | None (intentionally deferred) |
| Health check | ✅ Working | None |
| Notifications | ✅ Working | None |
| Config usage | ⚠️ Unused | Remove or integrate config.js |

---

## Acceptance Criteria

1. All user inputs in email templates are HTML-escaped
2. Contact form inputs have `name` attributes
3. CLAUDE.md accurately reflects the codebase
4. No unused config file creating false expectations
5. All existing tests still pass

## Risks and Rollback

- **XSS fix**: Low risk — only affects email HTML formatting. Rollback: revert the escape function.
- **Input names**: Low risk — purely additive HTML change. Rollback: remove attributes.
- **CLAUDE.md update**: Zero risk — documentation only.
- **Config removal**: Low risk — file is never loaded. Rollback: restore file.
