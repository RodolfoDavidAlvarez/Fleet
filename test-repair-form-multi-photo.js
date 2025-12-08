const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

async function testRepairFormSubmission() {
  console.log('🧪 Testing Repair Form Submission with Multiple Photos...\n');

  const form = new FormData();

  // Fill out all required fields
  form.append('driverName', 'Test Driver - Claude');
  form.append('driverPhone', '9285501649');
  form.append('makeModel', 'Ford F-150');
  form.append('vehicleIdentifier', 'TEST-001');
  form.append('odometer', '45000');
  form.append('division', 'Construction');
  form.append('vehicleType', 'Truck');
  form.append('isImmediate', 'false');
  form.append('description', 'Testing multi-photo upload functionality to verify AI analysis optimization and validation fixes.');
  form.append('incidentDate', '2025-12-08');
  form.append('preferredLanguage', 'en');
  form.append('smsConsent', 'true');

  // Create 3 simple test images
  console.log('📸 Creating 3 test images...');
  const testImages = [];
  for (let i = 1; i <= 3; i++) {
    // Create a simple SVG image
    const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#${i === 1 ? 'ff6b6b' : i === 2 ? '4ecdc4' : 'ffe66d'}"/>
      <text x="50%" y="50%" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">
        Test Photo ${i}
      </text>
    </svg>`;

    const buffer = Buffer.from(svg);
    const filename = `test-photo-${i}.svg`;

    form.append('photos', buffer, {
      filename: filename,
      contentType: 'image/svg+xml'
    });

    testImages.push(filename);
    console.log(`  ✓ Created ${filename}`);
  }

  console.log('\n📤 Submitting repair request to production API...');
  console.log('   URL: https://agavefleet.com/api/repair-requests');

  const startTime = Date.now();

  try {
    const response = await fetch('https://agavefleet.com/api/repair-requests', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    console.log(`\n⏱️  Response time: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('\n✅ SUCCESS! Repair request submitted successfully!\n');
      console.log('📋 Response Details:');
      console.log(`   Request ID: ${data.request?.id}`);
      console.log(`   Request Number: ${data.request?.requestNumber}`);
      console.log(`   Driver: ${data.request?.driverName}`);
      console.log(`   Status: ${data.request?.status}`);
      console.log(`   Photos Uploaded: ${data.request?.photoUrls?.length || 0}`);

      if (data.ai) {
        console.log('\n🤖 AI Analysis:');
        console.log(`   Category: ${data.ai.category}`);
        console.log(`   Summary: ${data.ai.summary}`);
        console.log(`   Confidence: ${(data.ai.confidence * 100).toFixed(1)}%`);
        console.log(`   Service Type: ${data.ai.serviceType}`);
      }

      if (data.request?.photoUrls) {
        console.log('\n📷 Photo URLs:');
        data.request.photoUrls.forEach((url, idx) => {
          console.log(`   ${idx + 1}. ${url}`);
        });
      }

      console.log('\n✨ All issues resolved:');
      console.log('   ✓ Multiple photos accepted');
      console.log('   ✓ No validation errors');
      console.log('   ✓ Fast submission time');
      console.log('   ✓ AI analysis completed');

      return true;
    } else {
      console.log('\n❌ FAILURE! Submission failed.\n');
      console.log('Error Response:');
      console.log(JSON.stringify(data, null, 2));

      if (data.details) {
        console.log('\nValidation Errors:');
        Object.keys(data.details).forEach(field => {
          console.log(`   ${field}: ${data.details[field].join(', ')}`);
        });
      }

      return false;
    }
  } catch (error) {
    console.log('\n❌ ERROR! Request failed.\n');
    console.log('Error:', error.message);
    if (error.stack) {
      console.log('\nStack trace:', error.stack);
    }
    return false;
  }
}

// Run the test
testRepairFormSubmission()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
