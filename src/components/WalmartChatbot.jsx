import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Paperclip, RotateCcw, Volume2, VolumeX, Sparkles, ShoppingCart, List, CreditCard } from 'lucide-react';
import Preloader from './Preloader';
import Message from './Message';
import VoiceRecorder from './VoiceRecorder';
import { TbBrandWalmart } from 'react-icons/tb';

const WalmartChatbot = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const currentAudioRef = useRef(null);

  
  const ELEVENLABS_API_KEY = import.meta.env.REACT_APP_ELEVENLABS_API_KEY;
  const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';
  
  const getInitialGreeting = () => {
    const hour = new Date().getHours();
    let timeGreeting = '';
    
    if (hour < 12) timeGreeting = 'Good morning';
    else if (hour < 17) timeGreeting = 'Good afternoon';
    else timeGreeting = 'Good evening';

    return `${timeGreeting}! Welcome to Walmart AI. What can I help you with?`;
  };

  // Enhanced text-to-speech using ElevenLabs
  const speakWithElevenLabs = async (text) => {
    if (!isSoundEnabled || !text.trim()) return;
    
    // Stop any current audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }

    setIsSpeaking(true);

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      });

      if (!response.ok) {
        throw new Error('ElevenLabs API request failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        console.error('Audio playback error');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        // Fallback to browser TTS
        fallbackToSystemTTS(text);
      };

      await audio.play();
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      setIsSpeaking(false);
      // Fallback to system TTS
      fallbackToSystemTTS(text);
    }
  };

  // Fallback to system TTS if ElevenLabs fails
  const fallbackToSystemTTS = (text) => {
    if (!('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    // Select best available voice
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Google') && voice.lang.startsWith('en')
    ) || voices.find(voice => 
      voice.lang.startsWith('en-US')
    ) || voices.find(voice => 
      voice.lang.startsWith('en')
    );

    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 0.8;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking function
  const stopSpeaking = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  useEffect(() => {
    if (!isLoading && messages.length === 0) {
      const welcomeMessage = {
        id: 1,
        text: getInitialGreeting(),
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMessage]);
      
      // Speak welcome message after a short delay
      setTimeout(() => {
        speakWithElevenLabs(welcomeMessage.text);
      }, 800);
    }
  }, [isLoading, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputValue]);

  useEffect(() => {
    return () => {
      if (selectedFile && selectedFile.type.startsWith('image/')) {
        const url = getFilePreview(selectedFile);
        if (url) URL.revokeObjectURL(url);
      }
      // Cleanup audio on unmount
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
    };
  }, [selectedFile]);

  const sendMessage = (messageText) => {
    if (!messageText.trim() && !selectedFile) return;

    const newMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      file: selectedFile
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setSelectedFile(null);
    setIsTyping(true);

    setTimeout(() => {
      let response = generateResponse(messageText);
      const botMessage = {
        id: Date.now(),
        text: response,
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
      
      // Speak the bot's response with ElevenLabs
      setTimeout(() => {
        speakWithElevenLabs(response);
      }, 400);
    }, Math.random() * 1000 + 1500);
  };

  const generateResponse = (message) => {
    const lower = message.toLowerCase();
    if (lower.includes('track') || lower.includes('order')) {
      return "I'd be happy to help you track your order! Please provide your order number, and I'll get you the latest shipping information and estimated delivery date.";
    } else if (lower.includes('deal') || lower.includes('discount') || lower.includes('sale')) {
      return "Great news! We have amazing deals today. I can show you up to 50% off on electronics, 30% off home goods, and special rollback prices on groceries. Which category interests you most?";
    } else if (lower.includes('product') || lower.includes('search') || lower.includes('find')) {
      return "I'd love to help you find the perfect product! What are you shopping for today? I can search our entire inventory, compare prices, and even suggest similar items you might like.";
    } else if (lower.includes('store') || lower.includes('location') || lower.includes('hours')) {
      return "Let me help you find your nearest Walmart store. I can provide store hours, contact information, available services, and even check if specific items are in stock at your local store.";
    } else if (lower.includes('price') || lower.includes('cost') || lower.includes('compare')) {
      return "I'm excellent at price comparisons! I can help you find the best deals, compare similar products, and even alert you to price drops on items you're interested in.";
    } else if (lower.includes('return') || lower.includes('refund') || lower.includes('exchange')) {
      return "No problem with returns! I can guide you through our easy return process. What item would you like to return? I'll help you check the return policy and find the best return method for you.";
    } else if (lower.includes('list') || lower.includes('saved') || lower.includes('favorite')) {
      return "Here's your saved shopping list with 5 items including organic bananas, whole grain bread, and your favorite coffee. Would you like to add more items, remove something, or are you ready to add these to your cart?";
    } else if (lower.includes('cart') || lower.includes('checkout') || lower.includes('buy')) {
      return "Perfect! Your cart currently has 3 items totaling $45.99. I can help you apply any available coupons, choose delivery or pickup options, and guide you through a quick checkout. Ready to proceed?";
    } else if (lower.includes('payment') || lower.includes('history') || lower.includes('account')) {
      return "Here's your recent account activity. Your last purchase was $23.45 for groceries on June 15th. I can help you view detailed receipts, track rewards, or update your payment methods.";
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      return "Hello there! It's wonderful to meet you. I'm your dedicated Walmart shopping assistant, and I'm here to make your experience fantastic. How can I help you save money and time today?";
    } else if (lower.includes('thank') || lower.includes('thanks')) {
      return "You're very welcome! I'm always happy to help. Is there anything else I can assist you with today? I'm here whenever you need support with your shopping.";
    } else {
      return "I'm here to make your Walmart shopping experience amazing! Whether you need help finding products, checking prices, tracking orders, or discovering great deals, just let me know. What would you like to explore today?";
    }
  };

  const getFilePreview = (file) => {
    if (file && file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const handleSendMessage = () => sendMessage(inputValue);
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleVoiceRecording = (transcription) => {
    if (transcription) {
      setInputValue(prev => prev + (prev ? ' ' : '') + transcription);
      setIsRecording(false);
    } else {
      setIsRecording(!isRecording);
    }
  };

  const handleQuickAction = (message) => sendMessage(message);
  
  const clearChat = () => {
    stopSpeaking();
    
    const clearMessage = {
      id: 1,
      text: "Chat cleared! I'm ready to help you with fresh shopping assistance. What can I do for you today?",
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([clearMessage]);
    
    setTimeout(() => {
      speakWithElevenLabs(clearMessage.text);
    }, 400);
  };

  const toggleSound = () => {
    const newSoundState = !isSoundEnabled;
    setIsSoundEnabled(newSoundState);
    
    if (!newSoundState) {
      stopSpeaking();
    } else {
      // Welcome back message
      setTimeout(() => {
        speakWithElevenLabs("Voice assistance is now enabled. I'm ready to speak my responses to you!");
      }, 300);
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
                  <TbBrandWalmart className="w-full h-8 text-slate-700" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center">
                  Walmart AI Assistant <Sparkles className="w-4 h-4 ml-2 text-slate-300" />
                </h1>
                <p className="text-slate-200 text-sm flex items-center">
                  Your personal shopping companion
                  {isSpeaking && (
                    <span className="ml-2 flex items-center text-emerald-300">
                      <span className="animate-pulse">🎵</span>
                      <span className="ml-1">Speaking...</span>
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleSound} 
                className={`p-2.5 rounded-xl transition-all duration-200 ${
                  isSoundEnabled 
                    ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30' 
                    : 'bg-white/10 hover:bg-white/20'
                } ${isSpeaking ? 'animate-pulse' : ''}`}
                title={isSoundEnabled ? 'AI Voice Enabled - Click to mute' : 'AI Voice Disabled - Click to enable'}
              >
                {isSoundEnabled ? 
                  <Volume2 className="w-4 h-4 text-emerald-300" /> : 
                  <VolumeX className="w-4 h-4 text-white" />
                }
              </button>
              <button onClick={clearChat} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20">
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
              {[
                { icon: List, text: "See Your List", message: "Show me my saved shopping list and favorite items" },
                { icon: ShoppingCart, text: "Open Cart & Checkout", message: "Open my cart and help me proceed to checkout" },
                { icon: CreditCard, text: "Account & Orders", message: "Show me my account details and recent order history" }
              ].map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action.message)}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 whitespace-nowrap text-sm font-medium text-gray-700 hover:text-slate-800 hover:shadow-sm transform hover:scale-105"
                >
                  <action.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{action.text}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-6">
              {messages.map((msg) => (
                <Message key={msg.id} message={msg.text} isBot={msg.isBot} timestamp={msg.timestamp} file={msg.file} />
              ))}
              {isTyping && <Message message="" isBot={true} timestamp="" isTyping={true} />}
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
                        <span className="text-sm font-medium text-blue-800">{selectedFile.name}</span>
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
                  placeholder="Ask me anything about shopping, deals, orders..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl resize-none bg-white/90 min-h-[48px] max-h-32 scrollbar-hide overflow-y-hidden"
                  rows="1"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} className="p-3 bg-white border border-gray-200 rounded-xl">
                  <Image className="w-4 h-4 text-gray-600" />
                </button>
                <VoiceRecorder isRecording={isRecording} onToggleRecording={handleVoiceRecording} />
              </div>
              <button onClick={handleSendMessage} disabled={!inputValue.trim() && !selectedFile} className="p-3 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WalmartChatbot;