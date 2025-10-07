import React, { useState, useEffect } from 'react';
import { Loader, RefreshCw, Image as ImageIcon } from 'lucide-react';
import imageService from '../services/imageService';

const EmotionImageDisplay = ({ emotion, context = null, style = 'photorealistic', autoGenerate = true }) => {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (autoGenerate && emotion) {
      generateImage();
    }
  }, [emotion, autoGenerate]);

  const generateImage = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await imageService.generateEmotionImage(emotion, context, style);
      
      if (result && result.image_url) {
        setImageUrl(result.image_url);
      } else {
        setError('Failed to generate image');
      }
    } catch (err) {
      console.error('Error generating emotion image:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative w-full h-64 bg-gray-800 rounded-2xl flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20 animate-pulse" />
        <div className="relative z-10 text-center">
          <Loader className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-300">Generating {emotion} image...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative w-full h-64 bg-gray-800 rounded-2xl flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            onClick={generateImage}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="relative w-full h-64 bg-gray-800 rounded-2xl flex items-center justify-center">
        <button
          onClick={generateImage}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <ImageIcon className="w-5 h-5" />
          <span>Generate {emotion} Image</span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full group">
      <div className="relative w-full h-64 bg-gray-800 rounded-2xl overflow-hidden">
        {imageUrl.startsWith('data:') ? (
          <img
            src={imageUrl}
            alt={`${emotion} emotion`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <p className="text-gray-400">Image loaded</p>
          </div>
        )}
        
        {/* Overlay with emotion label */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-semibold capitalize">{emotion}</div>
              {context && <div className="text-xs text-gray-300">{context}</div>}
            </div>
            <button
              onClick={generateImage}
              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              title="Regenerate image"
            >
              <RefreshCw className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Style badge */}
      <div className="absolute top-2 right-2 px-3 py-1 bg-black/60 backdrop-blur-sm rounded-full text-xs text-white">
        {style}
      </div>
    </div>
  );
};

export default EmotionImageDisplay;

