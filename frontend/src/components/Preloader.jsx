import React, { useState, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';

const Preloader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('loading');

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setStage('complete');
          setTimeout(onComplete, 1200);
          return 100;
        }
        return prev + 1.5;
      });
    }, 25);
    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center z-50">
      <div className="text-center space-y-8">
        <div className="relative">
          <div className={`w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-1000 ease-in-out ${
            stage === 'complete' 
              ? 'scale-110 rotate-12 translate-x-40 opacity-0' 
              : 'scale-100 translate-x-0 opacity-100'
          }`}>
            <ShoppingCart className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded-3xl opacity-20 animate-pulse"></div>
        </div>
        <div className={`space-y-3 transition-all duration-700 ${
          stage === 'complete' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            Walmart AI Assistant
          </h2>
          <p className="text-sm text-gray-500 font-medium">
            {stage === 'complete' ? 'Ready to shop!' : 'Initializing your shopping companion...'}
          </p>
        </div>
        <div className={`space-y-3 transition-all duration-700 ${
          stage === 'complete' ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}>
          <div className="w-80 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 font-mono">{Math.round(progress)}%</p>
        </div>
      </div>
    </div>
  );
};

export default Preloader;
