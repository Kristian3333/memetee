// MemeTee Landing Page JavaScript - VERCEL DEPLOYMENT VERSION (Belgium/Europe)

// Configuration for Vercel deployment
const CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    PRICE: 2299, // €22.99 in cents
    CURRENCY: 'EUR',
    API_ENDPOINTS: {
        generateMeme: '/api/generate-meme',
        generateTshirtMockup: '/api/generate-tshirt-mockup',
        processOrder: '/api/process-order',
        contactForm: '/api/contact',
        health: '/api/health'
    }
};

// DOM Elements
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loading-text');
const previewSection = document.getElementById('preview-section');
const originalPreview = document.getElementById('original-preview');
const memeImage = document.getElementById('meme-image');
const tshirtMockup = document.getElementById('tshirt-mockup');
const memePlaceholder = document.getElementById('meme-placeholder');
const tshirtPlaceholder = document.getElementById('tshirt-placeholder');
const orderBtn = document.getElementById('order-btn');
const paymentSection = document.getElementById('payment-section');

// Loading steps
const steps = {
    1: document.getElementById('step-1'),
    2: document.getElementById('step-2'),
    3: document.getElementById('step-3')
};

// Store generated content
let generatedMemeUrl = null;
let generatedTshirtUrl = null;
let uploadedImageData = null;

// Initialize the application
function init() {
    try {
        setupEventListeners();
        initializeAnimations();
        checkBackendHealth();
        
        console.log('🚀 MemeTee initialized for Vercel deployment (Belgium/Europe)');
        console.log('🎯 API Endpoints configured for serverless functions');
        console.log('💰 Pricing set to EUR for European market');
    } catch (error) {
        console.error('Error initializing app:', error);
    }
}

// Check if backend API is working
async function checkBackendHealth() {
    try {
        const response = await fetch(CONFIG.API_ENDPOINTS.health);
        const health = await response.json();
        
        console.log('🏥 Backend Health:', health);
        console.log('🤖 AI Services:', health.services);
        
        if (!health.services?.ai?.openai && !health.services?.ai?.replicate) {
            console.warn('⚠️ No AI services configured. Meme generation will not work.');
            showWarning('AI services not configured. Please add API keys to environment variables.');
        } else {
            console.log('✅ AI services ready for meme generation!');
        }
    } catch (error) {
        console.error('❌ Backend not reachable:', error);
        showError('API not responding. Please check deployment.');
    }
}

// Setup all event listeners
function setupEventListeners() {
    // File upload events
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    fileInput.addEventListener('change', handleFileSelect);
    
    // Payment form (coming soon)
    document.getElementById('payment-form').addEventListener('submit', handlePaymentSubmit);
    
    // Contact form - WITH REAL EMAIL FUNCTIONALITY
    document.getElementById('contact-form').addEventListener('submit', handleContactSubmit);
    
    // Navigation smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    // Parallax effect
    window.addEventListener('scroll', handleParallax);
}

// Initialize animations
function initializeAnimations() {
    // Animate floating emojis
    gsap.to('.floating-emoji', {
        y: '+=20',
        rotation: '+=10',
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut',
        stagger: 0.5
    });
    
    // Initial page animations
    gsap.from('.hero h1', {
        opacity: 0,
        y: 50,
        duration: 1,
        ease: 'power3.out'
    });
    
    gsap.from('.hero p', {
        opacity: 0,
        y: 30,
        duration: 1,
        delay: 0.3,
        ease: 'power3.out'
    });
    
    gsap.from('.upload-section', {
        opacity: 0,
        scale: 0.9,
        duration: 1,
        delay: 0.6,
        ease: 'back.out(1.7)'
    });
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// File handling and validation
function handleFile(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showError('Please upload an image file (JPG, PNG, or GIF).');
        return;
    }

    // Validate file size
    if (file.size > CONFIG.MAX_FILE_SIZE) {
        showError('File size must be less than 10MB.');
        return;
    }

    // Show original image preview
    const reader = new FileReader();
    reader.onload = (e) => {
        uploadedImageData = e.target.result; // Store base64 data
        originalPreview.src = e.target.result;
        previewSection.style.display = 'block';
        
        // Animate the preview appearance
        gsap.from(previewSection, {
            opacity: 0,
            y: 50,
            duration: 0.8,
            ease: "power2.out"
        });
    };
    reader.readAsDataURL(file);

    // Start AI generation process
    generateAIContent(file);
}

