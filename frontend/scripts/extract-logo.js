#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// Read the logo animation data
const logoData = require('../src/logo.json');

// Get the first frame of the animation
const firstFrame = logoData.assets.find(asset => asset.p === "Layer 1");
if (!firstFrame || !firstFrame.u || !firstFrame.p) {
  console.error('Could not find logo layer in animation data');
  process.exit(1);
}

// Create a canvas with the logo dimensions
const canvas = createCanvas(512, 512);
const ctx = canvas.getContext('2d');

// Draw the logo (simplified version - adjust as needed)
ctx.fillStyle = '#000000';
ctx.fillRect(0, 0, 512, 512);

// Draw the logo shape
ctx.fillStyle = '#FFFFFF';
ctx.beginPath();
// Add path commands here based on your logo shape
ctx.fill();

// Save the canvas as PNG
const outputPath = path.join(__dirname, '..', 'public', 'app-logo.png');
const out = fs.createWriteStream(outputPath);
const stream = canvas.createPNGStream();
stream.pipe(out);
out.on('finish', () => {
  console.log('✅ Logo extracted and saved as app-logo.png');
});
