export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface CompletionOptions {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface StreamingOptions extends CompletionOptions {
  onChunk: (chunk: string) => void;
  onDone?: () => void | Promise<void>;
  onError?: (error: Error) => void;
}

export interface CompletionResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface EmbeddingOptions {
  text: string;
  model?: string;
}

/**
 * Vecteur de 1536 dimensions (text-embedding-3-small).
 * Utilisé pour le RAG pgvector en US-06-02.
 */
export interface EmbeddingResult {
  vector: number[];
  model: string;
  tokens: number;
}
