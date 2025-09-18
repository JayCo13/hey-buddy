#!/bin/bash

# Post-build script for Netlify
# This ensures PWA files are available after the build

echo "🚀 Post-build PWA setup..."

# Copy PWA files from public to build
if [ -f "public/sw.js" ]; then
  cp public/sw.js build/sw.js
  echo "✅ Copied sw.js"
fi

if [ -f "public/offline.html" ]; then
  cp public/offline.html build/offline.html
  echo "✅ Copied offline.html"
fi

if [ -f "public/_headers" ]; then
  cp public/_headers build/_headers
  echo "✅ Copied _headers"
fi

# Verify critical files exist
if [ -f "build/manifest.json" ]; then
  echo "✅ manifest.json exists"
else
  echo "❌ manifest.json missing"
fi

if [ -f "build/sw.js" ]; then
  echo "✅ sw.js exists"
else
  echo "❌ sw.js missing"
fi

echo "🎉 Post-build PWA setup complete!"
