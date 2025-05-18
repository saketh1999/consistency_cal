#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Read .env.local file
console.log("Verifying OAuth credentials in .env.local...");
let envContent;

try {
  envContent = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
  console.log("✅ .env.local file read successfully");
} catch (err) {
  console.error("❌ Error reading .env.local file:", err.message);
  process.exit(1);
}

// Parse environment variables from the file
const envVars = {};
envContent.split('\n').forEach(line => {
  // Skip comments or empty lines
  if (line.startsWith('#') || !line.trim()) return;
  
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    const value = valueParts.join('=').trim();
    envVars[key.trim()] = value;
  }
});

// Check Google API Key
console.log("\n--- API Key Check ---");
const apiKey = envVars['NEXT_PUBLIC_GOOGLE_API_KEY'];
if (!apiKey) {
  console.error("❌ NEXT_PUBLIC_GOOGLE_API_KEY is missing");
} else {
  console.log(`✅ API Key found (${apiKey.length} characters)`);
  
  // Perform basic validation
  if (apiKey.length < 20) {
    console.warn("⚠️  Warning: API Key seems too short");
  }
  
  if (apiKey.includes(' ')) {
    console.error("❌ Error: API Key contains spaces");
  }
  
  // Check if it starts with expected prefix (many Google API keys start with "AIza")
  if (apiKey.startsWith('AIza')) {
    console.log("✅ API Key has valid Google prefix (AIza...)");
  } else {
    console.warn("⚠️  Warning: API Key doesn't start with typical Google prefix (AIza...)");
  }
}

// Check Client ID
console.log("\n--- Client ID Check ---");
const clientId = envVars['NEXT_PUBLIC_GOOGLE_CLIENT_ID'];
if (!clientId) {
  console.error("❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing");
} else {
  console.log(`✅ Client ID found (${clientId.length} characters)`);
  
  // Perform basic validation
  if (clientId.length < 30) {
    console.warn("⚠️  Warning: Client ID seems too short");
  }
  
  if (clientId.includes(' ')) {
    console.error("❌ Error: Client ID contains spaces");
  }
  
  // Check if it ends with expected domain
  if (clientId.endsWith('.apps.googleusercontent.com')) {
    console.log("✅ Client ID has valid Google domain (.apps.googleusercontent.com)");
  } else {
    console.error("❌ Error: Client ID doesn't end with .apps.googleusercontent.com");
    console.log("   This is required for OAuth to work correctly");
  }
}

console.log("\nUse these credentials with your OAuth consent screen:");
console.log("1. Make sure you've added yourself as a test user");
console.log("2. Verify you've added http://localhost:3000 to Authorized JavaScript origins");
console.log("3. Check that you've enabled the Google Calendar API");

console.log("\nFor more detailed instructions, see GOOGLE_CALENDAR_SETUP.md"); 