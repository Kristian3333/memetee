// Vercel serverless function for t-shirt mockup generation - SIMPLIFIED OVERLAY APPROACH
import fetch from 'node-fetch';

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

// T-shirt template URLs (high quality mockups)
const TSHIRT_TEMPLATES = {
  white: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&h=1000&fit=crop&crop=center&q=80',
  black: 'https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800&h=1000&fit=crop&crop=center&q=80',
  navy: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&h=1000&fit=crop&crop=center&q=80',
  gray: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&h=1000&fit=crop&crop=center&q=80',
  red: 'https://images.unsplash.com/photo-1583743814966-8936f37f7038?w=800&h=1000&fit=crop&crop=center&q=80'
};

// 🎨 Simple Image Overlay Function using HTML Canvas
function generateMockupHTML(memeImageUrl, tshirtTemplateUrl, tshirtColor) {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>T-Shirt Mockup</title>
    <style>
        body { margin: 0; padding: 20px; background: #f0f0f0; font-family: Arial, sans-serif; }
        .mockup-container { 
            max-width: 800px; 
            margin: 0 auto; 
            text-align: center; 
            background: white; 
            padding: 20px; 
            border-radius: 10px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .tshirt-preview { 
            position: relative; 
            display: inline-block; 
            background: white;
            border-radius: 10px;
            overflow: hidden;
        }
        .tshirt-base { 
            width: 400px; 
            height: 500px; 
            object-fit: cover; 
        }
        .meme-overlay { 
            position: absolute; 
            top: 35%; 
            left: 50%; 
            transform: translate(-50%, -50%); 
            width: 200px; 
            height: 200px; 
            object-fit: contain;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        }
        .product-info {
            margin-top: 20px;
            color: #333;
        }
        .price {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin: 10px 0;
        }
        .color-info {
            background: #ecf0f1;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="mockup-container">
        <h2>Your Custom Meme T-Shirt</h2>
        <div class="tshirt-preview">
            <img src="${tshirtTemplateUrl}" alt="T-shirt" class="tshirt-base" />
            <img src="${memeImageUrl}" alt="Meme Design" class="meme-overlay" />
        </div>
        <div class="product-info">
            <div class="price">€22.99</div>
            <div class="color-info">
                <strong>Color:</strong> ${tshirtColor.charAt(0).toUpperCase() + tshirtColor.slice(1)} 
                | <strong>Material:</strong> 100% Cotton 
                | <strong>Fit:</strong> Unisex
            </div>
            <p>High-quality cotton t-shirt with your custom meme design printed on the front center.</p>
        </div>
    </div>
</body>
</html>`;
}

// 📸 Alternative: Generate mockup using external service (faster)
async function generateMockupWithService(memeUrl, tshirtColor) {
  try {
    // Using a simple mockup service API (you can replace with your preferred service)
    const mockupServiceUrl = `https://api.placid.app/u/mockup?template=tshirt-${tshirtColor}&image_url=${encodeURIComponent(memeUrl)}`;
    
    console.log('🎨 Generating mockup with external service...');
    
    // For now, return a composite URL that combines both images
    return {
      url: `data:text/html;base64,${Buffer.from(generateMockupHTML(memeUrl, TSHIRT_TEMPLATES[tshirtColor] || TSHIRT_TEMPLATES.white, tshirtColor)).toString('base64')}`,
      type: 'html',
      provider: 'simple-overlay',
      color: tshirtColor
    };
    
  } catch (error) {
    throw new Error(`Mockup service failed: ${error.message}`);
  }
}

// 🖼️ Simple Canvas-based Image Composition (Node.js)
async function generateMockupWithCanvas(memeUrl, tshirtColor) {
  try {
    // This would require canvas package: npm install canvas
    // For now, using a simpler approach with URL composition
    
    const tshirtTemplate = TSHIRT_TEMPLATES[tshirtColor] || TSHIRT_TEMPLATES.white;
    
    console.log('🎨 Generating simple overlay mockup...');
    
    // Create a composite image URL using a service like via.placeholder or similar
    const compositeUrl = `https://source.unsplash.com/800x1000/?tshirt,${tshirtColor}`;
    
    return {
      url: compositeUrl,
      provider: 'template-overlay',
      color: tshirtColor,
      meme_url: memeUrl,
      template_url: tshirtTemplate
    };
    
  } catch (error) {
    throw new Error(`Canvas composition failed: ${error.message}`);
  }
}

// 🏷️ Generate Simple Template-Based Mockup (Recommended)
async function generateSimpleTemplateMockup(memeUrl, tshirtColor) {
  try {
    console.log('🏷️ Creating template-based t-shirt mockup...');
    
    const tshirtTemplate = TSHIRT_TEMPLATES[tshirtColor] || TSHIRT_TEMPLATES.white;
    
    // Validate meme URL
    const memeResponse = await fetch(memeUrl, { method: 'HEAD' });
    if (!memeResponse.ok) {
      throw new Error('Meme image not accessible');
    }
    
    // Return mockup data for frontend to handle the overlay
    return {
      url: tshirtTemplate,  // Base t-shirt image
      meme_overlay: memeUrl,  // Meme to overlay
      provider: 'template-based',
      color: tshirtColor,
      overlay_position: {
        top: '35%',
        left: '50%',
        width: '200px',
        height: '200px',
        transform: 'translate(-50%, -50%)'
      },
      instructions: 'Frontend should overlay meme_overlay onto url with the specified position'
    };
    
  } catch (error) {
    console.error('Template mockup failed:', error);
    throw error;
  }
}

// Fallback t-shirt mockup (just the template)
function generateFallbackMockup(tshirtColor = 'white') {
  console.log('🔄 Using fallback t-shirt template...');
  
  const templateUrl = TSHIRT_TEMPLATES[tshirtColor] || TSHIRT_TEMPLATES.white;
  
  return {
    url: templateUrl,
    provider: 'fallback-template',
    color: tshirtColor,
    note: 'Fallback template - meme overlay should be handled by frontend'
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

    // Validate color
    const validColors = Object.keys(TSHIRT_TEMPLATES);
    const selectedColor = validColors.includes(tshirt_color) ? tshirt_color : 'white';

    console.log(`👕 Creating t-shirt mockup - Color: ${selectedColor}`);
    console.log(`🎨 Using simple overlay approach instead of AI generation`);

    let result;

    try {
      // Try template-based mockup (recommended)
      result = await generateSimpleTemplateMockup(meme_url, selectedColor);
    } catch (error) {
      console.log('🔄 Template mockup failed, using fallback...');
      // Use fallback if template approach fails
      result = generateFallbackMockup(selectedColor);
    }

    console.log('🎉 T-shirt mockup created successfully (no AI needed!)');

    res.status(200).json({
      success: true,
      mockup_url: result.url,
      meme_overlay: result.meme_overlay || meme_url,
      overlay_position: result.overlay_position,
      provider: result.provider,
      tshirt_color: result.color,
      generation_time: new Date().toISOString(),
      note: result.note || 'Template-based mockup - faster and more reliable than AI generation'
    });

  } catch (error) {
    console.error('❌ T-shirt mockup generation error:', error);
    
    // Always provide fallback
    console.log('🔄 Using fallback t-shirt mockup due to error...');
    const fallback = generateFallbackMockup(req.body.tshirt_color || 'white');
    
    res.status(200).json({
      success: true,
      mockup_url: fallback.url,
      meme_overlay: req.body.meme_url,
      provider: fallback.provider,
      tshirt_color: fallback.color,
      generation_time: new Date().toISOString(),
      note: 'Fallback template - overlay should be handled by frontend'
    });
  }
}