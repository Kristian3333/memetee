// Vercel serverless function for AI meme generation - UPDATED WITH GPT IMAGE 1
import OpenAI from 'openai';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const key = `meme_${ip}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const limit = 3; // 3 requests per window

  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, []);
  }

  const requests = rateLimitStore.get(key);
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= limit) {
    return false;
  }

  validRequests.push(now);
  rateLimitStore.set(key, validRequests);
  return true;
}

// 🚀 GPT Image 1 - OpenAI's Latest & Most Advanced Image Generation Model (2025)
async function generateMemeWithGPTImage1(imageBuffer, prompt, style = 'meme') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Optimized prompt for GPT Image 1 - superior instruction following
    const memePrompt = `Transform this image into a hilarious internet meme. ${prompt || 'Create something funny and clever that will go viral.'}. Add bold, eye-catching meme text overlay with witty captions. Style: ${style}. Make it shareable, engaging, and perfect for social media. Ensure text is clear, readable, and positioned well. High quality meme format with professional text overlay.`;

    console.log('🎨 Generating meme with GPT Image 1 (OpenAI\'s latest 2025 model)...');
    
    // Using GPT Image 1's image editing capability for image-to-image generation
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageBuffer,
      prompt: memePrompt,
      size: "1024x1024",
      response_format: "url",
      n: 1
    });

    const imageUrl = response.data[0].url;
    console.log('✅ GPT Image 1 meme generation successful');
    
    return {
      url: imageUrl,
      provider: 'gpt-image-1',
      prompt: memePrompt,
      revised_prompt: response.data[0].revised_prompt
    };

  } catch (error) {
    console.error('❌ GPT Image 1 failed:', error);
    
    // If image editing fails, try text-to-image generation as fallback
    if (error.message.includes('image') && !error.message.includes('quota')) {
      console.log('🔄 Image editing failed, trying text-to-image generation...');
      return await generateMemeWithGPTImage1TextOnly(prompt, style);
    }
    
    throw error;
  }
}

// 🔄 GPT Image 1 Text-to-Image Fallback
async function generateMemeWithGPTImage1TextOnly(prompt, style = 'meme') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const memePrompt = `Create a funny internet meme image. ${prompt || 'Make it humorous and clever.'}. Style: ${style}. Add bold meme text overlay with witty captions. Make it viral-worthy and shareable for social media. High quality, clear readable text, professional meme format.`;

    console.log('🔄 Generating meme with GPT Image 1 text-to-image (fallback)...');
    
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: memePrompt,
      size: "1024x1024",
      quality: "hd",
      response_format: "url",
      n: 1
    });

    const imageUrl = response.data[0].url;
    console.log('✅ GPT Image 1 text-to-image fallback successful');
    
    return {
      url: imageUrl,
      provider: 'gpt-image-1-text',
      prompt: memePrompt,
      revised_prompt: response.data[0].revised_prompt
    };

  } catch (error) {
    console.error('❌ GPT Image 1 text-to-image failed:', error);
    throw error;
  }
}

// 🆘 DALL-E 3 Legacy Fallback
async function generateMemeWithDALLE3(prompt, style = 'meme') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const memePrompt = `Create a funny internet meme. ${prompt || 'Make it humorous and clever.'}. Style: ${style}. Add bold text overlay with witty caption. Shareable social media format.`;

    console.log('🆘 Using DALL-E 3 fallback...');
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: memePrompt,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
      n: 1
    });

    return {
      url: response.data[0].url,
      provider: 'dall-e-3-fallback',
      prompt: memePrompt,
      revised_prompt: response.data[0].revised_prompt
    };

  } catch (error) {
    console.error('❌ DALL-E 3 fallback failed:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again in 5 minutes.'
      });
    }

    const contentType = req.headers['content-type'] || '';
    
    let image, prompt, style;
    
    if (contentType.includes('application/json')) {
      const body = req.body;
      image = body.image;
      prompt = body.prompt;
      style = body.style || 'meme';
    } else {
      return res.status(400).json({
        success: false,
        error: 'Content type must be application/json'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to environment variables.',
        code: 'SERVICE_UNAVAILABLE'
      });
    }

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No image provided'
      });
    }

    // Convert base64 to buffer
    let imageBuffer;
    try {
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format'
      });
    }

    // Validate image size (10MB limit)
    if (imageBuffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image too large. Maximum size is 10MB.'
      });
    }

    console.log('🚀 Starting meme generation with GPT Image 1 (OpenAI\'s latest 2025 model)');

    let result;
    let attempts = [];
    
    // Try GPT Image 1 image editing first (best quality, image-to-image)
    try {
      result = await generateMemeWithGPTImage1(imageBuffer, prompt, style);
      attempts.push('gpt-image-1: success');
    } catch (error) {
      attempts.push(`gpt-image-1: ${error.message}`);
      console.log('🔄 GPT Image 1 editing failed, trying text-to-image...');
      
      // Try GPT Image 1 text-to-image as fallback
      try {
        result = await generateMemeWithGPTImage1TextOnly(prompt, style);
        attempts.push('gpt-image-1-text: success');
      } catch (error) {
        attempts.push(`gpt-image-1-text: ${error.message}`);
        console.log('🆘 GPT Image 1 failed, using DALL-E 3 as final fallback...');
        
        // Final fallback to DALL-E 3
        result = await generateMemeWithDALLE3(prompt, style);
        attempts.push('dall-e-3: success');
      }
    }

    if (!result) {
      throw new Error('All OpenAI models failed to generate meme');
    }

    console.log(`🎉 Meme generated successfully with ${result.provider}`);

    res.status(200).json({
      success: true,
      meme_url: result.url,
      provider: result.provider,
      prompt_used: result.prompt,
      revised_prompt: result.revised_prompt,
      generation_time: new Date().toISOString(),
      attempts: attempts
    });

  } catch (error) {
    console.error('❌ Meme generation error:', error);
    
    // Specific error handling
    if (error.message.includes('quota') || error.message.includes('billing')) {
      res.status(402).json({
        success: false,
        error: 'OpenAI API quota exceeded. Please check your billing or try again later.',
        code: 'QUOTA_EXCEEDED'
      });
    } else if (error.message.includes('content policy') || error.message.includes('safety')) {
      res.status(400).json({
        success: false,
        error: 'Image content not suitable for meme generation. Please try a different image.',
        code: 'CONTENT_POLICY'
      });
    } else if (error.message.includes('not configured') || error.message.includes('API key')) {
      res.status(503).json({
        success: false,
        error: 'OpenAI service not configured. Please add OPENAI_API_KEY to environment variables.',
        code: 'SERVICE_UNAVAILABLE'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Meme generation failed. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}