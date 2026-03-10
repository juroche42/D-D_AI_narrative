import 'server-only';
import OpenAI from 'openai';

declare global {
  // eslint-disable-next-line no-var
  var __openai: OpenAI | undefined;
}

export function getOpenAI(): OpenAI {
  if (globalThis.__openai) return globalThis.__openai;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY manquante dans les variables d'environnement");
  }
  globalThis.__openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return globalThis.__openai;
}
