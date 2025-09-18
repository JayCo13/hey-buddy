#!/usr/bin/env node

/**
 * PWA Testing Script
 * Tests various PWA features and configurations
 */

const fs = require('fs');
const path = require('path');

function testManifest() {
  console.log('🔍 Testing Web App Manifest...');
  
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ manifest.json not found');
    return false;
  }
  
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Check required fields
    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    const missingFields = requiredFields.filter(field => !manifest[field]);
    
    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    // Check icons
    if (manifest.icons.length < 2) {
      console.error('❌ At least 2 icons required');
      return false;
    }
    
    // Check icon sizes
    const iconSizes = manifest.icons.map(icon => icon.sizes);
    const hasRequiredSizes = iconSizes.some(sizes => 
      sizes.includes('192x192') || sizes.includes('512x512')
    );
    
    if (!hasRequiredSizes) {
      console.error('❌ Icons must include 192x192 or 512x512 sizes');
      return false;
    }
    
    console.log('✅ Manifest validation passed');
    return true;
  } catch (error) {
    console.error('❌ Invalid manifest.json:', error.message);
    return false;
  }
}

function testServiceWorker() {
  console.log('🔍 Testing Service Worker...');
  
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');
  
  if (!fs.existsSync(swPath)) {
    console.error('❌ Service worker not found');
    return false;
  }
  
  const swContent = fs.readFileSync(swPath, 'utf8');
  
  // Check for required service worker features
  const requiredFeatures = [
    'addEventListener',
    'install',
    'activate',
    'fetch',
    'caches'
  ];
  
  const missingFeatures = requiredFeatures.filter(feature => 
    !swContent.includes(feature)
  );
  
  if (missingFeatures.length > 0) {
    console.error(`❌ Missing service worker features: ${missingFeatures.join(', ')}`);
    return false;
  }
  
  console.log('✅ Service worker validation passed');
  return true;
}

function testOfflinePage() {
  console.log('🔍 Testing Offline Page...');
  
  const offlinePath = path.join(__dirname, '..', 'public', 'offline.html');
  
  if (!fs.existsSync(offlinePath)) {
    console.error('❌ Offline page not found');
    return false;
  }
  
  const offlineContent = fs.readFileSync(offlinePath, 'utf8');
  
  if (!offlineContent.includes('<!DOCTYPE html>')) {
    console.error('❌ Invalid HTML in offline page');
    return false;
  }
  
  console.log('✅ Offline page validation passed');
  return true;
}

function testIcons() {
  console.log('🔍 Testing Icons...');
  
  const publicDir = path.join(__dirname, '..', 'public');
  const requiredIcons = ['favicon.ico', 'logo192.png', 'logo512.png'];
  
  const missingIcons = requiredIcons.filter(icon => 
    !fs.existsSync(path.join(publicDir, icon))
  );
  
  if (missingIcons.length > 0) {
    console.warn(`⚠️  Missing icons: ${missingIcons.join(', ')}`);
    console.log('   These are referenced in manifest.json but may not exist');
  } else {
    console.log('✅ Required icons found');
  }
  
  return missingIcons.length === 0;
}

function testNetlifyConfig() {
  console.log('🔍 Testing Netlify Configuration...');
  
  const netlifyPath = path.join(__dirname, '..', '..', 'netlify.toml');
  
  if (!fs.existsSync(netlifyPath)) {
    console.error('❌ netlify.toml not found');
    return false;
  }
  
  const config = fs.readFileSync(netlifyPath, 'utf8');
  
  // Check for PWA-specific configurations
  const requiredConfigs = [
    'Cache-Control',
    'Service-Worker-Allowed',
    'X-Frame-Options'
  ];
  
  const missingConfigs = requiredConfigs.filter(configItem => 
    !config.includes(configItem)
  );
  
  if (missingConfigs.length > 0) {
    console.warn(`⚠️  Missing Netlify configurations: ${missingConfigs.join(', ')}`);
  } else {
    console.log('✅ Netlify configuration validation passed');
  }
  
  return missingConfigs.length === 0;
}

function testBuildFiles() {
  console.log('🔍 Testing Build Configuration...');
  
  const packagePath = path.join(__dirname, '..', 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (!packageJson.scripts || !packageJson.scripts.build) {
    console.error('❌ Build script not found in package.json');
    return false;
  }
  
  console.log('✅ Build configuration validation passed');
  return true;
}

function runAllTests() {
  console.log('🚀 Running PWA Tests...\n');
  
  const tests = [
    testManifest,
    testServiceWorker,
    testOfflinePage,
    testIcons,
    testNetlifyConfig,
    testBuildFiles
  ];
  
  const results = tests.map(test => test());
  const passed = results.filter(result => result).length;
  const total = results.length;
  
  console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All PWA tests passed! Your app is ready for deployment.');
  } else {
    console.log('⚠️  Some tests failed. Please fix the issues before deploying.');
  }
  
  return passed === total;
}

// Run tests if called directly
if (require.main === module) {
  const success = runAllTests();
  process.exit(success ? 0 : 1);
}

module.exports = {
  testManifest,
  testServiceWorker,
  testOfflinePage,
  testIcons,
  testNetlifyConfig,
  testBuildFiles,
  runAllTests
};
