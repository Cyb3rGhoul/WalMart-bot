import React, { useState, useEffect } from 'react';
import { Bot, User, Paperclip } from 'lucide-react';

const Message = ({ message, isBot, timestamp, isTyping = false, file }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  if (isTyping) {
    return (
      <div className="flex items-start space-x-3 animate-fade-in">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
        isBot 
          ? 'bg-gradient-to-br from-blue-500 to-blue-600' 
          : 'bg-gradient-to-br from-gray-600 to-gray-700'
      }`}>
        {isBot ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
      </div>
      <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl ${isBot ? 'bg-white border border-gray-100 rounded-2xl rounded-tl-md' : 'bg-gradient-to-br from-gray-700 to-gray-800 rounded-2xl rounded-tr-md'} px-4 py-3 shadow-sm`}>
        {file && (
          <div className="mb-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
            <div className="flex items-center space-x-2">
              <Paperclip className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">{file.name}</span>
            </div>
          </div>
        )}
        <p className={`text-sm leading-relaxed ${isBot ? 'text-gray-800' : 'text-white'}`}>
          {message}
        </p>
        {timestamp && (
          <p className={`text-xs mt-2 ${isBot ? 'text-gray-400' : 'text-gray-300'}`}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
};

export default Message;
