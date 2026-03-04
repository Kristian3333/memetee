import OpenAI, { toFile } from 'openai';

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

async function generateDALLEPromptFromVision(imageBuffer) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const base64Image = imageBuffer.toString('base64');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image and create a DALL-E prompt that will generate a hilarious internet meme based on what you see. The prompt should be funny, clever, and capture the essence of what makes this image meme-worthy.

Output ONLY the DALL-E prompt - no explanations, no descriptions, just the exact text that DALL-E should use to create the funniest possible meme.

The prompt should include:
- A funny concept that relates to what's happening in the image
- Meme-style text overlay instructions
- Instructions for viral, shareable humor
- High quality image specifications

Output format: Just the raw DALL-E prompt, nothing else.`,
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${base64Image}` },
            },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.8,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Vision-to-DALL-E prompt generation failed:', error);
    return 'A hilarious internet meme with bold text overlay, funny and clever, viral-worthy humor, high quality meme format';
  }
}

async function generateMemeWithDALLE3Direct(visionPrompt) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: visionPrompt,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
      response_format: 'url',
      n: 1,
    });

    return {
      url: response.data[0].url,
      provider: 'dall-e-3-vision-direct',
      used_vision: true,
    };
  } catch (error) {
    console.error('DALL-E 3 direct generation failed:', error);
    throw error;
  }
}

async function generateMemeWithGPTImage1Direct(visionPrompt) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const response = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: visionPrompt,
      size: '1024x1024',
      quality: 'high',
      background: 'auto',
      output_format: 'png',
      n: 1,
    });

    const imageBase64 = response.data[0].b64_json;

    if (!imageBase64) {
      throw new Error('No base64 image data returned from GPT Image 1');
    }

    return {
      url: `data:image/png;base64,${imageBase64}`,
      provider: 'gpt-image-1-vision-direct',
      used_vision: true,
    };
  } catch (error) {
    console.error('GPT Image 1 direct generation failed:', error);
    throw error;
  }
}

async function generateMemeWithGPTImage1Edit(imageBuffer, visionPrompt = null) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const memePrompt = visionPrompt ||
    'Transform this image into a hilarious internet meme with bold, eye-catching text overlay and witty captions. Make it shareable, engaging, and perfect for social media. High quality meme format.';

  try {
    const imageFile = await toFile(imageBuffer, 'input.png', { type: 'image/png' });

    const response = await openai.images.edit({
      model: 'gpt-image-1',
      image: imageFile,
      prompt: memePrompt,
      size: '1024x1024',
      quality: 'medium',
      background: 'auto',
      output_format: 'png',
      n: 1,
    });

    const imageBase64 = response.data[0].b64_json;

    if (!imageBase64) {
      throw new Error('No base64 image data returned from GPT Image 1');
    }

    return {
      url: `data:image/png;base64,${imageBase64}`,
      provider: 'gpt-image-1-edit-vision',
      used_vision: !!visionPrompt,
    };
  } catch (error) {
    console.error('GPT Image 1 image editing failed:', error);
    throw error;
  }
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

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.',
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

        visionPrompt = await generateDALLEPromptFromVision(imageBuffer);
      } catch (error) {
        return res.status(400).json({ success: false, error: 'Invalid image format' });
      }

      try {
        result = await generateMemeWithDALLE3Direct(visionPrompt);
      } catch (error) {
        try {
          result = await generateMemeWithGPTImage1Direct(visionPrompt);
        } catch (error) {
          try {
            result = await generateMemeWithGPTImage1Edit(imageBuffer, visionPrompt);
          } catch (error) {
            result = await generateMemeWithGPTImage1Edit(imageBuffer);
          }
        }
      }
    } else {
      const enhancedPrompt = generateFallbackMemePrompt(prompt, style || 'meme');

      try {
        result = await generateMemeWithDALLE3Direct(enhancedPrompt);
      } catch (error) {
        result = await generateMemeWithGPTImage1Direct(enhancedPrompt);
      }
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
        error: 'OpenAI API quota exceeded. Please check your billing or try again later.',
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
        error: 'OpenAI service not configured. Please add OPENAI_API_KEY to environment variables.',
        code: 'SERVICE_UNAVAILABLE',
      });
    }
    if (error.message.includes('organization') || error.message.includes('verification')) {
      return res.status(403).json({
        success: false,
        error: 'OpenAI organization verification required for GPT Image 1. Please verify your organization at https://platform.openai.com/settings/organization/general',
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
