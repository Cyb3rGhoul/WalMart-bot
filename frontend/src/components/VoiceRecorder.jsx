import React, { useState, useEffect, useRef } from 'react';

const VoiceRecorder = ({ isRecording, onToggleRecording }) => {
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          transcript += event.results[i][0].transcript;
        }
      }
      if (transcript) {
        onToggleRecording(transcript.trim());
      }
    };

    recognitionRef.current.onerror = (event) => {
      setError(`Speech recognition error: ${event.error}`);
      if (isRecording) {
        onToggleRecording();
      }
    };

    recognitionRef.current.onend = () => {
      if (isRecording) {
        try {
          recognitionRef.current.start();
        } catch {
          onToggleRecording();
        }
      }
    };

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [isRecording, onToggleRecording]);

  const handleToggleRecording = async () => {
    if (!isSupported) return;
    setError('');
    if (!isRecording) {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
        onToggleRecording();
      } catch {
        setError('Microphone access denied');
      }
    } else {
      recognitionRef.current.stop();
      onToggleRecording();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggleRecording}
        disabled={!isSupported}
        className={`relative p-3 rounded-xl transition-all duration-300 transform hover:scale-105 ${
          isRecording 
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200' 
            : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-md'
        } ${!isSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isRecording ? "Stop recording" : "Start voice recording"}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
        {isRecording && (
          <div className="absolute -inset-1 bg-red-400 rounded-xl animate-ping opacity-75"></div>
        )}
      </button>
      {error && (
        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white text-xs rounded-lg px-3 py-1 whitespace-nowrap shadow-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
