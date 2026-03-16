import { GoogleGenerativeAI } from '@google/generative-ai';
import { fal } from '@fal-ai/client';
import OpenAI, { toFile } from 'openai';
import sharp from 'sharp';

const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const key = `meme_${ip}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000;
  const limit = 3;

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

const STYLE_GUIDES = {
  funny: 'Classic internet humor — relatable, lighthearted, and shareable.',
  sarcastic: 'Dry wit, irony, and deadpan commentary. Think "Oh great, another Monday."',
  wholesome: 'Warm, positive, feel-good humor. Uplifting and heartwarming.',
  dark: 'Edgy dark humor — unexpected, morbid twists. Push boundaries but stay clever.',
  political: 'Political satire and social commentary. Sharp, opinionated, topical.',
  absurd: 'Surreal, random, nonsensical humor. The weirder the better. Shitpost energy.',
  roast: 'Savage roast of the person/subject in the photo. Brutally funny but playful.',
};

function buildVisionPrompt(style) {
  const styleGuide = STYLE_GUIDES[style] || STYLE_GUIDES.funny;

  return `Analyze this image. Describe a meme transformation of this photo.

Humor style: ${styleGuide}

Output ONLY the image editing instruction — what should change to make this photo into a viral meme. Keep the person/subject recognizable but add meme elements.

Examples of good outputs:
- "Add dramatic laser eyes, a cape, and the text 'ME AFTER COFFEE' in bold Impact font at the top"
- "Turn this into a Renaissance painting style with the text 'WHEN THE WIFI COMES BACK' in ornate gold lettering"
- "Add explosion effects behind the person with aviator sunglasses and the text 'DEAL WITH IT'"

Output format: Just the raw editing instruction, nothing else.`;
}

async function analyzeImageWithGemini(imageBuffer, visionPrompt) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const base64Image = imageBuffer.toString('base64');

  const result = await model.generateContent([
    visionPrompt,
    { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
  ]);

  return result.response.text().trim();
}

async function analyzeImageWithGrokVision(imageBuffer, visionPrompt) {
  const openai = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' });
  const base64Image = imageBuffer.toString('base64');

  const response = await openai.chat.completions.create({
    model: 'grok-2-vision',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: visionPrompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
        ],
      },
    ],
    max_tokens: 300,
    temperature: 0.8,
  });

  return response.choices[0].message.content.trim();
}

async function analyzeImageWithGPT4oMini(imageBuffer, visionPrompt) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const base64Image = imageBuffer.toString('base64');

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: visionPrompt },
          { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64Image}` } },
        ],
      },
    ],
    max_tokens: 300,
    temperature: 0.8,
  });

  return response.choices[0].message.content.trim();
}

