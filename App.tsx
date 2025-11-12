

import React, { useState, useEffect } from 'react';
import Chatbot from './components/Chatbot';
import VeoAnimator from './components/VeoAnimator';
import Header from './components/Header';
import { VeoIcon, ChatIcon, KeyIcon } from './components/icons/Icons';

type Tab = 'chat' | 'veo';

// Fix for global type conflict by inlining the type definition to avoid naming collisions.
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [hasVeoApiKey, setHasVeoApiKey] = useState<boolean>(false);
  const [isKeyChecked, setIsKeyChecked] = useState<boolean>(false);

  useEffect(() => {
    const checkApiKey = async () => {
      if (window.aistudio) {
        try {
          const hasKey = await window.aistudio.hasSelectedApiKey();
          setHasVeoApiKey(hasKey);
        } catch (error) {
          console.error("Error checking for API key:", error);
          setHasVeoApiKey(false);
        }
      }
      setIsKeyChecked(true);
    };

    checkApiKey();
  }, []);
  
  const handleSelectKey = async () => {
    if (window.aistudio) {
      try {
        await window.aistudio.openSelectKey();
        // Assume key selection is successful and optimistically update UI
        setHasVeoApiKey(true);
      } catch (error) {
        console.error("Error opening API key selection:", error);
      }
    }
  };

  const renderContent = () => {
    if (activeTab === 'chat') {
      return <Chatbot />;
    }
    if (activeTab === 'veo') {
      if (!isKeyChecked) {
        return (
          <div className="flex flex-col items-center justify-center h-full pt-20">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">Checking API key status...</p>
          </div>
        );
      }
      if (!hasVeoApiKey) {
        return (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <KeyIcon className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">API Key Required for Veo</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
              To generate videos with Veo, you must select an API key. This is a mandatory step to enable video generation features.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">For more information on billing, please visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">ai.google.dev/gemini-api/docs/billing</a>.</p>
            <button
              onClick={handleSelectKey}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-transform transform hover:scale-105"
            >
              Select API Key
            </button>
          </div>
        );
      }
      return <VeoAnimator onApiKeyError={() => setHasVeoApiKey(false)} />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center mb-8">
          <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-lg space-x-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-300 ${activeTab === 'chat' ? 'bg-white dark:bg-gray-800 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            >
              <ChatIcon className="w-5 h-5 mr-2" />
              Romagnosi Chat
            </button>
            <button
              onClick={() => setActiveTab('veo')}
              className={`flex items-center justify-center px-4 py-2 rounded-md transition-colors duration-300 ${activeTab === 'veo' ? 'bg-white dark:bg-gray-800 shadow text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
            >
              <VeoIcon className="w-5 h-5 mr-2" />
              Veo Animator
            </button>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden min-h-[70vh]">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;