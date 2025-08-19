// MemeTee Configuration File - VERCEL DEPLOYMENT VERSION (Belgium/Europe)
// This configuration works with Vercel serverless functions

window.MEMETEE_CONFIG = {
    // Deployment Configuration
    deployment: {
        platform: 'vercel',
        environment: 'production', // Will be 'development' for local testing
        apiBaseUrl: '', // Empty for relative paths in Vercel
    },
    
    // Pricing (Belgium/Europe)
    pricing: {
        basePrice: 22.99,
        basePriceCents: 2299, // €22.99 in cents
        currency: 'EUR',
        status: 'coming_soon'
    },
    
    // File Upload Settings
    upload: {
        maxFileSize: 10 * 1024 * 1024, // 10MB in bytes
        acceptedTypes: ['image/jpeg', 'image/png', 'image/gif'],
        acceptedExtensions: ['.jpg', '.jpeg', '.png', '.gif']
    },
    
    // AI Service Configuration
    ai: {
        // Meme Generation Settings
        meme: {
            endpoint: '/api/generate-meme',
            prompts: {
                default: 'Create a funny, clever internet meme from this image',
                style: 'internet meme with bold text, high contrast',
                format: 'square image, 1024x1024, high quality'
            },
            parameters: {
                style: 'vivid',
                quality: 'hd',
                size: '1024x1024',
                provider: 'auto' // 'openai', 'replicate', or 'auto'
            }
        },
        
        // T-shirt Mockup Generation Settings
        tshirtMockup: {
            endpoint: '/api/generate-tshirt-mockup',
            prompts: {
                default: 'realistic t-shirt mockup with design printed on front',
                style: 'professional product photography, studio lighting',
                angle: 'front view, centered, slight perspective'
            },
            mockupSettings: {
                tshirtColor: 'white',
                style: 'crew neck',
                fit: 'regular',
                lighting: 'studio',
                background: 'white'
            },
            fallbackEnabled: true // Use placeholder if AI fails
        },
        
        timeout: 30000, // 30 seconds (Vercel function timeout)
        retryAttempts: 1 // Reduced for serverless
    },
    
    // API Endpoints Configuration
    api: {
        health: '/api/health',
        generateMeme: '/api/generate-meme',
        generateTshirtMockup: '/api/generate-tshirt-mockup',
        contact: '/api/contact',
        processOrder: '/api/process-order'
    },
    
    // Coming Soon Features
    comingSoon: {
        payments: true,
        printOnDemand: true,
        userAccounts: true,
        orderTracking: true,
        socialSharing: false, // This works
        analytics: false // This works
    },
    
    // Business Information (Belgium)
    business: {
        name: 'MemeTee',
        email: 'hello@memetee.com',
        phone: '',
        website: 'https://memetee.vercel.app', // Update with your Vercel URL
        support: 'support@memetee.com',
        location: 'Belgium',
        currency: 'EUR',
        region: 'Europe'
    },
    
    // UI Settings
    ui: {
        loadingSteps: [
            { id: 1, text: 'Analyzing your photo', duration: 1500 },
            { id: 2, text: 'Generating meme design', duration: 2000 },
            { id: 3, text: 'Creating t-shirt mockup', duration: 2500 }
        ],
        animations: {
            enableParallax: true,
            enableFloatingEmojis: true,
            transitionDuration: 0.3
        },
        notifications: {
            duration: {
                success: 8000,
                error: 6000,
                warning: 10000
            }
        }
    },
    
    // Feature Flags
    features: {
        enableDragDrop: true,
        enableAnimation: true,
        enableParallax: true,
        enableNotifications: true,
        enableAIGeneration: true, // Main feature that works
        enableContactForm: true, // Works with email
        enablePayments: false, // Coming soon
        enableOrderTracking: false, // Coming soon
        enableMultipleImages: false, // Future feature
        enableBulkOrders: false, // Future feature
        enableSocialSharing: true, // Can implement easily
        enableReviews: false, // Future feature
        enableUserAccounts: false // Future feature
    },
    
    // Error Handling
    errorHandling: {
        maxRetries: 1, // Reduced for serverless
        retryDelay: 1000,
        fallbackImages: {
            meme: 'https://via.placeholder.com/400x400/667eea/white?text=Meme+Coming+Soon',
            tshirt: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop'
        },
        showDetailedErrors: false // Hide in production
    },
    
    // Contact Form Settings
    contact: {
        endpoint: '/api/contact',
        fields: ['name', 'email', 'message'],
        maxMessageLength: 1000,
        autoReply: true,
        rateLimitMessage: 'Please wait before sending another message.'
    },
    
    // Environment Variables (these should be set in Vercel dashboard)
    environmentVariables: {
        required: [
            'OPENAI_API_KEY', // For AI meme generation
            'GMAIL_USER', // For contact form emails
            'GMAIL_APP_PASSWORD' // For contact form emails
        ],
        optional: [
            'REPLICATE_API_TOKEN', // Alternative AI provider
            'SENDGRID_API_KEY', // Alternative email provider
            'ADMIN_EMAIL' // Override admin email
        ]
    },
    
    // Version and Build Info
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    platform: 'vercel',
    supportedBrowsers: ['Chrome', 'Firefox', 'Safari', 'Edge']
};

// Export for Node.js environments (Vercel functions)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.MEMETEE_CONFIG;
}

// Development helper
if (window.location.hostname === 'localhost') {
    window.MEMETEE_CONFIG.development.enableLogging = true;
    window.MEMETEE_CONFIG.development.debugMode = true;
    console.log('🏠 Development mode enabled');
}