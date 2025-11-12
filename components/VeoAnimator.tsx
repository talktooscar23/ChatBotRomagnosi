import React, { useState } from 'react';
import { generateVideoFromImage } from '../services/geminiService';
import { AspectRatio } from '../types';
import { UploadIcon, VeoIcon, LoadingSpinner } from './icons/Icons';

interface VeoAnimatorProps {
  onApiKeyError: () => void;
}

// Helper to convert file to base64
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
});

const VeoAnimator: React.FC<VeoAnimatorProps> = ({ onApiKeyError }) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setVideoUrl(null);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!imageFile) {
      setError("Please upload an image first.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setVideoUrl(null);

    const loadingMessages = [
      "Initializing Veo generation...",
      "Sending image to the model...",
      "Generating video frames (this may take a few minutes)...",
      "Almost there, finalizing the video...",
    ];

    let messageIndex = 0;
    setLoadingMessage(loadingMessages[messageIndex]);
    const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % loadingMessages.length;
        if (messageIndex === 0) messageIndex = 2; // stick to generating message
        setLoadingMessage(loadingMessages[messageIndex]);
    }, 7000);

    try {
      const imageBase64 = await toBase64(imageFile);
      const imageDetails = { base64: imageBase64, mimeType: imageFile.type };
      const videoUri = await generateVideoFromImage(prompt, imageDetails, aspectRatio);
      
      const response = await fetch(videoUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch video data. Status: ${response.status}`);
      }
      const videoBlob = await response.blob();
      const objectUrl = URL.createObjectURL(videoBlob);
      setVideoUrl(objectUrl);

    } catch (err: any) {
      console.error(err);
      if (err.message && err.message.includes("Requested entity was not found")) {
        setError("API Key error. Please re-select your API key.");
        onApiKeyError();
      } else {
        setError("An error occurred during video generation. Please try again.");
      }
    } finally {
      clearInterval(messageInterval);
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 bg-opacity-75 flex flex-col items-center justify-center z-50">
          <LoadingSpinner className="w-16 h-16 text-blue-500" />
          <p className="mt-4 text-lg text-white font-semibold">{loadingMessage}</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Upload and Controls */}
        <div className="space-y-6">
          <div>
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white dark:bg-gray-800 rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Animation Prompt (Optional)
            </label>
            <textarea
              id="prompt"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., A gentle breeze rustles the leaves"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Aspect Ratio</label>
            <div className="mt-2 flex space-x-4">
              {(['16:9', '9:16'] as AspectRatio[]).map(ratio => (
                <label key={ratio} className="flex items-center">
                  <input
                    type="radio"
                    name="aspect-ratio"
                    value={ratio}
                    checked={aspectRatio === ratio}
                    onChange={() => setAspectRatio(ratio)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{ratio} ({ratio === '16:9' ? 'Landscape' : 'Portrait'})</span>
                </label>
              ))}
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!imageFile || isLoading}
            className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <VeoIcon className="w-5 h-5 mr-2" />
            Generate Video
          </button>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>

        {/* Right Side: Preview and Result */}
        <div className="flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 rounded-lg p-4 min-h-[400px]">
          {videoUrl ? (
            <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-md shadow-lg" />
          ) : imagePreview ? (
            <img src={imagePreview} alt="Preview" className="max-w-full max-h-full rounded-md shadow-lg" />
          ) : (
            <div className="text-center text-gray-500">
              <p>Image preview and generated video will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VeoAnimator;
