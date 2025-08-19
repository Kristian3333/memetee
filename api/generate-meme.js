// Vercel serverless function for AI meme generation - FIXED
import OpenAI from 'openai';
import Replicate from 'replicate';

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

async function generateMemeWithOpenAI(imageBuffer, prompt, style = 'meme') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Create a detailed prompt for meme generation
    const memePrompt = `Create a funny internet meme based on this image. ${prompt || 'Make it humorous and clever.'}. Style: ${style}. Add bold text overlay with a witty caption. Make it suitable for social media sharing. High quality, clear text, internet meme format.`;

    console.log('🎨 Generating meme with OpenAI DALL-E...');
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: memePrompt,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
      n: 1,
    });

    const imageUrl = response.data[0].url;
    console.log('✅ OpenAI meme generation successful');
    
    return {
      url: imageUrl,
      provider: 'openai',
      prompt: memePrompt,
      revised_prompt: response.data[0].revised_prompt
    };

  } catch (error) {
    console.error('❌ OpenAI meme generation failed:', error);
    throw new Error(`OpenAI generation failed: ${error.message}`);
  }
}

async function generateMemeWithReplicate(imageBuffer, prompt, style = 'meme') {
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    // Convert image to base64 data URL
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;
    
    const memePrompt = `Transform this image into a funny internet meme. ${prompt || 'Make it humorous and relatable.'}. Style: ${style}. Add meme text overlay. Make it shareable and engaging.`;

    console.log('🎨 Generating meme with Replicate...');

    // Using SDXL model for meme generation
    const output = await replicate.run(
      "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      {
        input: {
          image: base64Image,
          prompt: memePrompt,
          negative_prompt: "blurry, low quality, distorted, nsfw, inappropriate",
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 20,
          seed: Math.floor(Math.random() * 1000000)
        }
      }
    );

    if (!output || output.length === 0) {
      throw new Error('No output generated from Replicate');
    }

    console.log('✅ Replicate meme generation successful');
    
    return {
      url: output[0],
      provider: 'replicate',
      prompt: memePrompt
    };

  } catch (error) {
    console.error('❌ Replicate meme generation failed:', error);
    throw new Error(`Replicate generation failed: ${error.message}`);
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

    // Handle both JSON and form data
    const contentType = req.headers['content-type'] || '';
    console.log('Content-Type:', contentType);
    
    let image, prompt, style, provider;
    
    // Handle JSON request (from our frontend)
    if (contentType.includes('application/json')) {
      const body = req.body;
      image = body.image;
      prompt = body.prompt;
      style = body.style || 'meme';
      provider = body.provider || 'auto';
    } else {
      // This was the original multipart handling - remove the strict requirement
      return res.status(400).json({
        success: false,
        error: 'Content type must be application/json'
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
      // Remove data URL prefix if present
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

    console.log(`🚀 Starting meme generation - Provider: ${provider}, Style: ${style}`);

    let result;
    
    // Choose AI provider based on preference and availability
    if (provider === 'openai' || (provider === 'auto' && process.env.OPENAI_API_KEY)) {
      result = await generateMemeWithOpenAI(imageBuffer, prompt, style);
    } else if (provider === 'replicate' || (provider === 'auto' && process.env.REPLICATE_API_TOKEN)) {
      result = await generateMemeWithReplicate(imageBuffer, prompt, style);
    } else {
      throw new Error('No AI service available. Please configure OpenAI or Replicate API keys.');
    }

    // Log successful generation
    console.log(`🎉 Meme generated successfully with ${result.provider}`);

    res.status(200).json({
      success: true,
      meme_url: result.url,
      provider: result.provider,
      prompt_used: result.prompt,
      revised_prompt: result.revised_prompt,
      generation_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Meme generation error:', error);
    
    // Specific error handling
    if (error.message.includes('quota') || error.message.includes('billing')) {
      res.status(402).json({
        success: false,
        error: 'AI service quota exceeded. Please try again later or contact support.',
        code: 'QUOTA_EXCEEDED'
      });
    } else if (error.message.includes('content policy') || error.message.includes('safety')) {
      res.status(400).json({
        success: false,
        error: 'Image content not suitable for meme generation. Please try a different image.',
        code: 'CONTENT_POLICY'
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