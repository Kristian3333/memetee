# Optimal AI Pipeline for MemeTee Meme Generation

## Objective

**What:** Redesign the AI pipeline to maximize meme quality, minimize content-policy rejections, and optimize cost.

**Why:** The current pipeline has three bottlenecks:
1. **Quality** — We use text-to-image (FLUX/DALL-E), which generates a *new* image from a text description of the user's photo. The user's likeness is completely lost. Image-to-image would preserve the subject.
2. **Content policy** — OpenAI (our fallback) is the most restrictive provider. It frequently blocks legitimate meme requests involving people, humor, and caricature. Even FLUX and Gemini have moderate restrictions.
3. **Cost** — Two API calls per meme (vision + generation), with FLUX at $0.012-0.03/image and OpenAI fallbacks at $0.04-0.17/image.

---

## Research Summary

### Provider Comparison (March 2026)

| Provider | Model | $/image | img2img | Text render | People policy | Node.js SDK |
|----------|-------|---------|---------|-------------|---------------|-------------|
| **xAI** | Grok Imagine | $0.02 | Yes | Moderate | Most permissive | OpenAI-compatible |
| **xAI** | Grok Imagine Pro | $0.07 | Yes | Good | Most permissive | OpenAI-compatible |
| **fal.ai** | FLUX 2 Dev | $0.012 | Yes | Moderate | Permissive | `@fal-ai/client` |
| **fal.ai** | FLUX 2 Pro | $0.03 | Yes (multi-ref) | Moderate | Permissive | `@fal-ai/client` |
| **fal.ai** | Ideogram V3 Turbo | $0.03 | Yes (remix) | **Best (90%)** | Moderate | `@fal-ai/client` |
| **Google** | Imagen 4 Fast | $0.02 | Limited | Moderate | Restrictive | `@google/genai` |
| **OpenAI** | GPT Image 1 Mini | $0.006 | Yes | Poor | **Most restrictive** | `openai` |
| **OpenAI** | DALL-E 3 | $0.04 | No | Poor | **Most restrictive** | `openai` |
| **OpenAI** | GPT Image 1 | $0.04-0.17 | Yes | Moderate | **Most restrictive** | `openai` |
| **Stability** | SDXL | $0.004 | Yes | Poor | Moderate | `stability-ai` |

### Content Policy Ranking (most → least permissive)

1. **xAI Grok Imagine** — Designed for memes. Only blocks sexualized real-person content.
2. **FLUX 2 Pro** — Moderate API-level moderation. Few reports of over-blocking.
3. **Stability AI** — NSFW filter but permissive for SFW humor.
4. **Ideogram** — Privacy-focused (consent required for real people), but humor allowed.
5. **Google Imagen** — Blocks real-person likenesses. Configurable safety but conservative defaults.
6. **OpenAI** — Blocks named public figures, aggressive prompt filtering, frequent false positives on creative requests.

### Image-to-Image vs Text-to-Image

| Factor | Text-to-Image (current) | Image-to-Image (proposed) |
|--------|-------------------------|---------------------------|
| Likeness preservation | None — generates new image | Preserves face/body |
| Creative control | High (detailed text prompt) | Medium (prompt + source image) |
| Cost | 2 calls (vision + gen) | 2 calls (vision + img2img edit) |
| Content policy risk | Lower (fictional output) | Higher (real person input) |
| Personalization | Low | **High** |

**Key insight:** For a t-shirt product, users want to see **themselves** (or their context) on the shirt. Image-to-image is fundamentally better for this use case.

---

## Recommended Pipeline

### Architecture: Hybrid Vision + Image-to-Image

```
User Photo (base64)
    │
    ├─► [Vision: Gemini 2.5 Flash] → analyzes photo, crafts meme concept & transformation prompt
    │   (fallback: Grok vision via xAI chat API)
    │   (fallback: GPT-4o Mini)
    │
    ├─► [Image Edit: Grok Imagine] → transforms original photo into meme using the prompt
    │   (fallback: FLUX 2 Pro edit via fal.ai)
    │   (fallback: GPT Image 1 edit via OpenAI)
    │
    └─► Response: { success, meme_url, provider, used_vision, vision_prompt }
```

### Why This Combination

**Vision: Gemini 2.5 Flash (primary)**
- Free tier for analysis
- Excellent multimodal understanding
- No image generation restrictions on the analysis step

**Image Generation: xAI Grok Imagine (primary)**
- **$0.02/image** — cheaper than FLUX Pro ($0.03) and DALL-E 3 ($0.04)
- **Most permissive content policy** — explicitly designed for meme/humor content
- **Image-to-image support** via `/images/edits` endpoint — preserves user's likeness
- **OpenAI-SDK-compatible** — no new npm dependency needed, just point the `openai` package at `https://api.x.ai/v1`
- **Good quality** — competitive with DALL-E 3 for stylized/meme content

