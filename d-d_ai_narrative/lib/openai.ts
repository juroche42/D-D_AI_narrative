import OpenAI from 'openai';

declare global {
  // eslint-disable-next-line no-var
  var __openai: OpenAI | undefined;
}

function createOpenAIClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY manquante dans les variables d'environnement");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export const openai =
  globalThis.__openai ?? (globalThis.__openai = createOpenAIClient());
