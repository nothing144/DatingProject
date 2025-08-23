#!/usr/bin/env node

/**
 * Test script to verify Cloudinary CORS fix
 * Run this after deploying the edge functions
 */

const PROJECT_REF = 'ljjyipvvxmduvxoyzvhf';
const DOMAIN = 'https://iterdating.netlify.app';
const EDGE_FUNCTION_URL = `https://${PROJECT_REF}.supabase.co/functions/v1/delete-cloudinary-image`;

console.log('🧪 Testing Cloudinary CORS Configuration...\n');

// Test CORS preflight request
async function testCORS() {
  try {
    console.log('📡 Testing CORS preflight request...');
    console.log(`   URL: ${EDGE_FUNCTION_URL}`);
    console.log(`   Origin: ${DOMAIN}\n`);
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'OPTIONS',
      headers: {
        'Origin': DOMAIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization, content-type',
      },
    });

    console.log(`Response Status: ${response.status}`);
    console.log('Response Headers:');
    
    const corsHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods', 
      'Access-Control-Allow-Headers',
      'Access-Control-Allow-Credentials'
    ];
    
    corsHeaders.forEach(header => {
      const value = response.headers.get(header);
      const status = value ? '✅' : '❌';
      console.log(`   ${status} ${header}: ${value || 'NOT SET'}`);
    });

    // Check if CORS is properly configured
    const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
    const allowMethods = response.headers.get('Access-Control-Allow-Methods');
    
    if (response.status === 200 && 
        (allowOrigin === DOMAIN || allowOrigin === '*') && 
        allowMethods && allowMethods.includes('POST')) {
      console.log('\n🎉 CORS Configuration: ✅ WORKING');
      console.log('   Your Cloudinary deletion should work now!');
    } else {
      console.log('\n❌ CORS Configuration: ❌ NEEDS FIX');
      console.log('   Please redeploy the edge function with correct CORS headers.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nPossible issues:');
    console.log('   - Edge function not deployed');
    console.log('   - Network connectivity issue');
    console.log('   - Incorrect project reference');
  }
}

// Test function availability
async function testFunctionAvailability() {
  try {
    console.log('\n🔍 Testing function availability...');
    
    const response = await fetch(EDGE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': DOMAIN,
      },
      body: JSON.stringify({}),
    });

    console.log(`Function Response Status: ${response.status}`);
    
    if (response.status === 401) {
      console.log('✅ Function is deployed and responding (401 = needs auth, which is expected)');
    } else if (response.status === 400) {
      console.log('✅ Function is deployed and responding (400 = needs imageUrl/publicId, which is expected)');
    } else {
      console.log(`ℹ️  Function responding with status: ${response.status}`);
    }

  } catch (error) {
    console.error('❌ Function availability test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  await testCORS();
  await testFunctionAvailability();
  
  console.log('\n📋 Next Steps:');
  console.log('1. Deploy edge functions: npx supabase functions deploy delete-cloudinary-image');
  console.log('2. Set CLOUDINARY_API_SECRET in Supabase edge function secrets');
  console.log('3. Test image deletion in your app');
  console.log('\n🎯 Your CORS issue should be resolved! ');
}

runTests();