// 🤖 REAL AI GENERATION WITH VERCEL SERVERLESS FUNCTIONS
async function generateAIContent(file) {
    try {
        // Show loading state
        loading.style.display = 'block';
        resetLoadingSteps();
        
        // Step 1: Analyzing photo
        updateLoadingStep(1, 'active');
        loadingText.textContent = 'Analyzing your photo...';
        await delay(1000);
        updateLoadingStep(1, 'completed');
        
        // Step 2: Generate meme with REAL AI
        updateLoadingStep(2, 'active');
        loadingText.textContent = 'AI is creating your hilarious meme...';
        await generateMemeWithRealAI(file);
        updateLoadingStep(2, 'completed');
        
        // Step 3: Generate t-shirt mockup with REAL AI
        updateLoadingStep(3, 'active');
        loadingText.textContent = 'AI is generating realistic t-shirt preview...';
        await generateTshirtMockupWithRealAI();
        updateLoadingStep(3, 'completed');
        
        // Show final results
        hideLoading();
        showFinalResults();
        
    } catch (error) {
        console.error('Error in AI generation:', error);
        hideLoading();
        
        // Handle specific AI errors
        if (error.message.includes('quota') || error.message.includes('billing')) {
            showError('AI service quota exceeded. Please try again later or contact support.');
        } else if (error.message.includes('content policy')) {
            showError('Image content not suitable for meme generation. Please try a different image.');
        } else if (error.message.includes('not configured')) {
            showError('AI services not configured. Please contact support.');
        } else {
            showError('Sorry, there was an error generating your meme. Please try again.');
        }
    }
}

// 🎨 REAL MEME GENERATION WITH VERCEL API - FIXED
async function generateMemeWithRealAI(file) {
    try {
        console.log('🎨 Starting REAL AI meme generation with Vercel...');
        
        // Convert file to base64 for API
        const base64Data = uploadedImageData.split(',')[1]; // Remove data URL prefix
        
        console.log('📤 Sending request to API...');
        
        // REAL API CALL TO VERCEL SERVERLESS FUNCTION - FIXED CONTENT TYPE
        const response = await fetch(CONFIG.API_ENDPOINTS.generateMeme, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Data,
                prompt: 'Create a funny, clever internet meme from this image',
                style: 'meme',
                provider: 'auto'
            })
        });
        
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
            const error = await response.json();
            console.error('API Error:', error);
            throw new Error(error.error || 'Meme generation failed');
        }
        
        const result = await response.json();
        
        if (result.success && result.meme_url) {
            generatedMemeUrl = result.meme_url;
            showMeme(result.meme_url);
            
            console.log('✅ Meme generated successfully with:', result.provider);
            console.log('🎯 Prompt used:', result.prompt_used);
            
            // Track successful generation
            if (typeof gtag !== 'undefined') {
                gtag('event', 'ai_meme_generated', {
                    'event_category': 'AI',
                    'provider': result.provider
                });
            }
        } else {
            throw new Error('Invalid response from meme generation API');
        }
        
    } catch (error) {
        console.error('❌ Meme generation failed:', error);
        throw error;
    }
}

// 👕 REAL T-SHIRT MOCKUP GENERATION WITH VERCEL API
async function generateTshirtMockupWithRealAI() {
    try {
        if (!generatedMemeUrl) {
            throw new Error('No meme URL available for t-shirt mockup');
        }
        
        console.log('👕 Starting REAL AI t-shirt mockup generation...');
        
        // REAL API CALL TO VERCEL SERVERLESS FUNCTION
        const response = await fetch(CONFIG.API_ENDPOINTS.generateTshirtMockup, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meme_url: generatedMemeUrl,
                tshirt_color: 'white'
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'T-shirt mockup generation failed');
        }
        
        const result = await response.json();
        
        if (result.success && result.mockup_url) {
            generatedTshirtUrl = result.mockup_url;
            showTshirtMockup(result.mockup_url);
            
            console.log('✅ T-shirt mockup generated successfully');
            
            // Track successful generation
            if (typeof gtag !== 'undefined') {
                gtag('event', 'ai_tshirt_generated', {
                    'event_category': 'AI',
                    'color': result.tshirt_color
                });
            }
        } else {
            throw new Error('Invalid response from t-shirt mockup API');
        }
        
    } catch (error) {
        console.error('❌ T-shirt mockup generation failed:', error);
        
        // For t-shirt mockup failures, we can continue with a fallback
        console.log('🔄 Using fallback t-shirt mockup...');
        showTshirtMockupFallback();
    }
}

