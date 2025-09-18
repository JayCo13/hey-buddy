#!/usr/bin/env node

/**
 * Post-build PWA setup script
 * This script runs after the React build and sets up PWA files
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

function setupPwaFiles() {
  console.log('🚀 Setting up PWA files...');
  
  // Check if build directory exists
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory does not exist');
    return false;
  }
  
  let success = true;
  let copiedCount = 0;
  
  // Copy PWA files
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
        success = false;
      }
    } else {
      console.warn(`⚠️  ${file} not found in public directory`);
    }
  });
  
  console.log(`📋 Copied ${copiedCount}/${pwaFiles.length} PWA files`);
  
  // Check if critical files exist
  const criticalFiles = ['manifest.json', 'index.html', 'sw.js'];
  const existingFiles = criticalFiles.filter(file => 
    fs.existsSync(path.join(buildDir, file))
  );
  
  console.log(`📄 Critical files present: ${existingFiles.length}/${criticalFiles.length}`);
  existingFiles.forEach(file => console.log(`  ✅ ${file}`));
  
  const missingFiles = criticalFiles.filter(file => 
    !fs.existsSync(path.join(buildDir, file))
  );
  
  if (missingFiles.length > 0) {
    console.warn(`⚠️  Missing files: ${missingFiles.join(', ')}`);
    console.log('📁 Build directory contents:');
    try {
      const buildContents = fs.readdirSync(buildDir);
      buildContents.forEach(item => {
        const itemPath = path.join(buildDir, item);
        const stats = fs.statSync(itemPath);
        console.log(`  ${stats.isDirectory() ? '📁' : '📄'} ${item}`);
      });
    } catch (error) {
      console.error('Failed to list build directory:', error.message);
    }
  }
  
  if (success) {
    console.log('🎉 PWA setup completed successfully!');
  } else {
    console.log('⚠️  PWA setup completed with warnings');
  }
  
  return success;
}

if (require.main === module) {
  const success = setupPwaFiles();
  // Don't exit with error code - let the build succeed even with warnings
  process.exit(0);
}

module.exports = { setupPwaFiles };
