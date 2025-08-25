#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📦 Bundling Chrome extension modules...');

function bundleModules() {
  const srcPath = path.join(__dirname, '..', 'src');
  const distPath = path.join(__dirname, '..', 'dist');
  
  // Ensure dist directory exists
  if (!fs.existsSync(distPath)) {
    fs.mkdirSync(distPath, { recursive: true });
  }
  
  // Read background script dependencies only
  const backgroundModules = {
    'config.js': fs.readFileSync(path.join(srcPath, 'config.js'), 'utf8'),
    'localStorage.js': fs.readFileSync(path.join(srcPath, 'localStorage.js'), 'utf8'),
    'api.js': fs.readFileSync(path.join(srcPath, 'api.js'), 'utf8'),
    'background.js': fs.readFileSync(path.join(srcPath, 'background.js'), 'utf8')
  };
  
  // Create a bundled version for background script
  let bundledBackgroundContent = '';
  
  // Add each module's content (excluding import/export statements)
  for (const [moduleName, content] of Object.entries(backgroundModules)) {
    // Remove import statements and export keywords, keep the actual code
    let processedContent = content
      .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '')
      .replace(/export\s+/g, '')
      .replace(/\/\/# sourceMappingURL=.*$/gm, '');
    
    bundledBackgroundContent += `// ${moduleName}\n${processedContent}\n\n`;
  }
  
  // Write the bundled background file
  const bundledBackgroundPath = path.join(distPath, 'background-bundled.js');
  fs.writeFileSync(bundledBackgroundPath, bundledBackgroundContent);
  
  console.log('✅ Bundled background script created: background-bundled.js');
  
  // Create bundled content script (only application.js)
  const applicationContent = fs.readFileSync(path.join(srcPath, 'application.js'), 'utf8')
    .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '')
    .replace(/export\s+/g, '')
    .replace(/\/\/# sourceMappingURL=.*$/gm, '');
  
  const bundledApplicationPath = path.join(distPath, 'application-bundled.js');
  fs.writeFileSync(bundledApplicationPath, `// application.js\n${applicationContent}`);
  
  console.log('✅ Bundled content script created: application-bundled.js');
  
  // Create bundled popup script with dependencies
  const popupModules = {
    'config.js': fs.readFileSync(path.join(srcPath, 'config.js'), 'utf8'),
    'localStorage.js': fs.readFileSync(path.join(srcPath, 'localStorage.js'), 'utf8'),
    'api.js': fs.readFileSync(path.join(srcPath, 'api.js'), 'utf8'),
    'popup.js': fs.readFileSync(path.join(srcPath, 'popup.js'), 'utf8')
  };
  
  let bundledPopupContent = '';
  
  // Add each module's content (excluding import/export statements)
  for (const [moduleName, content] of Object.entries(popupModules)) {
    // Remove import statements and export keywords, keep the actual code
    let processedContent = content
      .replace(/import\s+.*?from\s+['"][^'"]+['"];?\n?/g, '')
      .replace(/export\s+/g, '')
      .replace(/\/\/# sourceMappingURL=.*$/gm, '');
    
    bundledPopupContent += `// ${moduleName}\n${processedContent}\n\n`;
  }
  
  const bundledPopupPath = path.join(distPath, 'popup.js');
  fs.writeFileSync(bundledPopupPath, bundledPopupContent);
  
  console.log('✅ Bundled popup script created: popup.js');
  
  // Update manifest to use the bundled files
  const manifestPath = path.join(distPath, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  manifest.background.service_worker = 'background-bundled.js';
  // Remove type: module since we're bundling
  delete manifest.background.type;
  
  // Update content scripts
  manifest.content_scripts[0].js = ['application-bundled.js'];
  delete manifest.content_scripts[0].type;
  
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log('✅ Updated manifest.json to use bundled scripts');
}

bundleModules();
