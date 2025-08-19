// Vercel serverless function for AI meme generation - IMPROVED PIPELINE FOR FUNNIER MEMES
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

// 🎯 VISION TO DALL-E PROMPT - GPT-4o creates perfect DALL-E prompt for hilarious memes
async function generateDALLEPromptFromVision(imageBuffer) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    console.log('🎯 GPT-4o analyzing image to create perfect DALL-E meme prompt...');
    
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
              text: `Analyze this image and create a DALL-E prompt that will generate a hilarious internet meme based on what you see. The prompt should be funny, clever, and capture the essence of what makes this image meme-worthy.

Output ONLY the DALL-E prompt - no explanations, no descriptions, just the exact text that DALL-E should use to create the funniest possible meme.

The prompt should include:
- A funny concept that relates to what's happening in the image
- Meme-style text overlay instructions
- Instructions for viral, shareable humor
- High quality image specifications

Output format: Just the raw DALL-E prompt, nothing else.`
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
      max_tokens: 300,
      temperature: 0.8 // Higher temperature for more creative/funny prompts
    });

    const dallePrompt = response.choices[0].message.content.trim();
    console.log('✅ GPT-4o generated DALL-E prompt');
    console.log('🎭 DALL-E Prompt:', dallePrompt.substring(0, 100) + '...');
    
    return dallePrompt;

  } catch (error) {
    console.error('❌ Vision-to-DALL-E prompt generation failed:', error);
    // Return a generic funny prompt if vision fails
    return "A hilarious internet meme with bold text overlay, funny and clever, viral-worthy humor, high quality meme format";
  }
}

// 🎨 DALL-E 3 - Direct from Vision Prompt
async function generateMemeWithDALLE3Direct(visionPrompt) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    console.log('🎨 Generating meme with DALL-E 3 using vision-crafted prompt...');
    console.log('📝 Using prompt:', visionPrompt.substring(0, 150) + '...');
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: visionPrompt,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
      response_format: "url",
      n: 1
    });

    console.log('✅ DALL-E 3 direct meme generation successful');

    return {
      url: response.data[0].url,
      provider: 'dall-e-3-vision-direct',
      prompt: visionPrompt,
      revised_prompt: response.data[0].revised_prompt,
      used_vision: true
    };

  } catch (error) {
    console.error('❌ DALL-E 3 direct generation failed:', error);
    throw error;
  }
}

// 🚀 GPT Image 1 - Direct from Vision Prompt
async function generateMemeWithGPTImage1Direct(visionPrompt) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    console.log('🔄 Generating meme with GPT Image 1 using vision-crafted prompt...');
    console.log('📝 Using prompt:', visionPrompt.substring(0, 150) + '...');
    
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: visionPrompt,
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
    
    console.log('✅ GPT Image 1 direct generation successful');
    
    return {
      url: imageUrl,
      provider: 'gpt-image-1-vision-direct',
      prompt: visionPrompt,
      base64: imageBase64,
      used_vision: true
    };

  } catch (error) {
    console.error('❌ GPT Image 1 direct generation failed:', error);
    throw error;
  }
}

// 🎭 GPT Image 1 Image Editing - Enhanced with Vision Prompt
async function generateMemeWithGPTImage1Edit(imageBuffer, visionPrompt = null) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    // Use vision prompt if available, otherwise fallback
    const memePrompt = visionPrompt || 
      'Transform this image into a hilarious internet meme with bold, eye-catching text overlay and witty captions. Make it shareable, engaging, and perfect for social media. High quality meme format.';

    console.log('🎭 Generating meme with GPT Image 1 image editing...');
    console.log('📝 Using prompt:', memePrompt.substring(0, 150) + '...');
    
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
      provider: 'gpt-image-1-edit-vision',
      prompt: memePrompt,
      base64: imageBase64,
      used_vision: !!visionPrompt
    };

  } catch (error) {
    console.error('❌ GPT Image 1 image editing failed:', error);
    throw error;
  }
}

