// MemeTee Landing Page JavaScript - FIXED DISPLAY ISSUES + ENHANCED ERROR HANDLING

// Configuration for Vercel deployment
const CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    PRICE: 2299, // €22.99 in cents
    CURRENCY: 'EUR',
    REQUEST_TIMEOUT: 45000, // 45 seconds for vision analysis + generation
    API_ENDPOINTS: {
        generateMeme: '/api/generate-meme',
        generateTshirtMockup: '/api/generate-tshirt-mockup',
        processOrder: '/api/process-order',
        contactForm: '/api/contact',
        health: '/api/health'
    }
};

// DOM Elements - WITH NULL CHECKS
let uploadArea, fileInput, loading, loadingText, previewSection;
let originalPreview, memeImage, tshirtMockup, memePlaceholder, tshirtPlaceholder;
let orderBtn, paymentSection;

// Loading steps
let steps = {};

// Store generated content
let generatedMemeUrl = null;
let generatedTshirtUrl = null;
let uploadedImageData = null;
let currentController = null; // For request cancellation

// Enhanced logging system
const DEBUG = true; // Set to false for production

function debugLog(message, type = 'info') {
    if (!DEBUG) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
}

function errorLog(message, error = null) {
    debugLog(message, 'error');
    if (error) {
        console.error('Full error details:', error);
    }
}

function successLog(message) {
    debugLog(message, 'success');
}

// Initialize the application
function init() {
    try {
        debugLog('🚀 Initializing MemeTee application...');
        
        // Get DOM elements with enhanced error checking
        if (!initializeDOMElements()) {
            errorLog('Failed to initialize DOM elements. Some features may not work.');
            return;
        }
        
        setupEventListeners();
        initializeAnimations();
        checkBackendHealth();
        
        successLog('MemeTee initialized successfully!');
        successLog('Using IMPROVED PIPELINE: GPT-4o Vision → Direct DALL-E Prompting');
        successLog('Enhanced for maximum humor and viral potential');
        
    } catch (error) {
        errorLog('Critical error initializing app', error);
    }
}

// Enhanced DOM element initialization
function initializeDOMElements() {
    try {
        // Core elements
        uploadArea = document.getElementById('upload-area');
        fileInput = document.getElementById('file-input');
        loading = document.getElementById('loading');
        loadingText = document.getElementById('loading-text');
        previewSection = document.getElementById('preview-section');
        
        // Image elements
        originalPreview = document.getElementById('original-preview');
        memeImage = document.getElementById('meme-image');
        tshirtMockup = document.getElementById('tshirt-mockup');
        memePlaceholder = document.getElementById('meme-placeholder');
        tshirtPlaceholder = document.getElementById('tshirt-placeholder');
        
        // Control elements
        orderBtn = document.getElementById('order-btn');
        paymentSection = document.getElementById('payment-section');
        
        // Loading steps
        steps = {
            1: document.getElementById('step-1'),
            2: document.getElementById('step-2'),
            3: document.getElementById('step-3')
        };
        
        // Check critical elements
        const criticalElements = {
            uploadArea,
            fileInput,
            memeImage,
            tshirtMockup,
            memePlaceholder,
            tshirtPlaceholder
        };
        
        const missingElements = Object.entries(criticalElements)
            .filter(([name, element]) => !element)
            .map(([name]) => name);
        
        if (missingElements.length > 0) {
            errorLog(`Missing critical DOM elements: ${missingElements.join(', ')}`);
            return false;
        }
        
        successLog('All DOM elements initialized successfully');
        debugLog(`Meme Image: ${memeImage ? 'Found' : 'Missing'}`);
        debugLog(`Meme Placeholder: ${memePlaceholder ? 'Found' : 'Missing'}`);
        debugLog(`T-shirt Mockup: ${tshirtMockup ? 'Found' : 'Missing'}`);
        debugLog(`T-shirt Placeholder: ${tshirtPlaceholder ? 'Found' : 'Missing'}`);
        
        return true;
        
    } catch (error) {
        errorLog('Error initializing DOM elements', error);
        return false;
    }
}

