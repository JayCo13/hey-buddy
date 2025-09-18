#!/usr/bin/env node

/**
 * Icon Generation Script for Hey Buddy PWA
 * This script generates various icon sizes needed for PWA
 * 
 * Note: This is a placeholder script. In production, you would use
 * tools like ImageMagick, Sharp, or online generators to create
 * actual icon files from a source image.
 */

const fs = require('fs');
const path = require('path');

const iconSizes = [
  { size: 16, name: 'icon-16x16.png' },
  { size: 32, name: 'icon-32x32.png' },
  { size: 48, name: 'icon-48x48.png' },
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

const splashSizes = [
  { width: 640, height: 1136, name: 'splash-640x1136.png' },
  { width: 750, height: 1334, name: 'splash-750x1334.png' },
  { width: 828, height: 1792, name: 'splash-828x1792.png' },
  { width: 1125, height: 2436, name: 'splash-1125x2436.png' },
  { width: 1242, height: 2688, name: 'splash-1242x2688.png' },
  { width: 1536, height: 2048, name: 'splash-1536x2048.png' },
  { width: 1668, height: 2224, name: 'splash-1668x2224.png' },
  { width: 2048, height: 2732, name: 'splash-2048x2732.png' }
];

function generateIconManifest() {
  const icons = iconSizes.map(icon => ({
    src: `icons/${icon.name}`,
    sizes: `${icon.size}x${icon.size}`,
    type: 'image/png',
    purpose: icon.size >= 192 ? 'any maskable' : 'any'
  }));

  return icons;
}

function generateSplashManifest() {
  const splashScreens = splashSizes.map(splash => ({
    src: `splash/${splash.name}`,
    sizes: `${splash.width}x${splash.height}`,
    type: 'image/png',
    form_factor: splash.width < 1000 ? 'narrow' : 'wide'
  }));

  return splashScreens;
}

function createDirectories() {
  const publicDir = path.join(__dirname, '..', 'public');
  const iconsDir = path.join(publicDir, 'icons');
  const splashDir = path.join(publicDir, 'splash');

  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  if (!fs.existsSync(splashDir)) {
    fs.mkdirSync(splashDir, { recursive: true });
  }
}

function generatePlaceholderFiles() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Create placeholder files (in production, these would be actual images)
  iconSizes.forEach(icon => {
    const filePath = path.join(publicDir, 'icons', icon.name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `# Placeholder for ${icon.name}\n# Replace with actual ${icon.size}x${icon.size} PNG image`);
    }
  });

  splashSizes.forEach(splash => {
    const filePath = path.join(publicDir, 'splash', splash.name);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, `# Placeholder for ${splash.name}\n# Replace with actual ${splash.width}x${splash.height} PNG image`);
    }
  });
}

function updateManifest() {
  const publicDir = path.join(__dirname, '..', 'public');
  const manifestPath = path.join(publicDir, 'manifest.json');
  
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Update icons
    manifest.icons = generateIconManifest();
    
    // Add splash screens
    manifest.screenshots = generateSplashManifest();
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Updated manifest.json with generated icon references');
  }
}

function main() {
  console.log('🎨 Generating PWA icons and splash screens...');
  
  createDirectories();
  generatePlaceholderFiles();
  updateManifest();
  
  console.log('📝 Icon generation complete!');
  console.log('📋 Next steps:');
  console.log('   1. Replace placeholder files in public/icons/ with actual PNG images');
  console.log('   2. Replace placeholder files in public/splash/ with actual PNG images');
  console.log('   3. Use tools like ImageMagick or online generators to create the images');
  console.log('   4. Recommended source image: 1024x1024 PNG with transparent background');
}

if (require.main === module) {
  main();
}

module.exports = {
  generateIconManifest,
  generateSplashManifest,
  iconSizes,
  splashSizes
};
