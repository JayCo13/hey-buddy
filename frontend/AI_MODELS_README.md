# AI Models Implementation for Hey Buddy

This implementation provides comprehensive AI capabilities for the Hey Buddy React frontend, including Speech-to-Text (Whisper), Text Processing (Gemma 3), and Text-to-Speech (Piper) models that run entirely on-device and offline.

## 🚀 Features

- **Whisper**: High-quality speech-to-text transcription
- **Gemma 3**: Text summarization, question answering, sentiment analysis, and text generation
- **Piper**: Natural-sounding text-to-speech synthesis
- **Offline First**: All models run locally without internet connection
- **Progressive Web App**: Optimized for PWA with service worker caching
- **WebAssembly & WebGPU**: Efficient on-device model execution

## 📁 Project Structure

```
frontend/src/
├── services/
│   ├── modelLoader.js      # Model loading and caching utility
│   ├── whisperService.js   # Speech-to-text service
│   ├── gemmaService.js     # Text processing service
│   ├── piperService.js     # Text-to-speech service
│   └── ...
├── hooks/
│   └── useAI.js           # React hooks for AI services
├── components/
│   └── AIAssistant.jsx    # Comprehensive AI assistant component
└── ...

frontend/public/models/
├── whisper/
│   ├── whisper-tiny.en.onnx
│   ├── whisper-tiny.en.onnx.data
│   ├── tokenizer.json
│   └── vocab.json
├── gemma/
│   ├── gemma-2b-it.onnx
│   ├── gemma-2b-it.onnx.data
│   ├── tokenizer.json
│   ├── vocab.json
│   └── config.json
└── piper/
    ├── piper-en_US-lessac-medium.onnx
    ├── piper-en_US-lessac-medium.onnx.data
    └── config.json
```

## 🛠️ Installation & Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

The following packages are automatically installed:
- `@xenova/transformers`: For transformer model support
- `onnxruntime-web`: For ONNX model execution in the browser

### 2. Download Model Files

You need to download the AI model files and place them in the `public/models/` directory. Here are the recommended models:

#### Whisper (Speech-to-Text)
- **Model**: `whisper-tiny.en` (English, ~39MB)
- **Files needed**:
  - `whisper-tiny.en.onnx`
  - `whisper-tiny.en.onnx.data`
  - `tokenizer.json`
  - `vocab.json`

#### Gemma 3 (Text Processing)
- **Model**: `gemma-2b-it` (Instruction-tuned, ~5GB)
- **Files needed**:
  - `gemma-2b-it.onnx`
  - `gemma-2b-it.onnx.data`
  - `tokenizer.json`
  - `vocab.json`
  - `config.json`

#### Piper (Text-to-Speech)
- **Model**: `piper-en_US-lessac-medium` (~50MB)
- **Files needed**:
  - `piper-en_US-lessac-medium.onnx`
  - `piper-en_US-lessac-medium.onnx.data`
  - `config.json`

### 3. Model Conversion

The models need to be converted to ONNX format for browser execution. Here's how to convert them:

#### Converting Whisper
```bash
# Using transformers library
python -c "
from transformers import WhisperProcessor, WhisperForConditionalGeneration
import torch

processor = WhisperProcessor.from_pretrained('openai/whisper-tiny.en')
model = WhisperForConditionalGeneration.from_pretrained('openai/whisper-tiny.en')

# Convert to ONNX
torch.onnx.export(
    model,
    torch.randn(1, 80, 3000),  # Example input
    'whisper-tiny.en.onnx',
    export_params=True,
    opset_version=11
)
"
```

#### Converting Gemma
```bash
# Using transformers library
python -c "
from transformers import GemmaForCausalLM, GemmaTokenizer
import torch

model = GemmaForCausalLM.from_pretrained('google/gemma-2b-it')
tokenizer = GemmaTokenizer.from_pretrained('google/gemma-2b-it')

# Convert to ONNX
torch.onnx.export(
    model,
    torch.randint(0, 1000, (1, 128)),  # Example input
    'gemma-2b-it.onnx',
    export_params=True,
    opset_version=11
)
"
```

