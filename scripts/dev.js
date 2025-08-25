#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 NaidiZakupku Chrome Extension Development Helper');
console.log('==================================================\n');

// Check if dist folder exists
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.log('📦 Building project...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build completed successfully!\n');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

console.log('📋 Available commands:');
console.log('  npm run build     - Build the extension');
console.log('  npm run dev       - Build the extension');
console.log('  npm run clean     - Clean dist folder');
console.log('\n📁 Extension files are in: dist/');
console.log('🔧 Load the dist/ folder in Chrome Extensions to test');
console.log('\n💡 Tips:');
console.log('  - Use npm run build to rebuild after changes');
console.log('  - Check Chrome DevTools for logs');
console.log('  - Background script logs: chrome://extensions/ → Service Worker');
console.log('  - Content script logs: DevTools on zakupki.gov.ru pages');