// Check if backend API is working
async function checkBackendHealth() {
    try {
        const response = await fetch(CONFIG.API_ENDPOINTS.health);
        const health = await response.json();
        
        debugLog('Backend Health Check:', 'info');
        console.log(health);
        
        if (!health.services?.ai?.openai) {
            debugLog('OpenAI not configured. Improved meme generation will not work.', 'warning');
            showWarning('OpenAI API not configured. Please add OPENAI_API_KEY to environment variables.');
        } else {
            successLog('OpenAI services ready for improved meme generation!');
        }
    } catch (error) {
        errorLog('Backend not reachable', error);
        showError('API not responding. Please check deployment.');
    }
}

// Setup all event listeners
function setupEventListeners() {
    try {
        // File upload events - with null checks
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', handleDragOver);
            uploadArea.addEventListener('dragleave', handleDragLeave);
            uploadArea.addEventListener('drop', handleDrop);
            fileInput.addEventListener('change', handleFileSelect);
        }
        
        // Payment form
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', handlePaymentSubmit);
        }
        
        // Contact form
        const contactForm = document.getElementById('contact-form');
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactSubmit);
        }
        
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
        
        successLog('Event listeners setup complete');
        
    } catch (error) {
        errorLog('Error setting up event listeners', error);
    }
}

// Initialize animations
function initializeAnimations() {
    try {
        // Check if GSAP is available
        if (typeof gsap === 'undefined') {
            debugLog('GSAP not loaded, skipping animations', 'warning');
            return;
        }
        
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
        
        successLog('Animations initialized');
        
    } catch (error) {
        debugLog('Error initializing animations (continuing without)', 'warning');
    }
}