#### Converting Piper
```bash
# Using piper-tts
pip install piper-tts
python -c "
import piper
from piper import PiperVoice

# Download and convert model
voice = PiperVoice.load('en_US-lessac-medium')
voice.export_onnx('piper-en_US-lessac-medium.onnx')
"
```

### 4. Start Development Server

```bash
npm start
```

## 🎯 Usage

### Basic Usage with Hooks

```jsx
import { useWhisper, useGemma, usePiper } from './hooks/useAI';

function MyComponent() {
  const whisper = useWhisper();
  const gemma = useGemma();
  const piper = usePiper();

  // Speech-to-text
  const handleTranscribe = async (audioFile) => {
    const transcription = await whisper.transcribeFile(audioFile);
    console.log(transcription);
  };

  // Text summarization
  const handleSummarize = async (text) => {
    const summary = await gemma.summarizeText(text);
    console.log(summary);
  };

  // Text-to-speech
  const handleSpeak = async (text) => {
    await piper.speakText(text);
  };

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
}
```

### Using the AI Assistant Component

```jsx
import AIAssistant from './components/AIAssistant';

function App() {
  return (
    <div>
      <AIAssistant />
    </div>
  );
}
```

## 🔧 Configuration

### Model Configuration

You can modify model configurations in `modelLoader.js`:

```javascript
const modelConfigs = {
  whisper: {
    baseUrl: '/models/whisper/',
    files: ['whisper-tiny.en.onnx', 'whisper-tiny.en.onnx.data', 'tokenizer.json', 'vocab.json'],
    size: '~39MB'
  },
  // ... other models
};
```

### Service Parameters

#### Whisper Service
- Sample rate: 16kHz (configurable)
- Audio format: WAV, MP3, etc.
- Language: English (tiny model)

#### Gemma Service
- Max tokens: 2048 (configurable)
- Temperature: 0.7 (configurable)
- Tasks: Summarization, Q&A, sentiment analysis, text generation

#### Piper Service
- Sample rate: 22.05kHz
- Voices: Multiple speaker options
- Speed and pitch control

## 🌐 Browser Support

### Required Features
- WebAssembly support
- IndexedDB support
- Fetch API support
- AudioContext support

### Recommended Browsers
- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

### WebGPU Support (Optional)
- Chrome 113+ (with experimental flags)
- Firefox (in development)

## 📱 PWA Integration

The implementation is designed for Progressive Web Apps:

1. **Service Worker**: Models are cached for offline use
2. **IndexedDB**: Persistent model storage
3. **Responsive Design**: Works on mobile and desktop
4. **Offline First**: All functionality works without internet

## 🚨 Troubleshooting

### Common Issues

1. **Model Loading Fails**
   - Check if model files are in correct location
   - Verify file sizes and formats
   - Check browser console for errors

2. **Audio Issues**
   - Ensure microphone permissions are granted
   - Check audio format compatibility
   - Verify AudioContext support

3. **Performance Issues**
   - Use smaller models for better performance
   - Enable WebGPU if available
   - Check available memory

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('ai-debug', 'true');
```

## 📊 Performance Considerations

### Model Sizes
- Whisper Tiny: ~39MB
- Gemma 2B: ~5GB
- Piper Medium: ~50MB

### Memory Usage
- Initial load: ~100MB
- With all models: ~5.2GB
- Runtime: Additional 500MB-1GB

### Optimization Tips
1. Load models on demand
2. Use smaller models for mobile
3. Implement model quantization
4. Enable WebGPU acceleration

## 🔒 Privacy & Security

- **No Data Transmission**: All processing happens locally
- **No Cloud Dependencies**: Completely offline operation
- **Local Storage**: Models stored in browser IndexedDB
- **No Tracking**: No analytics or user data collection

## 📈 Future Enhancements

1. **Model Quantization**: Reduce model sizes
2. **WebGPU Acceleration**: Better performance
3. **More Languages**: Support for additional languages
4. **Custom Models**: User-uploaded model support
5. **Real-time Processing**: Streaming audio/text processing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This implementation is part of the Hey Buddy project. Please refer to the main project license.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review browser console errors
3. Verify model file integrity
4. Check browser compatibility

---

**Note**: This implementation provides a foundation for on-device AI capabilities. The actual model files need to be obtained and converted separately due to licensing and size considerations.
