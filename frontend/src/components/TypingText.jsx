import React, { useState, useEffect } from 'react';

const TypingText = ({ 
  text, 
  speed = 30, 
  onComplete,
  className = "",
  showCursor = true
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Reset when text changes
  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [currentIndex, text, speed, onComplete, isComplete]);

  return (
    <div className={`font-light leading-relaxed ${className}`}>
      <span>{displayedText}</span>
      {!isComplete && showCursor && (
        <span className="inline-block w-0.5 h-5 bg-blue-400 ml-1 animate-pulse"></span>
      )}
    </div>
  );
};

export default TypingText;

