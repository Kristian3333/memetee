// Test script to verify email functionality
// Run this with: node test-email.js

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001';

async function testContactForm() {
    console.log('🧪 Testing MemeTee Contact Form Email Functionality');
    console.log('=================================================');
    console.log('');

    const testData = {
        name: 'Test User',
        email: 'test@example.com', // Change this to your email to receive the test
        message: 'This is a test message to verify the contact form email functionality is working correctly.'
    };

    try {
        console.log('📤 Sending test contact form submission...');
        console.log(`📍 API Endpoint: ${API_URL}/api/contact`);
        console.log(`📧 Test Email: ${testData.email}`);
        console.log('');

        const response = await fetch(`${API_URL}/api/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();

        if (response.ok && result.success) {
            console.log('✅ SUCCESS! Contact form email functionality is working!');
            console.log(`📨 Response: ${result.message}`);
            console.log('');
            console.log('📮 Check these inboxes:');
            console.log(`   1. Customer email (${testData.email}) - should receive confirmation`);
            console.log(`   2. Admin email - should receive notification`);
            console.log('');
            console.log('🎉 Your contact form is ready for production!');
        } else {
            console.log('❌ FAILED! Contact form not working properly');
            console.log(`📨 Response: ${result.error || 'Unknown error'}`);
            console.log('');
            console.log('🔧 Troubleshooting:');
            console.log('   1. Check your .env file configuration');
            console.log('   2. Verify your email service credentials');
            console.log('   3. Make sure the backend server is running');
            console.log('   4. Check the server logs for error details');
        }

    } catch (error) {
        console.log('❌ ERROR! Could not connect to backend server');
        console.log(`📨 Error: ${error.message}`);
        console.log('');
        console.log('🔧 Troubleshooting:');
        console.log('   1. Make sure the backend server is running (npm run dev)');
        console.log('   2. Check if the server is running on port 3001');
        console.log('   3. Verify your network connection');
    }
}

// Also test server health
async function testServerHealth() {
    try {
        console.log('🏥 Testing server health...');
        const response = await fetch(`${API_URL}/health`);
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Server is healthy and running');
            console.log(`📊 Status: ${result.status}`);
            console.log(`⏰ Timestamp: ${result.timestamp}`);
            console.log('');
            return true;
        } else {
            console.log('❌ Server health check failed');
            return false;
        }
    } catch (error) {
        console.log('❌ Cannot connect to server');
        console.log(`📨 Error: ${error.message}`);
        return false;
    }
}

// Run tests
async function runTests() {
    const serverHealthy = await testServerHealth();
    
    if (serverHealthy) {
        await testContactForm();
    } else {
        console.log('');
        console.log('🚨 Cannot test contact form - server is not responding');
        console.log('');
        console.log('🔧 Please:');
        console.log('   1. Navigate to the backend directory: cd backend');
        console.log('   2. Start the server: npm run dev');
        console.log('   3. Wait for "Server running on port 3001" message');
        console.log('   4. Run this test again: node test-email.js');
    }
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
    console.log('❌ Unhandled error:', error.message);
    process.exit(1);
});

// Run the tests
runTests();