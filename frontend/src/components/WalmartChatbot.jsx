import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Image,
  Paperclip,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  ShoppingCart,
  List,
  CreditCard,
  Axis3DIcon,
  AlertCircle,
} from "lucide-react";
import Preloader from "./Preloader";
import Message from "./Message";
import VoiceRecorder from "./VoiceRecorder";
import ApiService from "../services/apiService.js";
const WALMART_LOGO_URL = "https://www.freeiconspng.com/uploads/walmart-logo-png-6.png";

// Backend API configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:5000";

const WalmartChatbot = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("checking"); // 'checking', 'connected', 'disconnected'
  const [sessionId, setSessionId] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const speechSynthRef = useRef(null);

  // Check backend connection and start session on component mount
  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const result = await ApiService.checkConnection();
      setConnectionStatus(result.connected ? "connected" : "disconnected");
      if (result.connected) {
        startNewSession();
      }
    } catch (error) {
      console.error("Backend connection failed:", error);
      setConnectionStatus("disconnected");
    }
  };

  const startNewSession = async () => {
    try {
      const response = await ApiService.startSession();
      if (response.success) {
        setSessionId(response.session_id);
        console.log("New session started:", response.session_id);
      }
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  };

  // Initialize speech synthesis
  useEffect(() => {
    if ("speechSynthesis" in window) {
      speechSynthRef.current = window.speechSynthesis;

      // Load voices
      const loadVoices = () => {
        const voices = speechSynthRef.current.getVoices();
        console.log("Available voices:", voices);
      };

      speechSynthRef.current.addEventListener("voiceschanged", loadVoices);
      loadVoices();
    } else {
      console.warn("Speech synthesis not supported in this browser");
    }

    return () => {
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  // Function to speak text
  const speakText = (text) => {
    if (!isSoundEnabled || !speechSynthRef.current || !text.trim()) return;

    // Cancel any ongoing speech
    speechSynthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Get available voices
    const voices = speechSynthRef.current.getVoices();

    // Try to find a good quality English voice
    const preferredVoices = [
      voices.find(
        (voice) =>
          voice.name.includes("Google") &&
          voice.lang.startsWith("en") &&
          voice.name.includes("Female")
      ),
      voices.find(
        (voice) =>
          voice.name.includes("Microsoft") &&
          voice.lang.startsWith("en") &&
          voice.name.includes("Zira")
      ),
      voices.find(
        (voice) => voice.name.includes("Alex") && voice.lang.startsWith("en")
      ),
      voices.find(
        (voice) =>
          voice.name.includes("Samantha") && voice.lang.startsWith("en")
      ),
      voices.find((voice) => voice.lang.startsWith("en-US")),
      voices.find((voice) => voice.lang.startsWith("en")),
      voices[0],
    ].filter(Boolean);

    if (preferredVoices.length > 0) {
      utterance.voice = preferredVoices[0];
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error("Speech synthesis error:", event.error);
      setIsSpeaking(false);
    };

    speechSynthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthRef.current) {
      speechSynthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    if (!isLoading && messages.length === 0) {
      const welcomeMessage = {
        id: 1,
        text:
          connectionStatus === "connected"
            ? "Hello! I'm your Walmart AI Assistant. How can I help you today?"
            : "Hello! I'm your Walmart AI Assistant. Note: Backend connection is currently unavailable.",
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([welcomeMessage]);

      setTimeout(() => {
        speakText(welcomeMessage.text);
      }, 100);
    }
  }, [isLoading, messages.length, connectionStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  useEffect(() => {
    return () => {
      if (selectedFile && selectedFile.type.startsWith("image/")) {
        const url = getFilePreview(selectedFile);
        if (url) URL.revokeObjectURL(url);
      }
    };
  }, [selectedFile]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim() && !selectedFile) return;

    const newMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      file: selectedFile,
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setSelectedFile(null);
    setIsTyping(true);

    try {
      let userPrompt = messageText;
      if (selectedFile) {
        setIsUploading(true);
        // Step 1: Upload file
        const uploadRes = await ApiService.uploadDocument(selectedFile);
        setIsUploading(false);
        if (uploadRes.success && uploadRes.documentUrl) {
          // Step 2: Extract text from the document (PDF or image)
          const ext = selectedFile.name.split(".").pop().toUpperCase();
          let docText = "";
          if (["JPG", "JPEG", "PNG", "PDF"].includes(ext)) {
            const ocrRes = await ApiService.extractTextFromDocument(
              uploadRes.documentUrl
            );
            if (ocrRes.success) {
              docText = ocrRes.text;
            }
          }
          // Compose the user prompt for /respond
          userPrompt = `Document text: ${docText}\n${messageText}`;
        } else {
          userPrompt = "File upload failed.";
        }
      }
      // Always call /respond with session_id
      const result = await ApiService.generateResponse(userPrompt, sessionId);
      let displayText = "";
      if (result.success) {
        displayText = result.message;
      } else {
        // If session error, start new session and retry
        if (result.message && result.message.includes("session")) {
          await startNewSession();
          const retryResult = await ApiService.generateResponse(
            userPrompt,
            sessionId
          );
          displayText = retryResult.success
            ? retryResult.message
            : "Error processing your request.";
        } else {
          displayText = result.message || "Error processing your request.";
        }
      }
      const botMessage = {
        id: Date.now(),
        text: displayText,
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, botMessage]);
      setTimeout(() => {
        speakText(displayText);
      }, 300);
    } catch (error) {
      console.error("Error processing message:", error);
      const errorMessage = {
        id: Date.now(),
        text: "I'm sorry, I encountered an error processing your request. Please try again.",
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getFilePreview = (file) => {
    if (file && file.type.startsWith("image/")) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const handleSendMessage = () => sendMessage(inputValue);
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
      ];
      if (!allowedTypes.includes(file.type)) {
        alert("Please select a valid file type: JPEG, PNG, or PDF");
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size must be less than 10MB");
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleVoiceRecording = (transcription) => {
    if (transcription) {
      setInputValue((prev) => prev + (prev ? " " : "") + transcription);
      setIsRecording(false);
    } else {
      setIsRecording(!isRecording);
    }
  };

  const clearChat = () => {
    // Stop any ongoing speech
    stopSpeaking();

    const clearMessage = {
      id: 1,
      text: "Chat cleared! How can I assist you again?",
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([clearMessage]);

    // Speak clear message
    setTimeout(() => {
      speakText(clearMessage.text);
    }, 300);
  };

  const toggleSound = () => {
    const newSoundState = !isSoundEnabled;
    setIsSoundEnabled(newSoundState);

    // Stop speaking if sound is disabled
    if (!newSoundState) {
      stopSpeaking();
    }
  };

  if (isLoading) return <Preloader onComplete={() => setIsLoading(false)} />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto h-[calc(100vh-2rem)]">
        <div className="h-full bg-white/80 backdrop-blur-sm shadow-xl rounded-3xl border border-white/20 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-6 py-5 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                  <img
                    src={WALMART_LOGO_URL}
                    alt="Walmart"
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                </div>
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm ${connectionStatus === "connected"
                      ? "bg-emerald-500"
                      : connectionStatus === "disconnected"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                    }`}
                ></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center">
                  Walmart AI Assistant{" "}
                  <Sparkles className="w-4 h-4 ml-2 text-slate-300" />
                </h1>
                <p className="text-slate-200 text-sm">
                  Your shopping companion{" "}
                  {isSpeaking && (
                    <span className="text-emerald-300">• Speaking...</span>
                  )}
                  {connectionStatus === "disconnected" && (
                    <span className="text-red-300"> • Offline</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleSound}
                className={`p-2.5 rounded-xl transition-all duration-200 ${isSoundEnabled
                    ? "bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30"
                    : "bg-white/10 hover:bg-white/20"
                  } ${isSpeaking ? "animate-pulse" : ""}`}
                title={
                  isSoundEnabled
                    ? "Sound On - Click to mute"
                    : "Sound Off - Click to enable"
                }
              >
                {isSoundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-300" />
                ) : (
                  <VolumeX className="w-4 h-4 text-white" />
                )}
              </button>
              <button
                onClick={clearChat}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20"
              >
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Connection Status Alert */}
          {connectionStatus === "disconnected" && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
                <div>
                  <p className="text-sm text-red-700">
                    <strong>Connection Issue:</strong> Unable to connect to the
                    AI service. Some features may be limited.
                  </p>
                  <button
                    onClick={checkBackendConnection}
                    className="text-sm text-red-600 hover:text-red-800 underline mt-1"
                  >
                    Retry connection
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {messages.map((msg) => (
                <Message
                  key={msg.id}
                  message={msg.text}
                  isBot={msg.isBot}
                  timestamp={msg.timestamp}
                  file={msg.file}
                  sessionId={sessionId}
                  setMessages={setMessages}
                />
              ))}
              {isTyping && (
                <Message
                  message=""
                  isBot={true}
                  timestamp=""
                  isTyping={true}
                  sessionId={sessionId}
                  setMessages={setMessages}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm border-t border-gray-100 p-6">
            {selectedFile && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex justify-between items-start">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-blue-500 rounded-lg">
                      <Paperclip className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-blue-800">
                          {selectedFile.name}
                        </span>
                        <span className="text-xs text-blue-600">
                          ({(selectedFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      {getFilePreview(selectedFile) && (
                        <div className="mt-2">
                          <img
                            src={getFilePreview(selectedFile)}
                            alt="Preview"
                            className="max-w-32 max-h-32 rounded-lg border border-blue-200 object-cover shadow-sm"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-blue-500 hover:text-blue-700 text-xl p-2 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    connectionStatus === "disconnected"
                      ? "Backend unavailable..."
                      : "Ask me anything..."
                  }
                  disabled={connectionStatus === "disconnected"}
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl resize-none bg-white/90 min-h-[48px] max-h-32 scrollbar-hide overflow-y-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  rows="1"
                />
              </div>
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".jpg,.jpeg,.png"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current.click()}
                  disabled={connectionStatus === "connected"}
                  className="p-3 bg-white border border-gray-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Upload image or PDF"
                >
                  <Image className="w-4 h-4 text-gray-600" />
                </button>
                <VoiceRecorder
                  isRecording={isRecording}
                  onToggleRecording={handleVoiceRecording}
                />
              </div>
              <button
                onClick={handleSendMessage}
                disabled={
                  (!inputValue.trim() && !selectedFile) ||
                  connectionStatus === "disconnected" ||
                  isUploading
                }
                className="p-3 mb-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalmartChatbot;
