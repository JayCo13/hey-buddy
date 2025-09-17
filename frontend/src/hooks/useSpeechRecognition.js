import { useState, useRef, useCallback, useEffect } from 'react';

const useSpeechRecognition = (options = {}) => {
  const { 
    continuous = true, 
    interimResults = true, 
    lang = "en-US", 
    onResult, 
    onError, 
    onStart, 
    onEnd 
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef("");
  const shouldRestartRef = useRef(false);
  const baseContinuousRef = useRef(continuous);
  const isStartingRef = useRef(false);

  // Keep latest callbacks in refs
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);
  const onStartRef = useRef(onStart);
  const onEndRef = useRef(onEnd);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);
  useEffect(() => {
    onStartRef.current = onStart;
  }, [onStart]);
  useEffect(() => {
    onEndRef.current = onEnd;
  }, [onEnd]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      console.info("[Speech] init", {
        userAgent: navigator.userAgent,
        isSecureContext: window.isSecureContext,
        protocol: window.location.protocol,
        displayMode: (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ? 'standalone' : 'browser',
      });
    } catch {}

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      console.info("[Speech] API available. Creating recognition", { continuous, interimResults, lang });

      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        finalTranscriptRef.current = "";
        console.info("[Speech] onstart");
        onStartRef.current?.();
      };

      recognition.onresult = (event) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }

        if (finalTranscript) {
          finalTranscriptRef.current += finalTranscript;
          setTranscript(finalTranscriptRef.current);
          onResultRef.current?.(finalTranscriptRef.current, true);
        } else if (interimTranscript) {
          setTranscript(finalTranscriptRef.current + interimTranscript);
          onResultRef.current?.(finalTranscriptRef.current + interimTranscript, false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        console.info("[Speech] onend");
        // Auto-restart only if requested and in continuous mode
        try {
          if (shouldRestartRef.current && recognitionRef.current?.continuous) {
            setTimeout(() => {
              try {
                recognitionRef.current?.start();
              } catch (e) {
                console.warn("[Speech] restart failed", e);
              }
            }, 50);
          }
        } catch {}
        onEndRef.current?.();
      };

      recognition.onerror = (event) => {
        console.error("[Speech] onerror", {
          error: event?.error,
          message: event?.message,
          detail: event,
        });
        setIsListening(false);
        onErrorRef.current?.(event.error);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      console.warn("[Speech] Web Speech API not available. window.SpeechRecognition and window.webkitSpeechRecognition are undefined");
      try {
        // Permission probe (best effort)
        const navAny = navigator;
        if (navAny?.permissions?.query) {
          navAny.permissions
            .query({ name: "microphone" })
            .then((res) => console.info("[Speech] permissions.query(microphone)", { state: res?.state }))
            .catch((e) => console.info("[Speech] permissions.query not available or failed", e));
        }
      } catch {}
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuous, interimResults, lang]);

  const startListening = useCallback((opts) => {
    if (!recognitionRef.current || !isSupported) {
      onError?.("Speech recognition is not supported");
      return;
    }

    if (!isListening && !isStartingRef.current) {
      try {
        // Apply continuous override for this session if provided
        if (typeof opts?.continuousOverride === "boolean") {
          recognitionRef.current.continuous = opts.continuousOverride;
        } else {
          recognitionRef.current.continuous = baseContinuousRef.current;
        }
        shouldRestartRef.current = true;
        isStartingRef.current = true;
        recognitionRef.current.start();
        setTimeout(() => {
          isStartingRef.current = false;
        }, 200);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        if (error?.name === "InvalidStateError") {
          try {
            recognitionRef.current.abort();
          } catch {}
          setTimeout(() => {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error("Retry start failed:", e);
              onErrorRef.current?.("Failed to start speech recognition");
            }
          }, 150);
        } else {
          onErrorRef.current?.("Failed to start speech recognition");
        }
      }
    }
  }, [isListening, isSupported, onError]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      shouldRestartRef.current = false;
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
    finalTranscriptRef.current = "";
  }, []);

  return {
    isListening,
    transcript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
};

export default useSpeechRecognition;
