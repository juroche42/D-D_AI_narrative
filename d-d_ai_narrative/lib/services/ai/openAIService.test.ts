import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('server-only', () => ({}));

const mockChatCreate  = vi.hoisted(() => vi.fn());
const mockEmbedCreate = vi.hoisted(() => vi.fn());

vi.mock('@/lib/openai', () => ({
  getOpenAI: () => ({
    chat:       { completions: { create: mockChatCreate  } },
    embeddings: { create: mockEmbedCreate },
  }),
}));

import { complete, embed, completeStream } from './openAIService';

const mockChatResponse = {
  choices: [{ message: { content: 'Réponse IA' } }],
  model:   'gpt-4o-mini',
  usage:   { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
};

describe('complete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne le contenu et les stats de tokens', async () => {
    mockChatCreate.mockResolvedValue(mockChatResponse);
    const result = await complete({ messages: [{ role: 'user', content: 'test' }] });
    expect(result.content).toBe('Réponse IA');
    expect(result.totalTokens).toBe(30);
    expect(result.promptTokens).toBe(10);
    expect(result.completionTokens).toBe(20);
  });

  it('lève une erreur si la réponse est vide', async () => {
    mockChatCreate.mockResolvedValue({
      choices: [{ message: { content: '' } }],
      model:   'gpt-4o-mini',
      usage:   { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
    });
    await expect(complete({ messages: [{ role: 'user', content: 'test' }] }))
      .rejects.toThrow('vide');
  });

  it('ne retry pas sur 401 — appelé une seule fois', async () => {
    mockChatCreate.mockRejectedValue(new Error('401 Incorrect API key'));
    await expect(complete({ messages: [{ role: 'user', content: 'test' }] }))
      .rejects.toThrow('Clé API invalide');
    expect(mockChatCreate).toHaveBeenCalledTimes(1);
  });

  it('normalise un message rate limit 429', async () => {
    vi.useFakeTimers();
    mockChatCreate.mockRejectedValue(new Error('429 rate limit exceeded'));
    const expectation = expect(
      complete({ messages: [{ role: 'user', content: 'test' }] }),
    ).rejects.toThrow('Rate limit');
    await vi.runAllTimersAsync();
    await expectation;
    vi.useRealTimers();
  });

  it('utilise le modèle par défaut gpt-4o-mini', async () => {
    mockChatCreate.mockResolvedValue(mockChatResponse);
    await complete({ messages: [{ role: 'user', content: 'test' }] });
    expect(mockChatCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-4o-mini' }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});

describe('embed', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne un vecteur de 1536 dimensions', async () => {
    mockEmbedCreate.mockResolvedValue({
      data:  [{ embedding: Array(1536).fill(0.1) }],
      model: 'text-embedding-3-small',
      usage: { total_tokens: 5 },
    });
    const result = await embed({ text: 'Règles D&D 5e' });
    expect(result.vector).toHaveLength(1536);
    expect(result.tokens).toBe(5);
    expect(result.model).toBe('text-embedding-3-small');
  });

  it('lève une erreur si le texte est vide sans appeler OpenAI', async () => {
    await expect(embed({ text: '   ' })).rejects.toThrow('vide');
    expect(mockEmbedCreate).not.toHaveBeenCalled();
  });

  it('utilise le modèle par défaut text-embedding-3-small', async () => {
    mockEmbedCreate.mockResolvedValue({
      data:  [{ embedding: Array(1536).fill(0) }],
      model: 'text-embedding-3-small',
      usage: { total_tokens: 3 },
    });
    await embed({ text: 'test' });
    expect(mockEmbedCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'text-embedding-3-small' }),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });
});

describe('completeStream', () => {
  beforeEach(() => vi.clearAllMocks());

  it('appelle onChunk pour chaque token et onDone à la fin', async () => {
    const fakeStream = (async function* () {
      yield { choices: [{ delta: { content: 'La '     } }] };
      yield { choices: [{ delta: { content: 'taverne' } }] };
      yield { choices: [{ delta: { content: ' est sombre.' } }] };
    })();

    mockChatCreate.mockResolvedValue(fakeStream);

    const chunks: string[] = [];
    const onDone = vi.fn();
    await completeStream({
      messages: [{ role: 'user', content: 'Décris la scène' }],
      onChunk:  (c) => chunks.push(c),
      onDone,
    });

    expect(chunks).toEqual(['La ', 'taverne', ' est sombre.']);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('appelle onError et re-throw en cas d\'erreur', async () => {
    vi.useFakeTimers();
    mockChatCreate.mockRejectedValue(new Error('502 bad gateway'));

    const onError = vi.fn();
    const expectation = expect(
      completeStream({
        messages: [{ role: 'user', content: 'test' }],
        onChunk:  vi.fn(),
        onError,
      }),
    ).rejects.toThrow();
    await vi.runAllTimersAsync();
    await expectation;
    expect(onError).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('ignore les chunks sans contenu delta', async () => {
    const fakeStream = (async function* () {
      yield { choices: [{ delta: { content: null   } }] };
      yield { choices: [{ delta: { content: 'Texte' } }] };
      yield { choices: [{ delta: {}                  }] };
    })();

    mockChatCreate.mockResolvedValue(fakeStream);

    const chunks: string[] = [];
    await completeStream({
      messages: [{ role: 'user', content: 'test' }],
      onChunk:  (c) => chunks.push(c),
    });

    expect(chunks).toEqual(['Texte']);
  });
});
