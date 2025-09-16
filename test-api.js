// Simple API test script
const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing jobs API...');
    const response = await fetch('http://localhost:3001/api/jobs');
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
      console.log('✅ API working correctly!');
    } else {
      console.log('❌ API returned error status:', response.status);
      const errorText = await response.text();
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ API test failed:', error.message);
  }
}

testAPI();