// Drag and drop handlers
function handleDragOver(e) {
    e.preventDefault();
    if (uploadArea) {
        uploadArea.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    if (uploadArea) {
        uploadArea.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (uploadArea) {
        uploadArea.classList.remove('drag-over');
    }
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
    debugLog(`Processing file: ${file.name} (${file.size} bytes)`);
    
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
        uploadedImageData = e.target.result;
        if (originalPreview) {
            originalPreview.src = e.target.result;
        }
        if (previewSection) {
            previewSection.style.display = 'block';
        }
        
        // Reset previous results
        resetResultsDisplay();
        
        // Animate the preview appearance if GSAP is available
        if (typeof gsap !== 'undefined' && previewSection) {
            gsap.from(previewSection, {
                opacity: 0,
                y: 50,
                duration: 0.8,
                ease: "power2.out"
            });
        }
        
        successLog('File preview loaded successfully');
    };
    
    reader.onerror = () => {
        errorLog('Failed to read file');
        showError('Failed to read the uploaded file. Please try again.');
    };
    
    reader.readAsDataURL(file);

    // Start AI generation process
    generateAIContent(file);
}

// Enhanced reset results display
function resetResultsDisplay() {
    debugLog('🧹 Resetting results display...');
    
    try {
        // Hide previous results
        if (memeImage) {
            memeImage.style.display = 'none';
            memeImage.src = '';
        }
        if (tshirtMockup) {
            tshirtMockup.style.display = 'none';
            tshirtMockup.src = '';
        }
        
        // Show placeholders
        if (memePlaceholder) {
            memePlaceholder.style.display = 'block';
        }
        if (tshirtPlaceholder) {
            tshirtPlaceholder.style.display = 'block';
        }
        
        // Hide order button
        if (orderBtn) {
            orderBtn.style.display = 'none';
        }
        
        // Remove any existing t-shirt overlay
        const existingTshirtContainer = document.getElementById('tshirt-background-container');
        if (existingTshirtContainer) {
            existingTshirtContainer.remove();
            debugLog('Removed existing t-shirt container');
        }
        
        // Reset stored URLs
        generatedMemeUrl = null;
        generatedTshirtUrl = null;
        
        successLog('Results display reset complete');
        
    } catch (error) {
        errorLog('Error resetting display', error);
    }
}

// 🎯 IMPROVED AI GENERATION PIPELINE
async function generateAIContent(file) {
    try {
        debugLog('🎯 Starting IMPROVED AI meme generation pipeline...');
        
        // Cancel any existing request
        if (currentController) {
            currentController.abort();
        }
        
        // Create new abort controller for timeout handling
        currentController = new AbortController();
        
        // Show loading state
        if (loading) {
            loading.style.display = 'block';
        }
        resetLoadingSteps();
        
        // Step 1: GPT-4o Creates Perfect DALL-E Prompt
        updateLoadingStep(1, 'active');
        if (loadingText) {
            loadingText.textContent = '🎯 GPT-4o is crafting the perfect meme prompt from your image...';
        }
        await delay(2000);
        updateLoadingStep(1, 'completed');
        
        // Step 2: Generate Hilarious Meme
        updateLoadingStep(2, 'active');
        if (loadingText) {
            loadingText.textContent = '😂 Creating your hilarious meme with improved AI pipeline...';
        }
        await generateImprovedMeme(file);
        updateLoadingStep(2, 'completed');
        
        // Step 3: Create t-shirt mockup
        updateLoadingStep(3, 'active');
        if (loadingText) {
            loadingText.textContent = '👕 Creating realistic t-shirt preview...';
        }
        await generateTshirtMockupWithOverlay();
        updateLoadingStep(3, 'completed');
        
        // Show final results
        hideLoading();
        showFinalResults();
        
        successLog('Improved AI meme generation completed successfully!');
        
    } catch (error) {
        errorLog('Error in improved AI generation', error);
        hideLoading();
        
        // Handle specific errors with user-friendly messages
        handleGenerationError(error);
    } finally {
        currentController = null;
    }
}

// Enhanced error handling
function handleGenerationError(error) {
    if (error.name === 'AbortError') {
        showError('Request was cancelled. Please try again.');
    } else if (error.message.includes('timeout') || error.message.includes('took too long')) {
        showError('Meme generation took too long. Try uploading a smaller, clearer image.');
    } else if (error.message.includes('quota') || error.message.includes('billing')) {
        showError('OpenAI API quota exceeded. Please check your billing or try again later.');
    } else if (error.message.includes('content policy') || error.message.includes('safety')) {
        showError('Image content not suitable for meme generation. Please try a different image.');
    } else if (error.message.includes('not configured') || error.message.includes('API key')) {
        showError('OpenAI API key not configured. Please contact support.');
    } else if (error.message.includes('verification')) {
        showError('OpenAI organization verification required. Please contact support.');
    } else {
        showError('Sorry, there was an error generating your meme. Please try again with a different image.');
    }
}

// 🎨 IMPROVED MEME GENERATION
async function generateImprovedMeme(file) {
    try {
        debugLog('🎨 Starting improved meme generation...');
        
        if (!uploadedImageData) {
            throw new Error('No image data available');
        }
        
        // Convert file to base64 for API
        const base64Data = uploadedImageData.split(',')[1];
        
        debugLog('📤 Sending image for improved meme generation...');
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Meme generation timed out')), CONFIG.REQUEST_TIMEOUT);
        });
        
        // Create API request promise
        const apiPromise = fetch(CONFIG.API_ENDPOINTS.generateMeme, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image: base64Data,
                prompt: 'Create a hilarious viral meme', // This will be enhanced by GPT-4o
                style: 'meme'
            }),
            signal: currentController.signal
        });
        
        // Race between API call and timeout
        const response = await Promise.race([apiPromise, timeoutPromise]);
        
        debugLog(`📥 Response status: ${response.status}`);
        
        if (!response.ok) {
            const error = await response.json();
            errorLog('Improved Meme API Error:', error);
            
            // Handle enhanced error responses from backend
            if (error.details?.type === 'safety_violation') {
                showError(`🛡️ Content Safety Issue: ${error.error}\n\n💡 ${error.details.suggestion}`);
            } else if (error.details?.rejected_prompt) {
                showError(`❌ Generation Failed: ${error.error}\n\n🔄 Try uploading a different type of image.`);
            } else {
                showError(error.error || 'Improved meme generation failed');
            }
            
            throw new Error(error.error || 'Improved meme generation failed');
        }
        
        const result = await response.json();
        debugLog('🔍 Improved API Response received');
        
        if (result.success && result.meme_url) {
            generatedMemeUrl = result.meme_url;
            debugLog(`💾 Stored meme URL: ${generatedMemeUrl}`);
            
            // CRITICAL: Show the meme in BOTH containers
            debugLog('🖼️ Displaying improved meme in BOTH containers...');
            await showMemeInBothContainers(result.meme_url);
            
            successLog(`Funnier meme generated with ${result.provider}`);
            
            // Log the improved pipeline details
            if (result.used_vision) {
                debugLog('🎯 Used GPT-4o direct prompting for maximum humor');
            }
            
            if (result.vision_prompt) {
                console.group('🧠 GPT-4o Generated DALL-E Prompt:');
                console.log(result.vision_prompt);
                console.groupEnd();
            }
            
            if (result.safety_info?.had_safety_issue) {
                console.group('🛡️ Safety Information:');
                console.log('Original prompt was sanitized for safety compliance');
                console.log('Rejected prompt:', result.safety_info.original_prompt_rejected);
                console.groupEnd();
                showSuccess('🛡️ Meme generated successfully! We automatically adjusted the content to meet safety guidelines.');
            }
            
            if (result.prompt_used) {
                debugLog(`📝 Final prompt used: ${result.prompt_used.substring(0, 100)}...`);
            }
            
            if (result.revised_prompt) {
                debugLog(`🎭 DALL-E revised prompt: ${result.revised_prompt.substring(0, 100)}...`);
            }
            
            debugLog(`🔄 Generation attempts: ${result.attempts?.length || 'unknown'}`);
            debugLog(`✨ Enhancement type: ${result.enhancement}`);
            
            // Show success message
            if (result.used_vision && !result.safety_info?.had_safety_issue) {
                showSuccess('🎉 Funnier meme created! GPT-4o analyzed your image and crafted the perfect prompt for maximum humor.');
            }
            
            // Track successful generation
            if (typeof gtag !== 'undefined') {
                gtag('event', 'improved_meme_generated', {
                    'event_category': 'AI',
                    'provider': result.provider,
                    'used_vision': result.used_vision,
                    'enhancement': result.enhancement,
                    'had_safety_issue': result.safety_info?.had_safety_issue || false
                });
            }
        } else {
            errorLog('Invalid improved API response:', result);
            throw new Error('Invalid response from improved meme generation API');
        }
        
    } catch (error) {
        errorLog('Improved meme generation failed', error);
        throw error;
    }
}

