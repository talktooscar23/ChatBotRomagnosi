export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export type AspectRatio = '16:9' | '9:16';