// Fallback t-shirt mockup (simple placeholder)
function showTshirtMockupFallback() {
    // Use a placeholder t-shirt image
    const fallbackUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop&crop=center';
    generatedTshirtUrl = fallbackUrl;
    showTshirtMockup(fallbackUrl);
}

// Display generated meme
function showMeme(memeUrl) {
    memeImage.src = memeUrl;
    memeImage.style.display = 'block';
    memePlaceholder.style.display = 'none';
    
    // Animate the meme appearance
    gsap.from(memeImage, {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        ease: "back.out(1.7)"
    });
}

// Display t-shirt mockup
function showTshirtMockup(mockupUrl) {
    tshirtMockup.src = mockupUrl;
    tshirtMockup.style.display = 'block';
    tshirtPlaceholder.style.display = 'none';
    
    // Animate the mockup appearance
    gsap.from(tshirtMockup, {
        opacity: 0,
        scale: 0.8,
        duration: 0.8,
        delay: 0.2,
        ease: "back.out(1.7)"
    });
}

// Show final results and order button
function showFinalResults() {
    orderBtn.style.display = 'inline-block';
    
    // Animate order button
    gsap.from(orderBtn, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        delay: 0.5,
        ease: "power2.out"
    });
    
    // Add subtle animations to result cards
    gsap.from('.result-card', {
        y: 20,
        stagger: 0.2,
        duration: 0.8,
        ease: "power2.out"
    });
    
    // Track successful AI generation completion
    if (typeof gtag !== 'undefined') {
        gtag('event', 'ai_generation_complete', {
            'event_category': 'AI',
            'event_label': 'success'
        });
    }
}

// Loading step management
function resetLoadingSteps() {
    Object.values(steps).forEach(step => {
        step.className = 'step';
    });
}

function updateLoadingStep(stepNumber, status) {
    const step = steps[stepNumber];
    if (step) {
        step.className = `step ${status}`;
        
        if (status === 'completed') {
            step.innerHTML = step.innerHTML.replace('⏳', '✅');
        } else if (status === 'active') {
            step.innerHTML = step.innerHTML.replace('⏳', '⚡');
        }
    }
}

