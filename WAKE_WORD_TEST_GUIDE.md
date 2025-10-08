# Wake Word Feature - Test Guide

## Quick Test Steps

### Test 1: Wake Word Detection
1. Open the application in your browser
2. Allow microphone permissions when prompted
3. Wait for the greeting to complete on the home screen
4. Say "Hey Buddy" clearly into your microphone
5. **Expected Result**: 
   - Loading screen appears
   - Navigate to Record Screen
   - Buddy's response card appears with typing animation
   - Text-to-speech speaks the message aloud

### Test 2: Typing Animation
1. After saying "Hey Buddy", watch the response card
2. **Expected Result**:
   - Text appears character by character
   - Blue blinking cursor follows the text
   - Animation takes about 20ms per character
   - Total animation time: ~30-35 seconds for full message

### Test 3: Response Completion
1. Wait for the typing animation to complete
2. **Expected Result**:
   - Cursor disappears
   - "Dismiss" button appears (left side)
   - "Replay" button appears (right side)
   - TTS finishes speaking

### Test 4: Replay Functionality
1. After animation completes, click "Replay" button
2. **Expected Result**:
   - TTS speaks the message again
   - No re-typing animation
   - Message stays visible

### Test 5: Dismiss Functionality
1. After animation completes, click "Dismiss" button
2. **Expected Result**:
   - Response card disappears with smooth animation
   - State resets for next use
   - Normal Record Screen appears

### Test 6: Manual Navigation (No Wake Word)
1. From home screen, click the "Record" tab manually
2. **Expected Result**:
   - Navigate to Record Screen
   - NO automatic response
   - Normal record interface shows

## Visual Checklist

### Response Card Design
- [ ] Gradient background (blue to purple)
- [ ] Animated pulsing glow effect
- [ ] Buddy avatar with AudioWaveform icon
- [ ] "Buddy" title with bold text
- [ ] "Your AI Assistant" subtitle with green status dot
- [ ] Horizontal divider line
- [ ] Typing text animation
- [ ] Blinking cursor during typing
- [ ] Dismiss and Replay buttons after completion

### Animations
- [ ] Card slides up on appearance
- [ ] Background pulse animation
- [ ] Avatar pulse animation
- [ ] Status dot pulse animation
- [ ] Cursor blink animation
- [ ] Button hover effects (scale on replay button)

## Browser-Specific Tests

### Chrome/Edge
- Should work perfectly
- Full TTS support
- Full speech recognition support

### Safari (Desktop)
- Should work with minor differences in voice
- May require user interaction for TTS

### Safari (iOS)
- Requires user tap before TTS works
- Speech recognition works after microphone permission
- May show mobile-optimized interface

### Firefox
- TTS should work
- Speech recognition may have limitations

## Troubleshooting

### Issue: Wake word not detected
**Solution**: 
- Check microphone permissions
- Speak clearly and loud enough
- Try variations: "Hey Buddy", "Buddy", "Hi there"

### Issue: No typing animation
**Solution**:
- Check browser console for errors
- Ensure TypingText component is imported correctly
- Verify `showWakeWordResponse` state is true

### Issue: No TTS audio
**Solution**:
- Check browser audio permissions
- Ensure speakers/headphones are working
- On mobile, tap the screen first to enable audio
- Try the Replay button

### Issue: Response shows on manual navigation
**Solution**:
- This is a bug - `wakeWordTriggered` should be false
- Check AppNavigator logic
- Verify `autoPlayWakeWordResponse` prop

### Issue: Animation too fast/slow
**Solution**:
- Adjust `speed` prop in TypingText component
- Current: 20ms per character
- Increase for slower, decrease for faster

## Performance Verification

### Memory
- Check browser DevTools > Performance
- No memory leaks after dismiss
- Refs should be properly cleaned up

### Render Performance
- Typing animation should be smooth (60fps)
- No jank or stuttering
- Background animations don't block text typing

### Audio Performance
- TTS should start within 500ms
- No audio stuttering or glitches
- Clean audio cutoff when dismissed

## Expected Console Logs

When wake word is detected, you should see:
```
🎤 Wake word detected: [variation] [transcript]
🎤 Navigating to record room...
```

When response plays:
```
(No specific logs, but watch for errors)
```

## Success Criteria

✅ Wake word detection works consistently  
✅ Navigation to Record Screen is smooth  
✅ Typing animation plays without errors  
✅ TTS speaks the full message  
✅ UI is visually appealing and polished  
✅ Dismiss button clears the response  
✅ Replay button works correctly  
✅ No console errors  
✅ No memory leaks  
✅ Works on target browsers (Chrome, Safari, Edge)

## Known Limitations

1. **Mobile TTS**: Requires user interaction first (browser security)
2. **Wake Word Accuracy**: Depends on microphone quality and background noise
3. **One-Time Play**: Response only plays on first wake word detection per session
4. **Browser Support**: Some older browsers may not support all features

## Demo Video Checklist

If recording a demo, show:
1. Starting the app (home screen)
2. Saying "Hey Buddy"
3. Loading screen transition
4. Typing animation in action
5. Full response text
6. TTS speaking (with audio)
7. Replay button functionality
8. Dismiss button functionality
9. Manual navigation (no auto-response)

## Feedback Points

After testing, note:
- Animation speed preference
- UI/design improvements
- TTS voice quality
- Any bugs or edge cases
- Performance on different devices
- Accessibility concerns