// 🖼️ SHOW MEME IN BOTH CONTAINERS - FIXED
async function showMemeInBothContainers(memeUrl) {
    debugLog('🖼️ === SHOWING MEME IN BOTH CONTAINERS ===');
    debugLog(`🔗 Meme URL: ${memeUrl}`);
    
    // Show in left container (original meme display)
    await showMeme(memeUrl);
    
    // Show in right container as t-shirt mockup
    await showTshirtWithMemeOverlay(memeUrl);
}

// 🖼️ ENHANCED MEME DISPLAY FUNCTION - FOR LEFT CONTAINER
function showMeme(memeUrl) {
    return new Promise((resolve, reject) => {
        debugLog('🖼️ === SHOWING MEME IN LEFT CONTAINER ===');
        debugLog(`🔗 Meme URL: ${memeUrl}`);
        
        // Validate inputs
        if (!memeImage || !memePlaceholder) {
            const error = 'Required meme display elements not found';
            errorLog(error);
            reject(new Error(error));
            return;
        }
        
        if (!memeUrl) {
            const error = 'No meme URL provided';
            errorLog(error);
            reject(new Error(error));
            return;
        }
        
        try {
            // Hide placeholder and show image container
            memePlaceholder.style.display = 'none';
            memeImage.style.display = 'block';
            
            // Clear any previous src to ensure fresh load
            memeImage.src = '';
            
            // Set up event handlers BEFORE setting src
            const handleLoad = () => {
                successLog('Meme image loaded successfully in LEFT container!');
                debugLog(`📏 Image dimensions: ${memeImage.naturalWidth} x ${memeImage.naturalHeight}`);
                
                // Animate the meme appearance if GSAP is available
                if (typeof gsap !== 'undefined') {
                    gsap.from(memeImage, {
                        opacity: 0,
                        scale: 0.8,
                        duration: 0.8,
                        ease: "back.out(1.7)"
                    });
                }
                
                // Clean up event listeners
                memeImage.removeEventListener('load', handleLoad);
                memeImage.removeEventListener('error', handleError);
                
                resolve();
            };
            
            const handleError = () => {
                errorLog(`Failed to load meme image in LEFT container: ${memeUrl}`);
                
                // Reset to placeholder state
                memePlaceholder.style.display = 'block';
                memeImage.style.display = 'none';
                memeImage.src = '';
                
                // Clean up event listeners
                memeImage.removeEventListener('load', handleLoad);
                memeImage.removeEventListener('error', handleError);
                
                reject(new Error('Failed to load meme image'));
            };
            
            // Add event listeners
            memeImage.addEventListener('load', handleLoad);
            memeImage.addEventListener('error', handleError);
            
            // Set the source to trigger loading
            memeImage.src = memeUrl;
            debugLog(`✅ Set meme image src to: ${memeUrl}`);
            
        } catch (error) {
            errorLog('Error in showMeme function', error);
            
            // Reset to placeholder state on any error
            if (memePlaceholder && memeImage) {
                memePlaceholder.style.display = 'block';
                memeImage.style.display = 'none';
            }
            
            reject(error);
        }
    });
}

