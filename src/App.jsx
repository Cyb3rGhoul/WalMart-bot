import React, { useState } from 'react';
import Preloader from './components/Preloader';
import WalmartChatbot from './components/WalmartChatbot';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  return (
    <>
      <WalmartChatbot />
    </>
  );
};

export default App;
