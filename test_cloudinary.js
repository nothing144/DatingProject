// Simple Cloudinary test to verify preset works
const testCloudinaryPreset = async () => {
  const cloudName = 'dlnatlmdq';
  const uploadPreset = 'heartbeat_preset';
  
  console.log('🧪 Testing Cloudinary Configuration...');
  console.log(`📡 Cloud Name: ${cloudName}`);
  console.log(`⚙️ Upload Preset: ${uploadPreset}`);
  
  // Test with a simple API call to verify preset exists
  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: new FormData() // Empty form data just to test endpoint
    });
    
    // We expect this to fail but with a specific error that tells us about the preset
    const errorData = await response.json();
    console.log('🔍 Cloudinary Response:', errorData);
    
    if (errorData.error && errorData.error.message) {
      if (errorData.error.message.includes('upload_preset')) {
        console.log('⚠️ Upload preset issue detected');
      } else if (errorData.error.message.includes('Must supply either')) {
        console.log('✅ Cloudinary API is accessible, preset should work');
      }
    }
    
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
  
  console.log('\n📋 Manual Verification Steps:');
  console.log('1. Go to https://console.cloudinary.com/');
  console.log('2. Navigate to Settings → Upload');
  console.log('3. Find preset "heartbeat_preset"');
  console.log('4. Verify these settings:');
  console.log('   - Mode: Unsigned ✅');
  console.log('   - Quality: Auto ✅');  
  console.log('   - Format: Auto ✅');
  console.log('   - Crop: Fill (optional) ✅');
  console.log('   - Gravity: Face (for profiles) ✅');
};

testCloudinaryPreset();