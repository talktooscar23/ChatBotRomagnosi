import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getChatResponse, getTextToSpeech } from '../services/geminiService';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { ChatMessage } from '../types';
import { RomagnosiIcon, SendIcon, SpeakerOnIcon, SpeakerOffIcon, UserIcon, LoadingSpinner } from './icons/Icons';

const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Greetings. I am Giandomenico Romagnosi, your guide to the esteemed Istituto Romagnosi. How may I be of service to you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const { playAudio, isPlaying } = useAudioPlayer();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await getChatResponse(input);
      const modelMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, modelMessage]);

      if (isVoiceEnabled) {
        const audioBase64 = await getTextToSpeech(responseText);
        if (audioBase64) {
          playAudio(audioBase64);
        }
      }
    } catch (error) {
      console.error("Failed to get response:", error);
      const errorMessage: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: "My apologies, I am currently unable to process your request." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, isVoiceEnabled, playAudio]);

  return (
    <div className="flex flex-col h-[75vh]">
      <div className="flex-grow p-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
              {msg.role === 'model' && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><RomagnosiIcon className="w-8 h-8 text-blue-600" /></div>}
              <div className={`max-w-md p-4 rounded-2xl ${msg.role === 'model' ? 'bg-gray-100 dark:bg-gray-700 rounded-tl-none' : 'bg-blue-500 text-white rounded-br-none'}`}>
                <p className="text-sm">{msg.text}</p>
              </div>
              {msg.role === 'user' && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center"><UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" /></div>}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><RomagnosiIcon className="w-8 h-8 text-blue-600" /></div>
              <div className="max-w-md p-4 rounded-2xl bg-gray-100 dark:bg-gray-700 rounded-tl-none flex items-center">
                <LoadingSpinner className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
            className={`p-2 rounded-full transition-colors ${isVoiceEnabled ? 'text-blue-500 hover:bg-blue-100 dark:hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            aria-label={isVoiceEnabled ? 'Disable voice' : 'Enable voice'}
          >
            {isVoiceEnabled ? <SpeakerOnIcon className="w-6 h-6" /> : <SpeakerOffIcon className="w-6 h-6" />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the Istituto..."
            className="flex-grow px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2 bg-blue-500 text-white rounded-full disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            aria-label="Send message"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
