// Direct CORS testing for Cloudinary deletion edge function
const fetch = require('node-fetch');

async function testCorsDirectly() {
    console.log('🧪 Testing CORS directly on Cloudinary deletion edge function...');
    
    const edgeFunctionUrl = 'https://ljjyipvvxmduvxoyzvhf.supabase.co/functions/v1/delete-cloudinary-image';
    
    try {
        // Test 1: OPTIONS request (CORS preflight)
        console.log('\n📋 Test 1: CORS Preflight (OPTIONS) Request');
        console.log(`🔗 URL: ${edgeFunctionUrl}`);
        
        const optionsResponse = await fetch(edgeFunctionUrl, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://iterdating.netlify.app',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'authorization, content-type, x-client-info'
            }
        });
        
        console.log(`📊 OPTIONS Response Status: ${optionsResponse.status}`);
        console.log('📋 CORS Headers:');
        
        const corsHeaders = [
            'Access-Control-Allow-Origin',
            'Access-Control-Allow-Methods', 
            'Access-Control-Allow-Headers',
            'Access-Control-Allow-Credentials',
            'Access-Control-Max-Age'
        ];
        
        corsHeaders.forEach(header => {
            const value = optionsResponse.headers.get(header);
            console.log(`  ${header}: ${value || 'NOT SET'}`);
        });
        
        // Test 2: POST request without authentication (should fail with 401, not CORS)
        console.log('\n📤 Test 2: POST Request without Authentication');
        
        const postResponse = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
                'Origin': 'https://iterdating.netlify.app',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageUrl: 'https://res.cloudinary.com/dlnatlmdq/image/upload/test_image.jpg'
            })
        });
        
        console.log(`📊 POST Response Status: ${postResponse.status}`);
        
        const responseText = await postResponse.text();
        console.log(`📄 Response Body: ${responseText}`);
        
        // Test 3: Check if CORS is properly configured
        const allowOrigin = optionsResponse.headers.get('Access-Control-Allow-Origin');
        const allowMethods = optionsResponse.headers.get('Access-Control-Allow-Methods');
        const allowHeaders = optionsResponse.headers.get('Access-Control-Allow-Headers');
        
        console.log('\n🔍 CORS Configuration Analysis:');
        
        if (allowOrigin === 'https://iterdating.netlify.app') {
            console.log('✅ Access-Control-Allow-Origin correctly set for production domain');
        } else if (allowOrigin === '*') {
            console.log('⚠️ Access-Control-Allow-Origin set to wildcard (*)');
        } else {
            console.log(`❌ Access-Control-Allow-Origin mismatch: ${allowOrigin}`);
        }
        
        if (allowMethods && allowMethods.includes('POST')) {
            console.log('✅ POST method allowed');
        } else {
            console.log(`❌ POST method not allowed. Allowed methods: ${allowMethods}`);
        }
        
        if (allowHeaders && allowHeaders.includes('authorization')) {
            console.log('✅ Authorization header allowed');
        } else {
            console.log(`❌ Authorization header not allowed. Allowed headers: ${allowHeaders}`);
        }
        
        // Test 4: Test from different origin (should fail)
        console.log('\n🚫 Test 4: Request from Different Origin (should fail)');
        
        const wrongOriginResponse = await fetch(edgeFunctionUrl, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://wrong-domain.com',
                'Access-Control-Request-Method': 'POST'
            }
        });
        
        console.log(`📊 Wrong Origin Response Status: ${wrongOriginResponse.status}`);
        const wrongOriginAllowOrigin = wrongOriginResponse.headers.get('Access-Control-Allow-Origin');
        console.log(`🔍 Allow-Origin for wrong domain: ${wrongOriginAllowOrigin || 'NOT SET'}`);
        
        if (wrongOriginAllowOrigin === 'https://iterdating.netlify.app') {
            console.log('✅ CORS properly restricts to correct domain');
        } else if (wrongOriginAllowOrigin === '*') {
            console.log('⚠️ CORS allows all origins (wildcard)');
        } else {
            console.log('❓ Unexpected CORS behavior');
        }
        
    } catch (error) {
        console.error('❌ Error testing CORS:', error.message);
        
        if (error.message.includes('CORS')) {
            console.log('🎯 CONFIRMED: CORS error detected!');
        }
    }
}

// Run the test
testCorsDirectly().then(() => {
    console.log('\n🏁 CORS testing completed');
}).catch(error => {
    console.error('💥 Test failed:', error);
});