async function generateVisionPrompt(imageBuffer, visionPrompt) {
  if (process.env.GOOGLE_AI_API_KEY) {
    try {
      return await analyzeImageWithGemini(imageBuffer, visionPrompt);
    } catch (error) {
      console.error('Gemini vision failed:', error.message);
    }
  }

  if (process.env.XAI_API_KEY) {
    try {
      return await analyzeImageWithGrokVision(imageBuffer, visionPrompt);
    } catch (error) {
      console.error('Grok vision failed:', error.message);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    return await analyzeImageWithGPT4oMini(imageBuffer, visionPrompt);
  }

  return 'Add funny meme text overlay and visual effects to make this image hilarious and viral-worthy';
}

async function generateImageWithGrokEdit(imageBuffer, prompt) {
  const base64Image = imageBuffer.toString('base64');

  const response = await fetch('https://api.x.ai/v1/images/edits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'grok-imagine-image',
      prompt,
      image: { url: `data:image/jpeg;base64,${base64Image}`, type: 'image_url' },
      n: 1,
      response_format: 'url',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`xAI API error ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  if (!result.data?.[0]?.url) {
    throw new Error('No image URL returned from Grok Imagine');
  }

  return { url: result.data[0].url, provider: 'grok-imagine', used_vision: true };
}

async function generateImageWithFluxEdit(imageBuffer, prompt) {
  fal.config({ credentials: process.env.FAL_KEY });
  const base64Image = imageBuffer.toString('base64');
  const dataUri = `data:image/jpeg;base64,${base64Image}`;

  const result = await fal.subscribe('fal-ai/flux-2-pro/edit', {
    input: {
      prompt,
      image_urls: [dataUri],
      image_size: 'square_hd',
      output_format: 'jpeg',
      safety_tolerance: '5',
    },
  });

  if (!result.data?.images?.[0]?.url) {
    throw new Error('No image URL returned from FLUX 2 Pro edit');
  }

  return { url: result.data.images[0].url, provider: 'flux-2-pro-edit', used_vision: true };
}

async function generateImageWithDallE2Edit(imageBuffer, prompt) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const pngBuffer = await sharp(imageBuffer).png().toBuffer();

  const response = await openai.images.edit({
    model: 'dall-e-2',
    image: await toFile(pngBuffer, 'image.png', { type: 'image/png' }),
    prompt,
    size: '1024x1024',
  });

  if (response.data[0].b64_json) {
    return {
      url: `data:image/png;base64,${response.data[0].b64_json}`,
      provider: 'dall-e-2-edit',
      used_vision: true,
    };
  }

  if (response.data[0].url) {
    return { url: response.data[0].url, provider: 'dall-e-2-edit', used_vision: true };
  }

  throw new Error('No image data returned from DALL-E 2 edit');
}

async function generateImage(imageBuffer, prompt) {
  const errors = [];

  if (process.env.XAI_API_KEY) {
    try {
      return await generateImageWithGrokEdit(imageBuffer, prompt);
    } catch (error) {
      console.error('Grok edit failed:', error.message);
      errors.push(error);
    }
  }

  if (process.env.FAL_KEY) {
    try {
      return await generateImageWithFluxEdit(imageBuffer, prompt);
    } catch (error) {
      console.error('FLUX 2 Pro edit failed:', error.message);
      errors.push(error);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateImageWithDallE2Edit(imageBuffer, prompt);
    } catch (error) {
      console.error('DALL-E 2 edit failed:', error.message);
      errors.push(error);
    }
  }

  throw errors.length > 0 ? errors[errors.length - 1] : new Error('No AI image generation service configured');
}

async function generateImageWithGrokText(prompt) {
  const openai = new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' });

  const response = await openai.images.generate({
    model: 'grok-imagine-image',
    prompt,
    n: 1,
    response_format: 'url',
  });

  if (!response.data?.[0]?.url) {
    throw new Error('No image URL returned from Grok Imagine');
  }

  return { url: response.data[0].url, provider: 'grok-imagine', used_vision: false };
}

async function generateImageWithFluxText(prompt) {
  fal.config({ credentials: process.env.FAL_KEY });

  const result = await fal.subscribe('fal-ai/flux/dev', {
    input: {
      prompt,
      image_size: { width: 1024, height: 1024 },
      num_inference_steps: 28,
      num_images: 1,
      output_format: 'jpeg',
    },
  });

  if (!result.data?.images?.[0]?.url) {
    throw new Error('No image URL returned from FLUX');
  }

  return { url: result.data.images[0].url, provider: 'flux-dev', used_vision: false };
}

async function generateImageWithDALLE3(prompt) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.images.generate({
    model: 'dall-e-3',
    prompt,
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid',
    response_format: 'url',
    n: 1,
  });

  return { url: response.data[0].url, provider: 'dall-e-3', used_vision: false };
}

async function generateImageFromText(prompt) {
  const errors = [];

  if (process.env.XAI_API_KEY) {
    try {
      return await generateImageWithGrokText(prompt);
    } catch (error) {
      console.error('Grok text-to-image failed:', error.message);
      errors.push(error);
    }
  }

  if (process.env.FAL_KEY) {
    try {
      return await generateImageWithFluxText(prompt);
    } catch (error) {
      console.error('FLUX text-to-image failed:', error.message);
      errors.push(error);
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      return await generateImageWithDALLE3(prompt);
    } catch (error) {
      console.error('DALL-E 3 failed:', error.message);
      errors.push(error);
    }
  }

  throw errors.length > 0 ? errors[errors.length - 1] : new Error('No AI image generation service configured');
}

function generateFallbackMemePrompt(userPrompt, style = 'meme') {
  const basePrompt = userPrompt || 'Create a funny internet meme';
  return `${basePrompt}. Hilarious internet meme with bold, witty text overlay that will go viral. Clever humor, shareable social media format, high quality with clear readable text. Style: ${style}. Make it extremely funny and engaging.`;
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

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/json')) {
      return res.status(400).json({ success: false, error: 'Content type must be application/json' });
    }

    const { image, prompt, style } = req.body;

    const hasAnyProvider = process.env.XAI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.FAL_KEY || process.env.OPENAI_API_KEY;
    if (!hasAnyProvider) {
      return res.status(503).json({
        success: false,
        error: 'No AI service configured. Please add XAI_API_KEY, GOOGLE_AI_API_KEY, FAL_KEY, or OPENAI_API_KEY to environment variables.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }

    let result;
    let visionPrompt = '';

    if (image) {
      let imageBuffer;
      try {
        const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');

        if (imageBuffer.length > 10 * 1024 * 1024) {
          return res.status(400).json({ success: false, error: 'Image too large. Maximum size is 10MB.' });
        }

        const styledPrompt = buildVisionPrompt(style);
        visionPrompt = await generateVisionPrompt(imageBuffer, styledPrompt);
      } catch (error) {
        return res.status(400).json({ success: false, error: 'Invalid image format' });
      }

      result = await generateImage(imageBuffer, visionPrompt);
    } else {
      const enhancedPrompt = generateFallbackMemePrompt(prompt, style || 'meme');
      result = await generateImageFromText(enhancedPrompt);
    }

    if (!result) {
      throw new Error('All AI models failed to generate meme');
    }

    res.status(200).json({
      success: true,
      meme_url: result.url,
      provider: result.provider,
      used_vision: result.used_vision,
      vision_prompt: visionPrompt ? visionPrompt.substring(0, 200) + '...' : null,
    });
  } catch (error) {
    console.error('Meme generation error:', error);

    if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      return res.status(408).json({
        success: false,
        error: 'Generation took too long. Please try again with a simpler prompt.',
        code: 'TIMEOUT_ERROR',
      });
    }
    if (error.message.includes('quota') || error.message.includes('billing')) {
      return res.status(402).json({
        success: false,
        error: 'AI API quota exceeded. Please check your billing or try again later.',
        code: 'QUOTA_EXCEEDED',
      });
    }
    if (error.message.includes('content policy') || error.message.includes('safety')) {
      return res.status(400).json({
        success: false,
        error: 'Image content not suitable for meme generation. Please try a different image.',
        code: 'CONTENT_POLICY',
      });
    }
    if (error.message.includes('not configured') || error.message.includes('API key')) {
      return res.status(503).json({
        success: false,
        error: 'AI service not configured. Please add API keys to environment variables.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
    if (error.message.includes('organization') || error.message.includes('verification')) {
      return res.status(403).json({
        success: false,
        error: 'AI provider organization verification required.',
        code: 'VERIFICATION_REQUIRED',
      });
    }

    res.status(500).json({
      success: false,
      error: 'Meme generation failed. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
}
