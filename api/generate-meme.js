// Vercel serverless function for AI meme generation - WITH VISION ANALYSIS
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

// 🔍 VISION ANALYSIS - Analyze uploaded image to create detailed description
async function analyzeImageWithVision(imageBuffer) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    console.log('🔍 Analyzing uploaded image with GPT-4o Vision...');
    
    // Convert buffer to base64 for vision API
    const base64Image = imageBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image in detail for meme creation. Describe: 1) What is happening in the image 2) People's expressions/emotions 3) Objects and setting 4) Any text visible 5) The overall mood/context 6) What makes this image potentially funny or meme-worthy. Be very descriptive and specific - this description will be used to create a meme."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const description = response.choices[0].message.content;
    console.log('✅ Vision analysis complete');
    console.log('📝 Image description:', description.substring(0, 100) + '...');
    
    return description;

  } catch (error) {
    console.error('❌ Vision analysis failed:', error);
    // Return a generic description if vision fails
    return "an interesting image that could make a great meme";
  }
}

// 🎨 DALL-E 3 - Enhanced with Vision Description
async function generateMemeWithDALLE3Enhanced(prompt, style = 'meme', imageDescription = '') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Create enhanced prompt with image description
    const enhancedPrompt = imageDescription 
      ? `Create a hilarious internet meme based on this image: "${imageDescription}". ${prompt || 'Make it funny and clever with perfect text overlay.'}. Style: ${style}. Add bold, witty meme text that relates to what's happening in the image. Make it viral-worthy and shareable. High quality with clear, readable text overlay.`
      : `Create a funny internet meme. ${prompt || 'Make it humorous and clever.'}. Style: ${style}. Add bold text overlay with witty caption. Shareable social media format. High quality with clear, readable text.`;

    console.log('🎨 Generating enhanced meme with DALL-E 3...');
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
      response_format: "url",
      n: 1
    });

    console.log('✅ DALL-E 3 enhanced meme generation successful');

    return {
      url: response.data[0].url,
      provider: 'dall-e-3-enhanced',
      prompt: enhancedPrompt,
      revised_prompt: response.data[0].revised_prompt,
      used_vision: !!imageDescription
    };

  } catch (error) {
    console.error('❌ DALL-E 3 enhanced generation failed:', error);
    throw error;
  }
}

// 🚀 GPT Image 1 - Enhanced with Vision Description  
async function generateMemeWithGPTImage1Enhanced(prompt, style = 'meme', imageDescription = '') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const enhancedPrompt = imageDescription 
      ? `Create a hilarious internet meme based on this image: "${imageDescription}". ${prompt || 'Make it funny and clever with perfect text overlay.'}. Style: ${style}. Add bold, witty meme text that relates to what's happening in the image. Make it viral-worthy and shareable for social media. High quality, clear readable text, professional meme format.`
      : `Create a funny internet meme image. ${prompt || 'Make it humorous and clever.'}. Style: ${style}. Add bold meme text overlay with witty captions. Make it viral-worthy and shareable for social media. High quality, clear readable text, professional meme format.`;

    console.log('🔄 Generating enhanced meme with GPT Image 1...');
    
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: enhancedPrompt,
      size: "1024x1024",
      quality: "high",
      background: "auto",
      output_format: "png",
      n: 1
    });

    const imageBase64 = response.data[0].b64_json;
    
    if (!imageBase64) {
      throw new Error('No base64 image data returned from GPT Image 1');
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('✅ GPT Image 1 enhanced generation successful');
    
    return {
      url: imageUrl,
      provider: 'gpt-image-1-enhanced',
      prompt: enhancedPrompt,
      base64: imageBase64,
      used_vision: !!imageDescription
    };

  } catch (error) {
    console.error('❌ GPT Image 1 enhanced generation failed:', error);
    throw error;
  }
}

