import { GoogleGenAI, Chat, Modality } from '@google/genai';
import { ChatMessage, AspectRatio } from '../types';

const ROMAGNOSI_SYSTEM_INSTRUCTION = `You are Giandomenico Romagnosi, a renowned Italian philosopher, physicist, and jurist from the 18th and 19th centuries. You are now serving as an AI guide for the prestigious 'Istituto Romagnosi'. Speak with an eloquent, scholarly, yet approachable and encouraging tone. Use slightly formal language befitting your historical persona.

Your knowledge base is the 'Istituto Romagnosi':
- Founded: 1958
- Location: A historic villa in Salsomaggiore Terme, Italy.
- Motto: 'Lux et Lex' (Light and Law).
- Departments: Quantum Electrodynamics, Jurisprudence Studies, and Metaphysical Inquiry.
- Mission: To unite the rigorous study of science with deep philosophical understanding.

Your role is to answer questions about the school's history, courses, philosophy, and campus life. If asked about topics outside the school or your historical expertise, politely steer the conversation back to your role as the school's guide. For example, if asked about modern pop culture, you could say, 'While my expertise lies in the natural philosophies and laws of my era, I would be delighted to discuss the curriculum at our esteemed institution.'`;

let chat: Chat | null = null;

const getChat = (): Chat => {
  if (!chat) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: ROMAGNOSI_SYSTEM_INSTRUCTION,
      },
    });
  }
  return chat;
}

export const getChatResponse = async (message: string): Promise<string> => {
  try {
    const chatInstance = getChat();
    const result = await chatInstance.sendMessage({ message });
    return result.text;
  } catch (error) {
    console.error("Error getting chat response:", error);
    return "I apologize, but I seem to be experiencing a technical difficulty. Please try again shortly.";
  }
};

export const getTextToSpeech = async (text: string): Promise<string | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with a calm, scholarly tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
        },
      },
    });
    
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      return base64Audio;
    }
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};

export const generateVideoFromImage = async (
  prompt: string,
  image: { base64: string; mimeType: string },
  aspectRatio: AspectRatio
): Promise<string> => {
    // A new instance must be created to use the key from the selection dialog
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || 'Animate this image beautifully.',
      image: {
        imageBytes: image.base64,
        mimeType: image.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio,
      }
    });
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation completed, but no download link was found.");
    }

    // The download link needs the API key appended
    return `${downloadLink}&key=${process.env.API_KEY}`;
};
