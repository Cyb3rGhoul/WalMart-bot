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
  const speechSynthRef = useRef(null);

  // Initialize speech synthesis
  useEffect(() => {
    if ('speechSynthesis' in window) {
      speechSynthRef.current = window.speechSynthesis;
      
      // Load voices
      const loadVoices = () => {
        const voices = speechSynthRef.current.getVoices();
        console.log('Available voices:', voices);
      };
      
      speechSynthRef.current.addEventListener('voiceschanged', loadVoices);
      loadVoices();
    } else {
      console.warn('Speech synthesis not supported in this browser');
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
      voices.find(voice => voice.name.includes('Google') && voice.lang.startsWith('en') && voice.name.includes('Female')),
      voices.find(voice => voice.name.includes('Microsoft') && voice.lang.startsWith('en') && voice.name.includes('Zira')),
      voices.find(voice => voice.name.includes('Alex') && voice.lang.startsWith('en')),
      voices.find(voice => voice.name.includes('Samantha') && voice.lang.startsWith('en')),
      voices.find(voice => voice.lang.startsWith('en-US')),
      voices.find(voice => voice.lang.startsWith('en')),
      voices[0]
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
      console.error('Speech synthesis error:', event.error);
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
        text: "Hello! I'm your Walmart AI Assistant.",
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([welcomeMessage]);
      
      setTimeout(() => {
        speakText(welcomeMessage.text);
      }, 100);
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
      
      // Speak the bot's response if sound is enabled
      setTimeout(() => {
        speakText(response);
      }, 300);
    }, Math.random() * 1000 + 1500);
  };

  const generateResponse = (message) => {
    const lower = message.toLowerCase();
    if (lower.includes('track') || lower.includes('order')) {
      return "Please provide your order number to track your shipment.";
    } else if (lower.includes('deal') || lower.includes('discount')) {
      return "Here are today's best deals! You can save up to 50% on electronics and home goods.";
    } else if (lower.includes('product') || lower.includes('search')) {
      return "I'd be happy to help you find products! What are you looking for today?";
    } else if (lower.includes('store') || lower.includes('location')) {
      return "Let me help you find nearby Walmart stores with their hours and contact information.";
    } else if (lower.includes('price') || lower.includes('cost')) {
      return "I can help you compare prices and find the best deals available.";
    } else if (lower.includes('return') || lower.includes('refund')) {
      return "I can assist you with returns and refunds. What item would you like to return?";
    } else if (lower.includes('list') || lower.includes('saved')) {
      return "Here's your saved shopping list with 5 items. Would you like to add anything else?";
    } else if (lower.includes('cart') || lower.includes('checkout')) {
      return "Your cart has 3 items totaling $45.99. Ready to proceed to checkout?";
    } else if (lower.includes('payment') || lower.includes('history')) {
      return "Here's your recent payment history. Your last transaction was $23.45 on groceries.";
    } else {
      return "I'm here to help with all your shopping needs! Feel free to ask about products, orders, or store information.";
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
    // Stop any ongoing speech
    stopSpeaking();
    
    const clearMessage = {
      id: 1,
      text: "Chat cleared! How can I assist you again?",
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
                  <TbBrandWalmart className="w-full h-8 text-slate-700" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center">
                  Walmart AI Assistant <Sparkles className="w-4 h-4 ml-2 text-slate-300" />
                </h1>
                <p className="text-slate-200 text-sm">
                  Your shopping companion {isSpeaking && <span className="text-emerald-300">• Speaking...</span>}
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
                title={isSoundEnabled ? 'Sound On - Click to mute' : 'Sound Off - Click to enable'}
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

          {/* <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
              {[
                { icon: List, text: "See Your List", message: "Show me my saved list and items" },
                { icon: ShoppingCart, text: "Open Cart & Checkout", message: "Open my cart and proceed to checkout" },
                { icon: CreditCard, text: "Payment History", message: "Show me my payment history and transactions" }
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
          </div> */}

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
                  placeholder="Ask me anything..."
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