// Vercel serverless function for AI meme generation - FIXED GPT IMAGE 1 WITH toFile
import OpenAI, { toFile } from 'openai';

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

// 🚀 GPT Image 1 - Image Editing (Image-to-Image) - FIXED WITH toFile
async function generateMemeWithGPTImage1Edit(imageBuffer, prompt, style = 'meme') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Optimized prompt for GPT Image 1 meme generation
    const memePrompt = `Transform this image into a hilarious internet meme. ${prompt || 'Create something funny and clever that will go viral.'}. Add bold, eye-catching meme text overlay with witty captions. Style: ${style}. Make it shareable, engaging, and perfect for social media. Ensure text is clear, readable, and positioned well. High quality meme format with professional text overlay.`;

    console.log('🎨 Generating meme with GPT Image 1 image editing...');
    
    // Use OpenAI's toFile helper to convert Buffer to proper file object
    const imageFile = await toFile(imageBuffer, 'input.png', { type: 'image/png' });
    
    // Using GPT Image 1's image editing capability - CORRECT PARAMETERS
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: memePrompt,
      size: "1024x1024",
      quality: "high",
      background: "auto",
      output_format: "png",
      n: 1
    });

    // GPT Image 1 returns b64_json, not URL
    const imageBase64 = response.data[0].b64_json;
    
    if (!imageBase64) {
      throw new Error('No base64 image data returned from GPT Image 1');
    }

    // Convert base64 to data URL for frontend display
    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('✅ GPT Image 1 image editing successful');
    
    return {
      url: imageUrl,
      provider: 'gpt-image-1-edit',
      prompt: memePrompt,
      base64: imageBase64
    };

  } catch (error) {
    console.error('❌ GPT Image 1 image editing failed:', error);
    throw error;
  }
}

// 🔄 GPT Image 1 Text-to-Image Generation - CORRECT IMPLEMENTATION
async function generateMemeWithGPTImage1Generate(prompt, style = 'meme') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const memePrompt = `Create a funny internet meme image. ${prompt || 'Make it humorous and clever.'}. Style: ${style}. Add bold meme text overlay with witty captions. Make it viral-worthy and shareable for social media. High quality, clear readable text, professional meme format.`;

    console.log('🔄 Generating meme with GPT Image 1 text-to-image...');
    
    // Using GPT Image 1's text-to-image generation - CORRECT PARAMETERS
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: memePrompt,
      size: "1024x1024",
      quality: "high",
      background: "auto",
      output_format: "png",
      n: 1
    });

    // GPT Image 1 returns b64_json, not URL
    const imageBase64 = response.data[0].b64_json;
    
    if (!imageBase64) {
      throw new Error('No base64 image data returned from GPT Image 1');
    }

    // Convert base64 to data URL for frontend display
    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('✅ GPT Image 1 text-to-image successful');
    
    return {
      url: imageUrl,
      provider: 'gpt-image-1-generate',
      prompt: memePrompt,
      base64: imageBase64
    };

  } catch (error) {
    console.error('❌ GPT Image 1 text-to-image failed:', error);
    throw error;
  }
}

// 🆘 DALL-E 3 Legacy Fallback - WORKING IMPLEMENTATION
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
      response_format: "url", // DALL-E 3 can return URLs
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

    let result;
    let attempts = [];
    
    // If image is provided, try image editing first
    if (image) {
      // Convert base64 to buffer
      let imageBuffer;
      try {
        const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
        imageBuffer = Buffer.from(base64Data, 'base64');
        
        // Validate image size (10MB limit)
        if (imageBuffer.length > 10 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            error: 'Image too large. Maximum size is 10MB.'
          });
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image format'
        });
      }

      console.log('🚀 Starting meme generation with GPT Image 1 (OpenAI\'s latest 2025 model)');

      // Try GPT Image 1 image editing first (best for uploaded images)
      try {
        result = await generateMemeWithGPTImage1Edit(imageBuffer, prompt, style);
        attempts.push('gpt-image-1-edit: success');
      } catch (error) {
        attempts.push(`gpt-image-1-edit: ${error.message}`);
        console.log('🔄 GPT Image 1 editing failed, trying text-to-image generation...');
        
        // Try GPT Image 1 text-to-image as fallback
        try {
          result = await generateMemeWithGPTImage1Generate(prompt, style);
          attempts.push('gpt-image-1-generate: success');
        } catch (error) {
          attempts.push(`gpt-image-1-generate: ${error.message}`);
          console.log('🆘 GPT Image 1 failed completely, using DALL-E 3...');
          
          // Final fallback to DALL-E 3
          result = await generateMemeWithDALLE3(prompt, style);
          attempts.push('dall-e-3: success');
        }
      }
    } else {
      // No image provided, use text-to-image generation only
      console.log('🚀 No image provided, using text-to-image generation');
      
      try {
        result = await generateMemeWithGPTImage1Generate(prompt, style);
        attempts.push('gpt-image-1-generate: success');
      } catch (error) {
        attempts.push(`gpt-image-1-generate: ${error.message}`);
        console.log('🆘 GPT Image 1 generation failed, using DALL-E 3...');
        
        // Fallback to DALL-E 3
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
      attempts: attempts,
      has_base64: !!result.base64
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
    } else if (error.message.includes('organization') || error.message.includes('verification')) {
      res.status(403).json({
        success: false,
        error: 'OpenAI organization verification required for GPT Image 1. Please verify your organization at https://platform.openai.com/settings/organization/general',
        code: 'VERIFICATION_REQUIRED'
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