// 📝 Fallback: Generate Funny Prompt from User Input
function generateFallbackMemePrompt(userPrompt, style = 'meme') {
  const basePrompt = userPrompt || 'Create a funny internet meme';
  return `${basePrompt}. Hilarious internet meme with bold, witty text overlay that will go viral. Clever humor, shareable social media format, high quality with clear readable text. Style: ${style}. Make it extremely funny and engaging.`;
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

    console.log('🚀 Starting IMPROVED PIPELINE for funnier memes');

    let result;
    let attempts = [];
    let visionPrompt = '';
    
    // If image is provided, let GPT-4o create the perfect DALL-E prompt
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
        
        // 🎯 GPT-4o CREATES PERFECT DALL-E PROMPT
        console.log('🎯 Step 1: GPT-4o analyzing image and crafting perfect DALL-E prompt...');
        visionPrompt = await generateDALLEPromptFromVision(imageBuffer);
        attempts.push('vision-prompt-generation: success');
        
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: 'Invalid image format'
        });
      }

      // 🎨 GENERATE MEME USING VISION-CRAFTED PROMPT
      console.log('🎨 Step 2: Generating meme using GPT-4o crafted prompt...');
      
      // 1. Try DALL-E 3 with vision prompt (best quality)
      try {
        result = await generateMemeWithDALLE3Direct(visionPrompt);
        attempts.push('dall-e-3-vision-direct: success');
      } catch (error) {
        attempts.push(`dall-e-3-vision-direct: ${error.message}`);
        console.log('🔄 DALL-E 3 failed, trying GPT Image 1 with vision prompt...');
        
        // 2. Try GPT Image 1 with vision prompt
        try {
          result = await generateMemeWithGPTImage1Direct(visionPrompt);
          attempts.push('gpt-image-1-vision-direct: success');
        } catch (error) {
          attempts.push(`gpt-image-1-vision-direct: ${error.message}`);
          console.log('⚠️ Text-to-image failed, trying image editing with vision prompt...');
          
          // 3. Try GPT Image 1 Image Editing with vision prompt
          try {
            result = await generateMemeWithGPTImage1Edit(imageBuffer, visionPrompt);
            attempts.push('gpt-image-1-edit-vision: success');
          } catch (error) {
            attempts.push(`gpt-image-1-edit-vision: ${error.message}`);
            console.log('🆘 Vision prompt methods failed, trying basic image editing...');
            
            // 4. Final fallback to basic image editing
            result = await generateMemeWithGPTImage1Edit(imageBuffer);
            attempts.push('gpt-image-1-edit-basic: success');
          }
        }
      }
    } else {
      // No image provided - use text-to-image with enhanced prompts
      console.log('🎨 No image provided, generating meme from text prompt...');
      
      const enhancedPrompt = generateFallbackMemePrompt(prompt, style);
      
      // 1. Try DALL-E 3 first (fastest)
      try {
        result = await generateMemeWithDALLE3Direct(enhancedPrompt);
        attempts.push('dall-e-3-text: success');
      } catch (error) {
        attempts.push(`dall-e-3-text: ${error.message}`);
        console.log('🔄 DALL-E 3 failed, trying GPT Image 1...');
        
        // 2. Try GPT Image 1 as fallback
        result = await generateMemeWithGPTImage1Direct(enhancedPrompt);
        attempts.push('gpt-image-1-text: success');
      }
    }

    if (!result) {
      throw new Error('All AI models failed to generate meme');
    }

    console.log(`🎉 Funnier meme generated successfully with ${result.provider}`);
    if (visionPrompt) {
      console.log('🎯 Used GPT-4o vision-crafted prompt for maximum humor');
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
      vision_prompt: visionPrompt ? visionPrompt.substring(0, 200) + '...' : null,
      enhancement: 'vision-direct-prompting'
    });

  } catch (error) {
    console.error('❌ Improved meme generation error:', error);
    
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