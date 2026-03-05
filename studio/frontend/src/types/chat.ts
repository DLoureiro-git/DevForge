// Chat Types

export type QuestionType = 'open' | 'choice';

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  opts?: string[];
  ph?: string;
}

export interface ChatMessage {
  id: string;
  role: 'agent' | 'user';
  text: string;
  opts?: string[] | null;
}

export type Answers = Record<string, string>;
