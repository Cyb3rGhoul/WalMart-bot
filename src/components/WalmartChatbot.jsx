import React, { useState, useEffect, useRef } from 'react';
import { Send, Image, Paperclip, RotateCcw, Volume2, VolumeX, Sparkles, ShoppingCart, Package, DollarSign, MapPin, Star, Heart } from 'lucide-react';
import Preloader from './Preloader';
import Message from './Message';
import VoiceRecorder from './VoiceRecorder';

const WalmartChatbot = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (!isLoading && messages.length === 0) {
      setMessages([{
        id: 1,
        text: "Hello! I'm your Walmart AI Assistant. I can help you with product searches, price comparisons, order tracking, and store information. How can I assist you today?",
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
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
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: response,
        isBot: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      setIsTyping(false);
    }, Math.random() * 1000 + 1500);
  };

  const generateResponse = (message) => {
    const lower = message.toLowerCase();
    if (lower.includes('track') || lower.includes('order')) {
      return "Please provide your order number to track.";
    } else if (lower.includes('deal') || lower.includes('discount')) {
      return "Here are today's best deals!";
    } else if (lower.includes('product') || lower.includes('search')) {
      return "Tell me what product you're searching for!";
    } else if (lower.includes('store') || lower.includes('location')) {
      return "Let me find nearby stores for you!";
    } else if (lower.includes('price') || lower.includes('cost')) {
      return "I can compare prices for you.";
    } else if (lower.includes('return') || lower.includes('refund')) {
      return "Sure! What would you like to return?";
    } else {
      return "I'm here to help with anything shopping related!";
    }
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
    setMessages([{
      id: 1,
      text: "Chat cleared! How can I assist you again?",
      isBot: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
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
                  <ShoppingCart className="w-6 h-6 text-slate-700" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center">
                  Walmart AI Assistant <Sparkles className="w-4 h-4 ml-2 text-slate-300" />
                </h1>
                <p className="text-slate-200 text-sm">Your shopping companion</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20">
                {isSoundEnabled ? <Volume2 className="w-4 h-4 text-white" /> : <VolumeX className="w-4 h-4 text-white" />}
              </button>
              <button onClick={clearChat} className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20">
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="bg-gray-50/50 border-b border-gray-100 px-6 py-4">
            <div className="flex space-x-3 overflow-x-auto scrollbar-hide">
              {[
                { icon: Package, text: "Track Orders", message: "I need help tracking my order" },
                { icon: DollarSign, text: "Best Deals", message: "Show me the best deals available today" },
                { icon: ShoppingCart, text: "Find Products", message: "I want to find specific products" },
                { icon: MapPin, text: "Store Info", message: "I need store information and locations" },
                { icon: Star, text: "Reviews", message: "I want to see product reviews and ratings" },
                { icon: Heart, text: "Wishlist", message: "Help me manage my wishlist and favorites" }
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
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl flex justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <Paperclip className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-blue-800">{selectedFile.name}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedFile(null)} className="text-blue-500 text-xl p-2">×</button>
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
                  className="w-full px-4 py-3 border border-gray-200 rounded-2xl resize-none bg-white/90 min-h-[48px] max-h-32"
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
