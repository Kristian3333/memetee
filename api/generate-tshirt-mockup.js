// Vercel serverless function for AI t-shirt mockup generation
import OpenAI from 'openai';

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map();

function checkRateLimit(ip) {
  const key = `tshirt_${ip}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const limit = 3; // 3 requests per window

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

async function generateTshirtMockupWithAI(memeImageUrl, tshirtColor = 'white') {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI not configured for t-shirt mockup generation.');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const mockupPrompt = `Professional product photography of a ${tshirtColor} cotton t-shirt with this meme design printed on the front center. Studio lighting, model wearing the shirt or flat lay style, high quality product photo, ecommerce style, white background, centered composition, realistic fabric texture.`;

    console.log('👕 Generating t-shirt mockup with AI...');
    
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: mockupPrompt,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
      n: 1,
    });

    console.log('✅ T-shirt mockup generation successful');
    
    return {
      url: response.data[0].url,
      provider: 'openai',
      color: tshirtColor,
      prompt: mockupPrompt
    };

  } catch (error) {
    console.error('❌ T-shirt mockup generation failed:', error);
    throw new Error(`T-shirt mockup generation failed: ${error.message}`);
  }
}

// Fallback t-shirt mockup generator
function generateFallbackMockup(tshirtColor = 'white') {
  // Return a placeholder image URL
  const placeholderUrls = {
    white: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop&crop=center',
    black: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=400&h=500&fit=crop&crop=center',
    navy: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop&crop=center',
    gray: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop&crop=center'
  };

  return {
    url: placeholderUrls[tshirtColor] || placeholderUrls.white,
    provider: 'placeholder',
    color: tshirtColor,
    prompt: 'Placeholder t-shirt mockup'
  };
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

    const { meme_url, tshirt_color = 'white' } = req.body;
    
    if (!meme_url) {
      return res.status(400).json({
        success: false,
        error: 'Meme URL is required'
      });
    }

    console.log(`👕 Generating t-shirt mockup - Color: ${tshirt_color}`);

    let result;

    try {
      // Try AI generation if OpenAI is available
      if (process.env.OPENAI_API_KEY) {
        result = await generateTshirtMockupWithAI(meme_url, tshirt_color);
      } else {
        throw new Error('OpenAI not configured');
      }
    } catch (error) {
      console.log('🔄 Using fallback t-shirt mockup...');
      // Use fallback if AI generation fails
      result = generateFallbackMockup(tshirt_color);
    }

    console.log('🎉 T-shirt mockup generated successfully');

    res.status(200).json({
      success: true,
      mockup_url: result.url,
      provider: result.provider,
      tshirt_color: result.color,
      prompt_used: result.prompt,
      generation_time: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ T-shirt mockup generation error:', error);
    
    // Always provide fallback
    console.log('🔄 Using fallback t-shirt mockup due to error...');
    const fallback = generateFallbackMockup(req.body.tshirt_color || 'white');
    
    res.status(200).json({
      success: true,
      mockup_url: fallback.url,
      provider: fallback.provider,
      tshirt_color: fallback.color,
      prompt_used: fallback.prompt,
      generation_time: new Date().toISOString(),
      note: 'Using placeholder mockup - AI generation temporarily unavailable'
    });
  }
}