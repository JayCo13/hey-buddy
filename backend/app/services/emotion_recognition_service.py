import torch
import torchaudio
import librosa
import numpy as np
from transformers import Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor
import soundfile as sf
import io
import logging
from typing import Dict, List, Optional, Tuple
import asyncio
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

class EmotionRecognitionService:
    def __init__(self):
        self.model = None
        self.feature_extractor = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.executor = ThreadPoolExecutor(max_workers=2)
        self.emotion_labels = [
            "angry", "calm", "disgust", "fearful", "happy", "neutral", "sad", "surprised"
        ]
        
    async def initialize_model(self):
        """Initialize the emotion recognition model asynchronously"""
        try:
            logger.info("Loading emotion recognition model...")
            
            # Load the model and feature extractor
            model_name = "ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
            
            # Run model loading in thread pool to avoid blocking
            loop = asyncio.get_event_loop()
            self.model, self.feature_extractor = await loop.run_in_executor(
                self.executor,
                self._load_model,
                model_name
            )
            
            logger.info(f"Emotion recognition model loaded successfully on {self.device}")
            
        except Exception as e:
            logger.error(f"Failed to initialize emotion recognition model: {e}")
            raise
    
    def _load_model(self, model_name: str) -> Tuple[Wav2Vec2ForSequenceClassification, Wav2Vec2FeatureExtractor]:
        """Load the model and feature extractor (runs in thread pool)"""
        model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
        feature_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
        
        model.to(self.device)
        model.eval()
        
        return model, feature_extractor
    
    async def process_audio_file(self, audio_data: bytes, sample_rate: int = 16000) -> Dict:
        """Process audio file and return emotion predictions"""
        try:
            if not self.model or not self.feature_extractor:
                await self.initialize_model()
            
            # Run audio processing in thread pool
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._process_audio,
                audio_data,
                sample_rate
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing audio for emotion recognition: {e}")
            return {
                "error": str(e),
                "emotions": {},
                "dominant_emotion": "unknown",
                "confidence": 0.0
            }
    
    def _process_audio(self, audio_data: bytes, sample_rate: int) -> Dict:
        """Process audio data and return emotion predictions (runs in thread pool)"""
        try:
            # Try different methods to load audio
            audio_array = None
            sr = None
            
            # Method 1: Try librosa first
            try:
                audio_array, sr = librosa.load(io.BytesIO(audio_data), sr=sample_rate)
                logger.info(f"Loaded audio with librosa: {sr}Hz, {len(audio_array)} samples")
            except Exception as e:
                logger.warning(f"Librosa failed: {e}")
            
            # Method 2: Try soundfile if librosa fails
            if audio_array is None:
                try:
                    import soundfile as sf
                    audio_array, sr = sf.read(io.BytesIO(audio_data))
                    logger.info(f"Loaded audio with soundfile: {sr}Hz, {len(audio_array)} samples")
                except Exception as e:
                    logger.warning(f"Soundfile failed: {e}")
            
            # Method 3: Try with different sample rates if still failing
            if audio_array is None:
                try:
                    for test_sr in [16000, 22050, 44100, 48000]:
                        try:
                            audio_array, sr = librosa.load(io.BytesIO(audio_data), sr=test_sr)
                            logger.info(f"Loaded audio with librosa at {test_sr}Hz: {len(audio_array)} samples")
                            break
                        except:
                            continue
                except Exception as e:
                    logger.warning(f"All sample rate attempts failed: {e}")
            
            if audio_array is None:
                raise Exception("Could not load audio with any method")
            
            # Ensure audio is mono
            if len(audio_array.shape) > 1:
                audio_array = librosa.to_mono(audio_array)
            
            # Resample to 16kHz if needed (required by the model)
            if sr != 16000:
                audio_array = librosa.resample(audio_array, orig_sr=sr, target_sr=16000)
                sr = 16000
            
            # Ensure minimum length (at least 1 second)
            min_length = 16000  # 1 second at 16kHz
            if len(audio_array) < min_length:
                # Pad with zeros
                audio_array = np.pad(audio_array, (0, min_length - len(audio_array)), 'constant')
            
            # Extract features
            inputs = self.feature_extractor(
                audio_array,
                sampling_rate=16000,
                return_tensors="pt",
                padding=True
            )
            
            # Move to device
            inputs = {k: v.to(self.device) for k, v in inputs.items()}
            
            # Get predictions
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            
            # Convert to probabilities
            probabilities = predictions.cpu().numpy()[0]
            
            # Create emotion dictionary
            emotions = {
                label: float(prob) 
                for label, prob in zip(self.emotion_labels, probabilities)
            }
            
            # Find dominant emotion
            dominant_emotion_idx = np.argmax(probabilities)
            dominant_emotion = self.emotion_labels[dominant_emotion_idx]
            confidence = float(probabilities[dominant_emotion_idx])
            
            return {
                "emotions": emotions,
                "dominant_emotion": dominant_emotion,
                "confidence": confidence,
                "audio_duration": len(audio_array) / 16000,  # duration in seconds
                "sample_rate": 16000
            }
            
        except Exception as e:
            logger.error(f"Error in audio processing: {e}")
            raise
    
    async def process_audio_stream(self, audio_chunks: List[bytes], sample_rate: int = 16000) -> Dict:
        """Process streaming audio chunks for real-time emotion detection"""
        try:
            if not audio_chunks:
                return {
                    "emotions": {},
                    "dominant_emotion": "neutral",
                    "confidence": 0.0,
                    "error": "No audio data provided"
                }
            
            # Concatenate audio chunks
            combined_audio = b''.join(audio_chunks)
            
            # Process the combined audio
            result = await self.process_audio_file(combined_audio, sample_rate)
            
            return result
            
        except Exception as e:
            logger.error(f"Error processing audio stream: {e}")
            return {
                "error": str(e),
                "emotions": {},
                "dominant_emotion": "unknown",
                "confidence": 0.0
            }
    
    def get_emotion_color(self, emotion: str) -> str:
        """Get color associated with emotion for UI display"""
        emotion_colors = {
            "angry": "#ef4444",      # red
            "calm": "#10b981",       # emerald
            "disgust": "#8b5cf6",    # violet
            "fearful": "#f59e0b",    # amber
            "happy": "#f59e0b",      # yellow
            "neutral": "#6b7280",    # gray
            "sad": "#3b82f6",        # blue
            "surprised": "#ec4899"   # pink
        }
        return emotion_colors.get(emotion, "#6b7280")
    
    def get_emotion_emoji(self, emotion: str) -> str:
        """Get emoji associated with emotion"""
        emotion_emojis = {
            "angry": "😠",
            "calm": "😌",
            "disgust": "🤢",
            "fearful": "😨",
            "happy": "😊",
            "neutral": "😐",
            "sad": "😢",
            "surprised": "😲"
        }
        return emotion_emojis.get(emotion, "😐")
    
    async def cleanup(self):
        """Cleanup resources"""
        if self.executor:
            self.executor.shutdown(wait=True)

# Global instance
emotion_service = EmotionRecognitionService()

