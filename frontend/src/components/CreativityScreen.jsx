import React, { useState, useMemo } from 'react';
import { Mic, StopCircle, Image as ImageIcon, Sparkles, ArrowLeft, RefreshCw } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { usePiper } from '../hooks/useAI';
import imageService from '../services/imageService';

const CreativityScreen = ({ onNavigate }) => {
  const [textPrompt, setTextPrompt] = useState('');
  const [emotion, setEmotion] = useState('happy');
  const [style, setStyle] = useState('photorealistic');
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const emotions = useMemo(() => [
    'happy','calm','excited','sad','stressed','loved','motivated','relaxed','energetic','thoughtful','neutral'
  ], []);

  const styles = useMemo(() => [
    'photorealistic','anime','abstract','artistic'
  ], []);

  const { isListening, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onResult: (txt, isFinal) => {
      if (isFinal) setTextPrompt((prev) => (prev ? `${prev} ${txt}` : txt));
    },
    onError: (e) => setError(String(e))
  });

  const { isInitialized, speakText } = (() => {
    try {
      // Optional TTS; falls back silently if Piper not ready
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { isInitialized, speakText } = usePiper();
      return { isInitialized, speakText };
    } catch {
      return { isInitialized: false, speakText: async () => {} };
    }
  })();

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isInitialized) {
        await speakText('Generating your creative image.');
      } else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance('Generating your creative image.');
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }

      const result = await imageService.generateEmotionImage(emotion, textPrompt || null, style);
      if (result && result.image_url) {
        setImageUrl(result.image_url);
        if (isInitialized) {
          await speakText('Your image is ready.');
        }
      } else {
        setError('Failed to generate image');
      }
    } catch (e) {
      setError(e?.message || 'Failed to generate image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center space-x-2 text-gray-300 hover:text-white"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <span className="font-semibold">Unleash your creativity</span>
        </div>
        <div />
      </div>

      {/* Controls */}
      <div className="px-6 space-y-4">
        <div className="bg-gray-800 rounded-2xl p-4 space-y-3">
          <label className="text-sm text-gray-300">Describe your idea</label>
          <textarea
            className="w-full bg-gray-900 rounded-xl p-3 outline-none border border-gray-700 focus:border-blue-500/50 transition-colors"
            rows={3}
            placeholder="e.g., morning walk in a calm zen garden"
            value={textPrompt}
            onChange={(e) => setTextPrompt(e.target.value)}
          />
          <div className="flex items-center space-x-2">
            {!isListening ? (
              <button
                onClick={() => { setError(null); startListening(); }}
                disabled={!isSupported}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm disabled:opacity-50 flex items-center space-x-2"
              >
                <Mic className="w-4 h-4" />
                <span>Speak</span>
              </button>
            ) : (
              <button
                onClick={() => { stopListening(); resetTranscript(); }}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm flex items-center space-x-2"
              >
                <StopCircle className="w-4 h-4" />
                <span>Stop</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 rounded-2xl p-4">
            <label className="text-sm text-gray-300">Emotion</label>
            <select
              className="w-full mt-2 bg-gray-900 rounded-lg p-2 border border-gray-700 focus:border-blue-500/50"
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
            >
              {emotions.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div className="bg-gray-800 rounded-2xl p-4">
            <label className="text-sm text-gray-300">Style</label>
            <select
              className="w-full mt-2 bg-gray-900 rounded-lg p-2 border border-gray-700 focus:border-blue-500/50"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            >
              {styles.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-gray-800 rounded-2xl p-4">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" />
                <span>Generate image</span>
              </>
            )}
          </button>
          {error && (
            <p className="text-sm text-red-400 mt-3">{error}</p>
          )}
        </div>

        {imageUrl && (
          <div className="relative w-full h-72 bg-gray-900 rounded-2xl overflow-hidden">
            <img src={imageUrl} alt="generated" className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="capitalize">{emotion} • {style}</span>
                <button
                  onClick={handleGenerate}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  title="Regenerate"
                >
                  <RefreshCw className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreativityScreen;