// 👕 CREATE T-SHIRT MOCKUP WITH PROPER T-SHIRT BACKGROUND
async function showTshirtWithMemeOverlay(memeUrl) {
    return new Promise((resolve, reject) => {
        debugLog('👕 === CREATING T-SHIRT MOCKUP IN RIGHT CONTAINER ===');
        debugLog(`🎨 Meme URL: ${memeUrl}`);
        
        // Validate inputs
        if (!tshirtPlaceholder) {
            const error = 'Required t-shirt placeholder element not found';
            errorLog(error);
            reject(new Error(error));
            return;
        }
        
        try {
            // Hide placeholder
            tshirtPlaceholder.style.display = 'none';
            
            // Get the t-shirt container
            const tshirtContainer = tshirtPlaceholder.parentNode;
            
            // Create t-shirt background container
            const tshirtBgContainer = document.createElement('div');
            tshirtBgContainer.id = 'tshirt-background-container';
            tshirtBgContainer.style.cssText = `
                position: relative;
                width: 100%;
                height: 250px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(145deg, #f0f0f0, #ffffff);
                border-radius: 15px;
                overflow: hidden;
            `;
            
            // Create t-shirt shape using CSS
            const tshirtShape = document.createElement('div');
            tshirtShape.style.cssText = `
                position: relative;
                width: 180px;
                height: 220px;
                background: white;
                border-radius: 15px 15px 25px 25px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                border: 2px solid rgba(0,0,0,0.1);
                overflow: hidden;
            `;
            
            // Add t-shirt neckline
            const neckline = document.createElement('div');
            neckline.style.cssText = `
                position: absolute;
                top: -1px;
                left: 50%;
                transform: translateX(-50%);
                width: 40px;
                height: 20px;
                background: white;
                border-radius: 0 0 20px 20px;
                border: 2px solid rgba(0,0,0,0.1);
                border-top: none;
            `;
            
            // Add sleeves
            const leftSleeve = document.createElement('div');
            leftSleeve.style.cssText = `
                position: absolute;
                top: 10px;
                left: -15px;
                width: 20px;
                height: 60px;
                background: white;
                border-radius: 10px 0 0 15px;
                border: 2px solid rgba(0,0,0,0.1);
                border-right: none;
            `;
            
            const rightSleeve = document.createElement('div');
            rightSleeve.style.cssText = `
                position: absolute;
                top: 10px;
                right: -15px;
                width: 20px;
                height: 60px;
                background: white;
                border-radius: 0 10px 15px 0;
                border: 2px solid rgba(0,0,0,0.1);
                border-left: none;
            `;
            
            // Create meme overlay on t-shirt
            const memeOverlay = document.createElement('img');
            memeOverlay.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                width: 120px;
                height: 120px;
                transform: translate(-50%, -50%);
                object-fit: contain;
                border-radius: 8px;
                z-index: 10;
            `;
            
            // Assemble the t-shirt
            tshirtShape.appendChild(neckline);
            tshirtShape.appendChild(leftSleeve);
            tshirtShape.appendChild(rightSleeve);
            tshirtShape.appendChild(memeOverlay);
            
            tshirtBgContainer.appendChild(tshirtShape);
            tshirtContainer.appendChild(tshirtBgContainer);
            
            debugLog('✅ Created t-shirt background and shape');
            
            // Set up meme overlay load handlers
            const handleOverlayLoad = () => {
                successLog('Meme overlay loaded on t-shirt successfully!');
                
                // Animate the t-shirt appearance if GSAP is available
                if (typeof gsap !== 'undefined') {
                    gsap.from(tshirtBgContainer, {
                        opacity: 0,
                        scale: 0.8,
                        duration: 0.8,
                        ease: "back.out(1.7)"
                    });
                    
                    gsap.from(memeOverlay, {
                        opacity: 0,
                        scale: 0.5,
                        duration: 0.6,
                        delay: 0.3,
                        ease: "back.out(1.7)"
                    });
                }
                
                // Clean up event listeners
                memeOverlay.removeEventListener('load', handleOverlayLoad);
                memeOverlay.removeEventListener('error', handleOverlayError);
                
                resolve();
            };
            
            const handleOverlayError = () => {
                errorLog(`Failed to load meme overlay on t-shirt: ${memeUrl}`);
                memeOverlay.style.display = 'none';
                
                // Still resolve as the t-shirt structure loaded
                resolve();
            };
            
            // Set overlay event listeners and source
            memeOverlay.addEventListener('load', handleOverlayLoad);
            memeOverlay.addEventListener('error', handleOverlayError);
            memeOverlay.src = memeUrl;
            
            debugLog(`✅ Set t-shirt meme overlay src to: ${memeUrl}`);
            
        } catch (error) {
            errorLog('Error creating t-shirt mockup', error);
            reject(error);
        }
    });
}

// Legacy function - now calls the new t-shirt function
async function generateTshirtMockupWithOverlay() {
    try {
        if (!generatedMemeUrl) {
            throw new Error('No meme URL available for t-shirt mockup');
        }
        
        debugLog('👕 Creating t-shirt mockup...');
        
        // This is now handled by showTshirtWithMemeOverlay
        // which is called from showMemeInBothContainers
        
        successLog('T-shirt mockup handled by new display system');
        
    } catch (error) {
        errorLog('T-shirt mockup creation failed', error);
        showTshirtMockupFallback();
    }
}

// Fallback t-shirt mockup (simple template)
function showTshirtMockupFallback() {
    debugLog('📦 Using fallback t-shirt template');
    
    if (!tshirtMockup || !tshirtPlaceholder) {
        errorLog('Cannot show fallback - elements missing');
        return;
    }
    
    // Use a simple t-shirt template
    const fallbackUrl = 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop&crop=center';
    generatedTshirtUrl = fallbackUrl;
    
    tshirtMockup.src = fallbackUrl;
    tshirtMockup.style.display = 'block';
    tshirtPlaceholder.style.display = 'none';
    
    // Animate the fallback appearance if GSAP is available
    if (typeof gsap !== 'undefined') {
        gsap.from(tshirtMockup, {
            opacity: 0,
            scale: 0.8,
            duration: 0.8,
            delay: 0.2,
            ease: "back.out(1.7)"
        });
    }
    
    successLog('Fallback t-shirt template displayed');
}

// Show final results and order button
function showFinalResults() {
    debugLog('🎬 Showing final results...');
    debugLog(`🖼️ Generated meme URL: ${generatedMemeUrl}`);
    debugLog(`👕 Generated t-shirt URL: ${generatedTshirtUrl}`);
    
    // Only show order button if we have meme
    if (generatedMemeUrl && orderBtn) {
        orderBtn.style.display = 'inline-block';
        
        // Animate order button if GSAP is available
        if (typeof gsap !== 'undefined') {
            gsap.from(orderBtn, {
                opacity: 0,
                y: 30,
                duration: 0.6,
                delay: 0.5,
                ease: "power2.out"
            });
        }
        
        successLog('Order button displayed');
    } else {
        debugLog('Order button not shown - missing meme or button element', 'warning');
    }
    
    // Add subtle animations to result cards if GSAP is available
    if (typeof gsap !== 'undefined') {
        gsap.from('.result-card', {
            y: 20,
            stagger: 0.2,
            duration: 0.8,
            ease: "power2.out"
        });
    }
    
    // Track successful AI generation completion
    if (typeof gtag !== 'undefined') {
        gtag('event', 'improved_meme_generation_complete', {
            'event_category': 'AI',
            'event_label': 'success'
        });
    }
    
    successLog('Improved meme generation results displayed successfully');
}

// Loading step management
function resetLoadingSteps() {
    Object.values(steps).forEach(step => {
        if (step) {
            step.className = 'step';
        }
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

// Show payment section
function showPayment() {
    if (!paymentSection) {
        errorLog('Payment section not found');
        return;
    }
    
    paymentSection.style.display = 'block';
    
    // Animate payment section if GSAP is available
    if (typeof gsap !== 'undefined') {
        gsap.from(paymentSection, {
            opacity: 0,
            y: 30,
            duration: 0.6,
            ease: "power2.out"
        });
    }
    
    // Scroll to payment section
    paymentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Handle payment form submission
async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const submitButton = document.getElementById('submit-payment');
    if (!submitButton) return;
    
    const originalText = submitButton.textContent;
    
    // Update button state
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;

    try {
        // Prepare order data
        const sizeElement = document.getElementById('size');
        const colorElement = document.getElementById('color');
        
        const orderData = {
            memeDesign: generatedMemeUrl,
            tshirtPreview: generatedTshirtUrl,
            size: sizeElement ? sizeElement.value : 'M',
            color: colorElement ? colorElement.value : 'white',
            price: CONFIG.PRICE,
            currency: CONFIG.CURRENCY,
            timestamp: new Date().toISOString()
        };

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
            const paymentForm = document.getElementById('payment-form');
            if (paymentForm) {
                paymentForm.reset();
            }
            
            // Hide payment section after showing message
            setTimeout(() => {
                if (paymentSection) {
                    paymentSection.style.display = 'none';
                }
            }, 3000);
        } else {
            throw new Error(result.error || 'Order processing failed');
        }

    } catch (error) {
        errorLog('Payment error', error);
        showError('There was an error processing your order. Payment integration coming soon!');
    } finally {
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    }
}

// 📧 CONTACT FORM FUNCTIONALITY
async function handleContactSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const submitButton = form.querySelector('button[type="submit"]');
    if (!submitButton) return;
    
    const originalText = submitButton.textContent;
    
    // Get form data
    const nameInput = form.querySelector('input[placeholder="Your Name"]');
    const emailInput = form.querySelector('input[placeholder="Your Email"]');
    const messageInput = form.querySelector('textarea[placeholder*="Your Message"]');
    
    if (!nameInput || !emailInput || !messageInput) {
        showError('Form elements not found. Please refresh the page.');
        return;
    }
    
    const formData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        message: messageInput.value.trim()
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
        debugLog('Sending contact form via API...');
        
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
        errorLog('Contact form error', error);
        
        // Show user-friendly error message
        if (error.message.includes('rate limit') || error.message.includes('Too many')) {
            showError('You\'ve sent too many messages recently. Please wait a few minutes before trying again.');
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            showError('Network error. Please check your connection and try again.');
        } else {
            showError('Failed to send message. Please try again or email us directly at hello@memetee.com');
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
    if (loading) {
        loading.style.display = 'none';
    }
}

function showError(message) {
    const notification = createNotification(message, 'error');
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 10000); // Longer timeout for error messages with safety info
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
        white-space: pre-line;
    `;
    notification.textContent = message;
    
    // Animate in if GSAP is available
    if (typeof gsap !== 'undefined') {
        gsap.from(notification, {
            opacity: 0,
            x: 100,
            duration: 0.5,
            ease: "back.out(1.7)"
        });
    }
    
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
successLog('🎯 Enhanced MemeTee Script Loaded with FIXED DISPLAY + SAFETY HANDLING');
debugLog('🖼️ Meme Display: Now shows in BOTH left and right containers');
debugLog('👕 T-Shirt Display: Proper t-shirt shape with CSS-created background');
debugLog('🛡️ Safety Handling: Comprehensive error handling for content policy violations');
debugLog('🧠 GPT-4o Vision: Directly crafts perfect DALL-E prompts');
debugLog('🎨 DALL-E Generation: Uses optimized prompts for funnier results with safety retry');
debugLog('🐛 Debug Mode: Extensive logging including safety violations and sanitized prompts');
debugLog('⚡ Smart fallbacks: Multiple AI models with graceful degradation');
debugLog('💡 Check console for detailed error information and safety handling!');