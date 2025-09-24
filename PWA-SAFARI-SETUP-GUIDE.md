# Safari PWA Full-Screen Setup Guide

This guide provides complete instructions for configuring your Progressive Web App (PWA) to display in full-screen, native-like experience on Safari (iOS and macOS) without browser UI elements.

## Overview

The PWA configuration includes:
- ✅ `manifest.json` with Safari-specific settings
- ✅ HTML meta tags for full-screen mode
- ✅ Service worker with offline support
- ✅ CSS for safe area handling
- ✅ Deployment configuration for HTTPS
- ✅ Comprehensive troubleshooting guide

## Files Modified/Created

### 1. Manifest Configuration (`/frontend/public/manifest.json`)

**Key Safari-specific settings:**
- `display: "standalone"` - Primary display mode
- `display_override: ["fullscreen", "standalone", "minimal-ui"]` - Fallback modes
- Complete icon set with proper sizes (16x16 to 512x512)
- `theme_color: "#000000"` - Black theme for status bar
- `background_color: "#000000"` - Black background

### 2. HTML Meta Tags (`/frontend/public/index.html`)

**Safari-specific meta tags added:**
```html
<!-- Apple/Safari PWA Meta Tags -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Hey Buddy" />
<meta name="apple-touch-fullscreen" content="yes" />
<meta name="apple-mobile-web-app-orientations" content="portrait" />

<!-- Additional Safari Full-Screen Meta Tags -->
<meta name="apple-touch-icon-precomposed" content="icons/icon-192x192.png" />
<meta name="apple-touch-startup-image" content="splash/splash-1125x2436.png" />
```

### 3. Service Worker (`/frontend/public/sw.js`)

**Enhanced features:**
- Improved caching strategy
- Background sync support
- Push notification handling
- Safari-optimized fetch handling
- Offline fallback support

### 4. CSS Safe Area Support (`/frontend/src/index.css`)

**Safari-specific styles:**
```css
/* PWA Safe Area Utilities */
.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
}

/* Safari PWA specific styles */
.pwa-container {
  min-height: 100vh;
  min-height: 100dvh;
  width: 100vw;
  position: relative;
  background-color: #000000;
  color: #ffffff;
}
```

### 5. Deployment Configuration (`/netlify.toml`)

**PWA-specific headers:**
- Service Worker caching headers
- Manifest caching headers
- Security headers (CSP, HSTS)
- Cross-Origin policies for WebAssembly

## Deployment Instructions

### Prerequisites
1. **HTTPS Required**: PWAs must be served over HTTPS
2. **Valid SSL Certificate**: Ensure your domain has a valid SSL certificate
3. **Service Worker Support**: Browser must support service workers

### Step 1: Build the Application

```bash
cd frontend
npm run build
```

### Step 2: Deploy to Netlify

The `netlify.toml` configuration handles:
- Automatic HTTPS (Netlify provides SSL)
- Proper PWA headers
- Service worker caching
- SPA routing

### Step 3: Verify Deployment

1. **Check HTTPS**: Ensure your site loads with `https://`
2. **Test Service Worker**: Open DevTools → Application → Service Workers
3. **Verify Manifest**: Check DevTools → Application → Manifest
4. **Test Installation**: Look for "Add to Home Screen" prompt

## Testing on Safari (iOS/macOS)

### iOS Safari Testing

1. **Open Safari on iPhone/iPad**
2. **Navigate to your PWA URL**
3. **Tap Share button** → "Add to Home Screen"
4. **Launch from home screen** - should open in full-screen mode

### macOS Safari Testing

1. **Open Safari on Mac**
2. **Navigate to your PWA URL**
3. **Click Safari menu** → "Add to Dock" (if available)
4. **Or use Chrome/Edge** for PWA installation testing

## Troubleshooting Common Issues

### Issue 1: Safari Footer Still Appears

**Symptoms**: Browser footer/address bar visible in PWA mode

**Solutions**:
1. **Check manifest.json**:
   ```json
   {
     "display": "standalone",
     "display_override": ["fullscreen", "standalone", "minimal-ui"]
   }
   ```