**Fallback 1: FLUX 2 Pro edit (via fal.ai)**
- $0.03/image, multi-reference editing
- Already installed (`@fal-ai/client`)
- Natural language editing without masks

**Fallback 2: GPT Image 1 edit (via OpenAI)**
- Already installed (`openai` package)
- High-fidelity face preservation
- Most restrictive but reliable last resort

### Cost per Meme

| Component | Primary | Fallback 1 | Fallback 2 |
|-----------|---------|------------|------------|
| Vision | Gemini: **free** | Grok chat: ~$0.001 | GPT-4o Mini: ~$0.001 |
| Image gen | Grok Imagine: **$0.02** | FLUX 2 Pro edit: $0.03 | GPT Image 1: $0.04+ |
| **Total** | **$0.02** | $0.031 | $0.041+ |

vs. current pipeline: ~$0.012-0.045/meme. Primary path is **$0.02** (comparable to FLUX dev, with better content policy and img2img).

---

## Files to Modify

| File | Action | Why |
|------|--------|-----|
| `api/generate-meme.js` | **Rewrite** | New img2img pipeline with Grok primary, FLUX/OpenAI fallback |
| `api/health.js` | **Edit** | Add xAI/Grok service status |
| `package.json` | **No change** | Grok uses `openai` SDK (already installed). `@fal-ai/client` already installed. |
| `CLAUDE.md` | **Edit** | Update AI provider descriptions |

## New Environment Variables

```
XAI_API_KEY=...          # xAI API key for Grok Imagine
GOOGLE_AI_API_KEY=...    # Google AI Studio (Gemini vision) — already configured
FAL_KEY=...              # fal.ai (FLUX fallback) — already configured
OPENAI_API_KEY=...       # OpenAI (last-resort fallback) — already configured
```

---

## Implementation

### Step 1: Rewrite `api/generate-meme.js`

**Vision prompt function** — keep `analyzeImageWithGemini` as primary. Add `analyzeImageWithGrok` as second option (using xAI chat API with vision). Keep `analyzeImageWithGPT4oMini` as last fallback.

The vision prompt should be updated for img2img context:

```
Analyze this image. Describe a hilarious meme transformation of this photo.
Output ONLY the image editing instruction — what should change to make this photo
into a viral meme. Keep the person/subject recognizable but add meme elements.

Examples of good outputs:
- "Add dramatic laser eyes, a cape, and the text 'ME AFTER COFFEE' in bold Impact font at the top"
- "Turn this into a Renaissance painting style with the text 'WHEN THE WIFI COMES BACK' in ornate gold lettering"
- "Add explosion effects behind the person with aviator sunglasses and the text 'DEAL WITH IT'"

Output format: Just the raw editing instruction, nothing else.
```

**Image generation functions:**

1. `generateImageWithGrokEdit(imageBuffer, prompt)` — NEW
   - Uses `openai` SDK pointed at `https://api.x.ai/v1` with `XAI_API_KEY`
   - Calls `/images/edits` with `model: 'grok-imagine-image'`
   - Passes original photo + meme transformation prompt
   - Returns `{ url, provider: 'grok-imagine', used_vision: true }`

2. `generateImageWithFluxEdit(imageBuffer, prompt)` — MODIFY existing
   - Change from text-to-image to image editing
   - Use `fal-ai/flux-2-pro/edit` endpoint instead of `fal-ai/flux/dev`
   - Pass original image + prompt for transformation
   - Returns `{ url, provider: 'flux-2-pro-edit', used_vision: true }`

3. `generateImageWithGPTImage1Edit(imageBuffer, prompt)` — RESTORE (was in original code)
   - Uses `openai` SDK
   - Calls `/images/edits` with `model: 'gpt-image-1'`
   - Returns `{ url, provider: 'gpt-image-1-edit', used_vision: true }`

**Fallback chain:**

```js
async function generateImage(imageBuffer, prompt) {
  // 1. Try Grok Imagine (cheapest, most permissive)
  if (process.env.XAI_API_KEY) {
    try { return await generateImageWithGrokEdit(imageBuffer, prompt); }
    catch (e) { console.error('Grok edit failed:', e.message); }
  }

  // 2. Try FLUX 2 Pro edit (good quality img2img)
  if (process.env.FAL_KEY) {
    try { return await generateImageWithFluxEdit(imageBuffer, prompt); }
    catch (e) { console.error('FLUX edit failed:', e.message); }
  }

  // 3. Try GPT Image 1 edit (reliable last resort)
  if (process.env.OPENAI_API_KEY) {
    try { return await generateImageWithGPTImage1Edit(imageBuffer, prompt); }
    catch (e) { console.error('GPT Image 1 edit failed:', e.message); }
  }

  throw new Error('All AI image generation services failed');
}
```

**Important change:** The `generateImage` function now takes `imageBuffer` as first arg (for img2img), not just a text prompt. The handler passes the original photo to ALL generation functions.

