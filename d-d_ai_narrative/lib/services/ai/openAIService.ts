import 'server-only';
import { getOpenAI } from '@/lib/openai';
import type {
  CompletionOptions, CompletionResult,
  StreamingOptions, EmbeddingOptions, EmbeddingResult,
} from './types';

const DEFAULT_CHAT_MODEL  = process.env.OPENAI_MODEL_CHAT  ?? 'gpt-4o-mini';
const DEFAULT_EMBED_MODEL = process.env.OPENAI_MODEL_EMBED ?? 'text-embedding-3-small';
const MAX_RETRIES         = parseInt(process.env.OPENAI_MAX_RETRIES ?? '3', 10)     || 3;
const TIMEOUT_MS          = parseInt(process.env.OPENAI_TIMEOUT_MS  ?? '30000', 10) || 30000;

// ─── Retry helpers ─────────────────────────────────────────────────────────────

/**
 * Retry sur : 429 (rate limit), 5xx (server errors), réseau.
 * PAS de retry sur : 400, 401, 404 (erreurs client non corrigibles).
 */
function isRetriable(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('429') || msg.includes('rate limit')) return true;
    if (msg.includes('500') || msg.includes('502') || msg.includes('503')) return true;
    if (msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('fetch')) return true;
  }
  return false;
}

/** Backoff exponentiel avec jitter pour éviter le thundering herd. */
function backoffDelay(attempt: number): Promise<void> {
  const delay = Math.min(1000 * Math.pow(2, attempt), 16000);
  const jitter = Math.random() * 500;
  return new Promise((resolve) => setTimeout(resolve, delay + jitter));
}

async function withRetry<T>(
  fn: (signal: AbortSignal) => Promise<T>,
  maxRetries = MAX_RETRIES,
  context = 'OpenAI call',
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const result = await fn(controller.signal);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      lastError = error;
      const isLast = attempt === maxRetries;
      if (isLast || !isRetriable(error)) {
        console.error(`[OpenAI] ${context} échoué après ${attempt + 1} tentative(s):`, error);
        break;
      }
      console.warn(`[OpenAI] ${context} — retry ${attempt + 1}/${maxRetries} dans ${2 ** attempt}s...`);
      await backoffDelay(attempt);
    }
  }

  throw normalizeOpenAIError(lastError, context);
}

function normalizeOpenAIError(error: unknown, context: string): Error {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.startsWith('[OpenAI]')) return error; // déjà normalisée — pas de double-préfixe
    if (msg.includes('401') || msg.includes('Incorrect API key'))
      return new Error(`[OpenAI] Clé API invalide ou manquante (${context})`);
    if (msg.includes('429') || msg.includes('rate limit'))
      return new Error(`[OpenAI] Rate limit atteint. Réessayez dans quelques secondes. (${context})`);
    if (msg.includes('context_length') || msg.includes('maximum context'))
      return new Error(`[OpenAI] Contexte trop long — réduire l'historique. (${context})`);
    if (msg.includes('content_filter'))
      return new Error(`[OpenAI] Contenu bloqué par les filtres de sécurité. (${context})`);
    if (error.name === 'AbortError' || msg.includes('aborted'))
      return new Error(`[OpenAI] Timeout après ${TIMEOUT_MS}ms. (${context})`);
    return new Error(`[OpenAI] ${msg} (${context})`);
  }
  return new Error(`[OpenAI] Erreur inconnue. (${context})`);
}

// ─── Exports publics ───────────────────────────────────────────────────────────

/**
 * Complétion standard (non-streaming).
 * Usage : génération systemPrompt, résumés, évaluations d'action.
 */
export async function complete(options: CompletionOptions): Promise<CompletionResult> {
  const {
    messages,
    model       = DEFAULT_CHAT_MODEL,
    maxTokens   = 1000,
    temperature = 0.8,
  } = options;

  return withRetry(async (signal) => {
    const response = await getOpenAI().chat.completions.create({
      model,
      max_tokens:  maxTokens,
      temperature,
      messages:    messages.map((m) => ({ role: m.role, content: m.content })),
    }, { signal });

    const trimmedContent = (response.choices[0]?.message?.content ?? '').trim();
    if (!trimmedContent) throw new Error('Réponse vide reçue de OpenAI');

    return {
      content:          trimmedContent,
      model:            response.model,
      promptTokens:     response.usage?.prompt_tokens     ?? 0,
      completionTokens: response.usage?.completion_tokens ?? 0,
      totalTokens:      response.usage?.total_tokens      ?? 0,
    };
  }, MAX_RETRIES, `complete(${model})`);
}

/**
 * Complétion en streaming.
 * Usage : narration D&D avec effet machine à écrire — US-06-04.
 * onChunk appelé pour chaque token reçu.
 */
export async function completeStream(options: StreamingOptions): Promise<void> {
  const {
    messages,
    model       = DEFAULT_CHAT_MODEL,
    maxTokens   = 2000,
    temperature = 0.9,
    onChunk,
    onDone,
    onError,
  } = options;

  try {
    // Retry couvre uniquement l'initialisation du stream — pas l'itération des chunks.
    // Une fois le premier chunk émis, retry est désactivé pour éviter la duplication côté client.
    const stream = await withRetry((signal) =>
      getOpenAI().chat.completions.create({
        model,
        max_tokens:  maxTokens,
        temperature,
        stream:      true,
        messages:    messages.map((m) => ({ role: m.role, content: m.content })),
      }, { signal }),
    MAX_RETRIES, `completeStream(${model})`);

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) onChunk(delta);
    }

    await onDone?.();
  } catch (error) {
    const normalized = normalizeOpenAIError(error, 'completeStream');
    onError?.(normalized);
    throw normalized;
  }
}

/**
 * Génère un embedding vectoriel (1536 dim).
 * Usage : RAG pgvector — indexation SRD D&D 5e — US-06-02.
 */
export async function embed(options: EmbeddingOptions): Promise<EmbeddingResult> {
  const { text, model = DEFAULT_EMBED_MODEL } = options;

  if (!text.trim()) throw new Error('Impossible de générer un embedding pour un texte vide');

  return withRetry(async (signal) => {
    const response = await getOpenAI().embeddings.create({
      model,
      input: text.trim(),
    }, { signal });

    const vector = response.data[0]?.embedding;
    if (!vector) throw new Error('Embedding vide reçu de OpenAI');

    return {
      vector,
      model:  response.model,
      tokens: response.usage?.total_tokens ?? 0,
    };
  }, MAX_RETRIES, `embed(${model})`);
}

/**
 * Teste la connexion API — utilisé par le healthcheck GET /api/ai/health.
 */
export async function testConnection(): Promise<{ ok: boolean; model: string; latencyMs: number }> {
  const start = Date.now();
  try {
    const result = await complete({
      messages:    [{ role: 'user', content: 'Reply with exactly: OK' }],
      maxTokens:   5,
      temperature: 0,
    });
    return { ok: result.content.includes('OK'), model: result.model, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, model: DEFAULT_CHAT_MODEL, latencyMs: Date.now() - start };
  }
}