// 🎭 GPT Image 1 Image Editing - Keep as final option
async function generateMemeWithGPTImage1Edit(imageBuffer, prompt, style = 'meme') {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const memePrompt = `Transform this image into a hilarious internet meme. ${prompt || 'Create something funny and clever that will go viral.'}. Add bold, eye-catching meme text overlay with witty captions. Style: ${style}. Make it shareable, engaging, and perfect for social media. Ensure text is clear, readable, and positioned well. High quality meme format with professional text overlay.`;

    console.log('🎭 Generating meme with GPT Image 1 image editing (direct image input)...');
    
    const imageFile = await toFile(imageBuffer, 'input.png', { type: 'image/png' });
    
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: imageFile,
      prompt: memePrompt,
      size: "1024x1024",
      quality: "medium",
      background: "auto",
      output_format: "png",
      n: 1
    });

    const imageBase64 = response.data[0].b64_json;
    
    if (!imageBase64) {
      throw new Error('No base64 image data returned from GPT Image 1');
    }

    const imageUrl = `data:image/png;base64,${imageBase64}`;
    
    console.log('✅ GPT Image 1 image editing successful');
    
    return {
      url: imageUrl,
      provider: 'gpt-image-1-edit',
      prompt: memePrompt,
      base64: imageBase64,
      used_vision: false
    };

  } catch (error) {
    console.error('❌ GPT Image 1 image editing failed:', error);
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

    console.log('🚀 Starting VISION-ENHANCED meme generation');

    let result;
    let attempts = [];
    let imageDescription = '';
    
    // If image is provided, analyze it first with vision
    if (image) {
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
        
        // 🔍 ANALYZE IMAGE WITH VISION FIRST
        console.log('🔍 Step 1: Analyzing image content...');
        imageDescription = await analyzeImageWithVision(imageBuffer);
        attempts.push('vision-analysis: success');
        
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image format'
        });
      }

      // 🎨 ENHANCED GENERATION WITH VISION DESCRIPTION
      console.log('🎨 Step 2: Generating meme with vision-enhanced prompts...');
      
      // 1. Try DALL-E 3 Enhanced (fastest, with vision description)
      try {
        result = await generateMemeWithDALLE3Enhanced(prompt, style, imageDescription);
        attempts.push('dall-e-3-enhanced: success');
      } catch (error) {
        attempts.push(`dall-e-3-enhanced: ${error.message}`);
        console.log('🔄 DALL-E 3 enhanced failed, trying GPT Image 1 enhanced...');
        
        // 2. Try GPT Image 1 Enhanced (with vision description)
        try {
          result = await generateMemeWithGPTImage1Enhanced(prompt, style, imageDescription);
          attempts.push('gpt-image-1-enhanced: success');
        } catch (error) {
          attempts.push(`gpt-image-1-enhanced: ${error.message}`);
          console.log('⚠️ Enhanced methods failed, trying direct image editing...');
          
          // 3. Try GPT Image 1 Image Editing (direct image input, slower)
          try {
            result = await generateMemeWithGPTImage1Edit(imageBuffer, prompt, style);
            attempts.push('gpt-image-1-edit: success');
          } catch (error) {
            attempts.push(`gpt-image-1-edit: ${error.message}`);
            console.log('🆘 All methods failed, using basic DALL-E 3...');
            
            // 4. Final fallback to basic DALL-E 3
            result = await generateMemeWithDALLE3Enhanced(prompt, style);
            attempts.push('dall-e-3-basic: success');
          }
        }
      }
    } else {
      // No image provided - use text-to-image methods
      console.log('🎨 No image provided, using text-to-image generation...');
      
      // 1. Try DALL-E 3 first (fastest)
      try {
        result = await generateMemeWithDALLE3Enhanced(prompt, style);
        attempts.push('dall-e-3: success');
      } catch (error) {
        attempts.push(`dall-e-3: ${error.message}`);
        console.log('🔄 DALL-E 3 failed, trying GPT Image 1...');
        
        // 2. Try GPT Image 1 as fallback
        result = await generateMemeWithGPTImage1Enhanced(prompt, style);
        attempts.push('gpt-image-1: success');
      }
    }

    if (!result) {
      throw new Error('All AI models failed to generate meme');
    }

    console.log(`🎉 Meme generated successfully with ${result.provider}`);
    if (imageDescription) {
      console.log('👁️ Used vision analysis for enhanced quality');
    }

    res.status(200).json({
      success: true,
      meme_url: result.url,
      provider: result.provider,
      prompt_used: result.prompt,
      revised_prompt: result.revised_prompt,
      generation_time: new Date().toISOString(),
      attempts: attempts,
      has_base64: !!result.base64,
      used_vision: result.used_vision,
      image_description: imageDescription ? imageDescription.substring(0, 200) + '...' : null,
      enhancement: 'vision-enhanced'
    });

  } catch (error) {
    console.error('❌ Meme generation error:', error);
    
    // Specific error handling
    if (error.message.includes('timeout') || error.name === 'TimeoutError') {
      res.status(408).json({
        success: false,
        error: 'Generation took too long. Please try again with a simpler prompt.',
        code: 'TIMEOUT_ERROR'
      });
    } else if (error.message.includes('quota') || error.message.includes('billing')) {
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