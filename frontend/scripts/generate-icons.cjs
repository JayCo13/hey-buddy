const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

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

function generateIconManifest() {
  return iconSizes.map(icon => ({
    src: `icons/${icon.name}`,
    sizes: `${icon.size}x${icon.size}`,
    type: 'image/png',
    purpose: icon.size >= 192 ? 'any maskable' : 'any'
  }));
}

function generateSplashManifest() {
  return splashSizes.map(splash => ({
    src: `splash/${splash.name}`,
    sizes: `${splash.width}x${splash.height}`,
    type: 'image/png',
    form_factor: splash.width < 1000 ? 'narrow' : 'wide'
  }));
}

function createPNG(width, height) {
  const png = new PNG({ width, height });
  
  // Create a gradient background
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      
      // Calculate distance from center for gradient
      const centerX = width / 2;
      const centerY = height / 2;
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      const maxDistance = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
      const gradient = 1 - (distance / maxDistance);
      
      // Set color (blue gradient)
      png.data[idx] = Math.round(0 * gradient);   // R
      png.data[idx + 1] = Math.round(122 * gradient); // G
      png.data[idx + 2] = Math.round(255 * gradient); // B
      png.data[idx + 3] = 255; // Alpha
    }
  }
  
  return png;
}

async function generateIconFiles() {
  const publicDir = path.join(__dirname, '..', 'public');
  
  // Generate icons
  for (const icon of iconSizes) {
    const filePath = path.join(publicDir, 'icons', icon.name);
    const png = createPNG(icon.size, icon.size);
    
    // Save the PNG
    const buffer = PNG.sync.write(png);
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Generated ${icon.name}`);
  }

  // Generate splash screens
  for (const splash of splashSizes) {
    const filePath = path.join(publicDir, 'splash', splash.name);
    const png = createPNG(splash.width, splash.height);
    
    // Save the PNG
    const buffer = PNG.sync.write(png);
    fs.writeFileSync(filePath, buffer);
    console.log(`✅ Generated ${splash.name}`);
  }
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

async function main() {
  console.log('🎨 Generating PWA icons and splash screens...');
  
  createDirectories();
  await generateIconFiles();
  updateManifest();
  
  console.log('✨ Icon generation complete!');
  console.log('🚀 Your PWA is ready with custom icons!');
}

main().catch(console.error);

module.exports = {
  generateIconManifest,
  generateSplashManifest,
  iconSizes,
  splashSizes
};