// Show payment section (coming soon)
function showPayment() {
    paymentSection.style.display = 'block';
    
    // Animate payment section
    gsap.from(paymentSection, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: "power2.out"
    });
    
    // Scroll to payment section
    paymentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Handle payment form submission (coming soon)
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submit-payment');
    const originalText = submitButton.textContent;
    
    // Update button state
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;

    try {
        // Prepare order data
        const orderData = {
            memeDesign: generatedMemeUrl,
            tshirtPreview: generatedTshirtUrl,
            size: document.getElementById('size').value,
            color: document.getElementById('color').value,
            price: CONFIG.PRICE,
            currency: CONFIG.CURRENCY,
            timestamp: new Date().toISOString()
        };

        // Call coming soon API
        const response = await fetch(CONFIG.API_ENDPOINTS.processOrder, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(`🚧 ${result.message}\n\n${result.details}\n\nOrder ID: ${result.orderId}`);
            
            // Reset form
            document.getElementById('payment-form').reset();
            
            // Hide payment section after showing message
            setTimeout(() => {
                paymentSection.style.display = 'none';
            }, 3000);
        } else {
            throw new Error(result.error || 'Order processing failed');
        }

    } catch (error) {
        console.error('Payment error:', error);
        showError('There was an error processing your order. Payment integration coming soon!');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// 📧 REAL CONTACT FORM FUNCTIONALITY WITH VERCEL API
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    
    // Get form data
    const formData = {
        name: form.querySelector('input[placeholder="Your Name"]').value.trim(),
        email: form.querySelector('input[placeholder="Your Email"]').value.trim(),
        message: form.querySelector('textarea[placeholder*="Your Message"]').value.trim()
    };
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
        showError('Please fill in all fields.');
        return;
    }
    
    if (!isValidEmail(formData.email)) {
        showError('Please enter a valid email address.');
        return;
    }
    
    // Update button state
    submitButton.textContent = 'Sending...';
    submitButton.disabled = true;
    
    try {
        console.log('Sending contact form via Vercel API...');
        
        // REAL API CALL TO VERCEL SERVERLESS FUNCTION
        const response = await fetch(CONFIG.API_ENDPOINTS.contactForm, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccess(result.message || 'Message sent successfully! We\'ll get back to you within 24 hours.');
            form.reset();
            
            // Track successful contact form submission
            if (typeof gtag !== 'undefined') {
                gtag('event', 'contact_form_submit', {
                    'event_category': 'Contact',
                    'event_label': 'success'
                });
            }
        } else {
            throw new Error(result.error || 'Failed to send message');
        }
        
    } catch (error) {
        console.error('Contact form error:', error);
        
        // Show user-friendly error message
        if (error.message.includes('rate limit') || error.message.includes('Too many')) {
            showError('You\'ve sent too many messages recently. Please wait a few minutes before trying again.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            showError('Network error. Please check your connection and try again.');
        } else {
            showError('Failed to send message. Please try again or email us directly at hello@memetee.com');
        }
        
        // Track failed contact form submission
        if (typeof gtag !== 'undefined') {
            gtag('event', 'contact_form_error', {
                'event_category': 'Contact',
                'event_label': error.message
            });
        }
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// Email validation helper
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Utility functions
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function hideLoading() {
    loading.style.display = 'none';
}

function showError(message) {
    const notification = createNotification(message, 'error');
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 6000);
}

function showSuccess(message) {
    const notification = createNotification(message, 'success');
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 8000);
}

function showWarning(message) {
    const notification = createNotification(message, 'warning');
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 10000);
}

function createNotification(message, type) {
    const notification = document.createElement('div');
    
    let backgroundColor;
    switch(type) {
        case 'error':
            backgroundColor = 'linear-gradient(45deg, #ff4757, #ff6b6b)';
            break;
        case 'warning':
            backgroundColor = 'linear-gradient(45deg, #ffa502, #ff6348)';
            break;
        default:
            backgroundColor = 'linear-gradient(45deg, #2ed573, #7bed9f)';
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        max-width: 400px;
        padding: 20px;
        border-radius: 10px;
        color: white;
        font-weight: 600;
        z-index: 1000;
        backdrop-filter: blur(10px);
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        line-height: 1.4;
        background: ${backgroundColor};
    `;
    notification.textContent = message;
    
    // Animate in
    gsap.from(notification, {
        opacity: 0,
        x: 100,
        duration: 0.5,
        ease: "back.out(1.7)"
    });
    
    return notification;
}

// Parallax effect handler
function handleParallax() {
    const scrolled = window.pageYOffset;
    const rate = scrolled * -0.5;
    const hero = document.querySelector('.hero');
    if (hero) {
        hero.style.transform = `translateY(${rate}px)`;
    }
}

// Global function for button onclick (called from HTML)
window.showPayment = showPayment;

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Console log to show functionality status
console.log('🚀 MemeTee initialized for Vercel deployment (Belgium/Europe)');
console.log('📧 Contact form: REAL email functionality via serverless functions');
console.log('🤖 AI meme generation: REAL AI integration via serverless functions');
console.log('👕 AI t-shirt mockup: REAL AI integration via serverless functions');
console.log('💰 Payments: Coming soon message implementation');
console.log('🎯 All API calls routed to /api/* serverless functions');
console.log('🇪🇺 Pricing configured for European market (EUR)');
console.log('💡 Add your API keys to Vercel environment variables!');