For the no-image path (text prompt only, no photo uploaded), fall back to text-to-image:

```js
async function generateImageFromText(prompt) {
  // Text-to-image fallback when no photo is uploaded
  // Grok text-to-image → FLUX text-to-image → DALL-E 3
}
```

### Step 2: Update `api/health.js`

Add xAI service status:

```js
services: {
  xai: !!process.env.XAI_API_KEY,
  gemini: !!process.env.GOOGLE_AI_API_KEY,
  fal: !!process.env.FAL_KEY,
  openai: !!process.env.OPENAI_API_KEY,
  ...email services
}
```

### Step 3: Update `CLAUDE.md`

- AI (primary): Gemini 2.5 Flash (vision) + xAI Grok Imagine (img2img generation)
- AI (fallback): FLUX 2 Pro edit via fal.ai, GPT Image 1 edit via OpenAI

---

## TDD Sequence

Frontend tests are **frozen and provider-agnostic** — they mock `fetch` and test the HTTP contract only. No frontend test changes needed.

The frozen test contract (from `tests/unit/generator.test.js`):
- POST to `/api/generate-meme` with `{ image: base64 }`
- Success response: `{ success, meme_url, provider, vision_prompt }`
- Error responses: QUOTA_EXCEEDED, CONTENT_POLICY, TIMEOUT_ERROR, SERVICE_UNAVAILABLE
- 45-second AbortController timeout

All changes are backend-only (`api/generate-meme.js`, `api/health.js`).

**Verification:**
1. `npm test` — all 86 existing tests pass
2. Manual end-to-end test with `vercel dev`

---

## Security Considerations

- **XAI_API_KEY** stored as environment variable (same pattern as existing keys)
- Grok uses OpenAI-compatible SDK — no new attack surface from SDK code
- No new user-facing input surfaces — same base64 image upload
- xAI has content safety filters (blocks explicit/harmful content)
- Rate limiting unchanged (3 req/5min/IP)
- Image buffer passed directly to APIs — no new file system operations

---

## Scalability Impact

### Positive
- **Lower cost** per meme ($0.02 vs $0.012-0.045)
- **Fewer content policy rejections** = higher success rate = fewer retries
- **Better personalization** via img2img = higher user satisfaction

### Neutral
- Same latency profile (vision + generation = 2 sequential API calls)
- Same serverless architecture (Vercel functions)
- Same rate limiting

### Risk
- xAI API is newer/less battle-tested than OpenAI. Mitigated by fallback chain.
- Grok Imagine cold starts on serverless. Mitigated by 45s frontend timeout.

---

## Acceptance Criteria

- [ ] `npm test` passes all 86 tests (no test modifications)
- [ ] Primary pipeline uses Grok Imagine for img2img meme generation
- [ ] Meme output preserves recognizable elements from the original photo
- [ ] Fallback chain: Grok → FLUX edit → GPT Image 1 edit
- [ ] Vision chain: Gemini → Grok chat → GPT-4o Mini
- [ ] Health endpoint reports xai, gemini, fal, openai service status
- [ ] No hardcoded API keys
- [ ] Works with only `XAI_API_KEY` set (minimum viable config)
- [ ] Works with only `OPENAI_API_KEY` set (backward compatible)

---

## Risks and Rollback Strategy

### Risks

1. **xAI API reliability** — newer service, potentially less stable
   - Mitigation: Automatic fallback to FLUX and OpenAI
   - Monitor: Track provider field in responses

2. **Grok Imagine img2img quality** — may not match FLUX/DALL-E for certain styles
   - Mitigation: If Grok quality is insufficient, swap primary to FLUX 2 Pro edit
   - The fallback chain makes this a config change, not a code rewrite

3. **FLUX 2 Pro edit API differences** — edit endpoint may have different input format than text-to-image
   - Mitigation: Test with fal.ai playground before implementation

4. **Content policy false sense of security** — Grok's permissiveness could allow borderline content
   - Mitigation: Keep rate limiting. The app is for t-shirts, not mass content generation.

### Rollback

- Revert `api/generate-meme.js` to the previous version (text-to-image with FLUX/OpenAI)
- All fallback providers remain installed and configured
- Instant rollback via Vercel deployment history

---

## Alternative Considered: Ideogram for Text Rendering

Ideogram V3 has 90% text rendering accuracy vs ~30% for other models. If meme text quality is critical (e.g., Impact font overlays must be readable), adding Ideogram as a text-overlay post-processing step could improve quality. However:
- Ideogram is $0.03-0.06/image (adds cost)
- It's an additional API call (adds latency)
- The current pipeline renders text via the AI model, which is "good enough" for memes
- Can be added later as an enhancement if text quality becomes a user complaint

**Decision:** Skip Ideogram for now. Revisit if text rendering quality is insufficient.