2. **Verify meta tags**:
   ```html
   <meta name="apple-mobile-web-app-capable" content="yes" />
   <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
   ```

3. **Clear Safari cache**: Settings → Safari → Clear History and Website Data

### Issue 2: PWA Not Installable

**Symptoms**: No "Add to Home Screen" option appears

**Solutions**:
1. **Check HTTPS**: Ensure site is served over HTTPS
2. **Verify Service Worker**: Check DevTools → Application → Service Workers
3. **Check Manifest**: Validate manifest.json syntax
4. **Test in Chrome first**: Chrome has better PWA debugging tools

### Issue 3: Status Bar Overlaps Content

**Symptoms**: iOS status bar covers app content

**Solutions**:
1. **Use safe area CSS**:
   ```css
   body {
     padding-top: env(safe-area-inset-top);
   }
   ```

2. **Add status bar overlay**:
   ```css
   .status-bar-overlay {
     position: fixed;
     top: 0;
     left: 0;
     right: 0;
     height: env(safe-area-inset-top);
     background-color: #000000;
     z-index: 9999;
   }
   ```

### Issue 4: Service Worker Not Registering

**Symptoms**: Service worker fails to install or activate

**Solutions**:
1. **Check file paths**: Ensure `sw.js` is in the root directory
2. **Verify headers**: Check `netlify.toml` service worker headers
3. **Clear browser cache**: Force refresh with Cmd+Shift+R
4. **Check console errors**: Look for JavaScript errors in DevTools

### Issue 5: Icons Not Displaying

**Symptoms**: App icon shows generic icon or doesn't appear

**Solutions**:
1. **Check icon paths**: Ensure icons are in `/icons/` directory
2. **Verify icon sizes**: Icons must be exact pixel dimensions
3. **Check manifest.json**: Verify icon entries match actual files
4. **Test icon formats**: Use PNG format for best compatibility

## Advanced Configuration

### Custom Splash Screens

Add splash screen images for different device sizes:
- `/splash/splash-1125x2436.png` (iPhone X/11/12/13)
- `/splash/splash-1242x2688.png` (iPhone XS Max/11 Pro Max)
- `/splash/splash-1536x2048.png` (iPad)
- `/splash/splash-1668x2224.png` (iPad Pro)

### Background Sync

The service worker includes background sync support for offline actions:

```javascript
// Register background sync
navigator.serviceWorker.ready.then(registration => {
  return registration.sync.register('background-sync');
});
```

### Push Notifications

Configure push notifications in the service worker:

```javascript
// Request notification permission
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    // Subscribe to push notifications
  }
});
```

## Testing Checklist

- [ ] Site loads over HTTPS
- [ ] Service worker registers successfully
- [ ] Manifest.json validates without errors
- [ ] Icons display correctly in browser tabs
- [ ] "Add to Home Screen" option appears
- [ ] PWA launches in full-screen mode
- [ ] Status bar doesn't overlap content
- [ ] App works offline (basic functionality)
- [ ] Push notifications work (if implemented)
- [ ] Background sync works (if implemented)

## Browser Support

| Browser | PWA Support | Full-Screen | Service Worker |
|---------|-------------|-------------|----------------|
| Safari iOS 11.3+ | ✅ | ✅ | ✅ |
| Safari macOS 13+ | ✅ | ✅ | ✅ |
| Chrome Mobile | ✅ | ✅ | ✅ |
| Chrome Desktop | ✅ | ✅ | ✅ |
| Firefox Mobile | ✅ | ✅ | ✅ |
| Edge Mobile | ✅ | ✅ | ✅ |

## Additional Resources

- [Apple PWA Documentation](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
- [Web App Manifest Specification](https://www.w3.org/TR/appmanifest/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Checklist](https://web.dev/pwa-checklist/)

## Support

If you encounter issues not covered in this guide:

1. Check browser console for errors
2. Test in multiple browsers
3. Verify all file paths are correct
4. Ensure HTTPS is properly configured
5. Check network tab for failed requests

For additional help, refer to the browser developer tools and PWA debugging resources.
