#!/usr/bin/env node

/**
 * Copy PWA files to build directory
 * This script ensures PWA files are copied during the build process
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const buildDir = path.join(__dirname, '..', 'build');

// Files to copy from public to build
const pwaFiles = [
  'sw.js',
  'offline.html',
  '_headers'
];

function copyPwaFiles() {
  console.log('📁 Copying PWA files to build directory...');
  
  // Ensure build directory exists
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory does not exist. Run "npm run build" first.');
    process.exit(1);
  }
  
  let copiedCount = 0;
  
  pwaFiles.forEach(file => {
    const sourcePath = path.join(publicDir, file);
    const destPath = path.join(buildDir, file);
    
    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, destPath);
        console.log(`✅ Copied ${file}`);
        copiedCount++;
      } catch (error) {
        console.error(`❌ Failed to copy ${file}:`, error.message);
      }
    } else {
      console.warn(`⚠️  ${file} not found in public directory`);
    }
  });
  
  console.log(`📋 Copied ${copiedCount}/${pwaFiles.length} PWA files`);
  
  // Verify critical files
  const criticalFiles = ['sw.js', 'manifest.json'];
  const missingFiles = criticalFiles.filter(file => 
    !fs.existsSync(path.join(buildDir, file))
  );
  
  if (missingFiles.length > 0) {
    console.error(`❌ Critical PWA files missing: ${missingFiles.join(', ')}`);
    process.exit(1);
  }
  
  console.log('🎉 PWA files copied successfully!');
}

if (require.main === module) {
  copyPwaFiles();
}

module.exports = { copyPwaFiles };
