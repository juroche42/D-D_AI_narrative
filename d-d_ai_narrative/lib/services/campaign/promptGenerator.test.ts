import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignTheme, CampaignDifficulty } from '@/app/generated/prisma/enums';

const mockCreate = vi.fn();

vi.mock('@/lib/openai', () => ({
  getOpenAI: () => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }),
}));

import { generateSystemPrompt, previewSystemPrompt } from './promptGenerator';

const validInput = {
  title:         'La Crypte du Roi Oublié',
  synopsis:      'Une aventure épique dans les profondeurs.',
  startLocation: 'Phandalin',
  mainQuest:     'Retrouver la mine perdue.',
  theme:         CampaignTheme.HEROIC,
  difficulty:    CampaignDifficulty.MEDIUM,
};

describe('generateSystemPrompt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('retourne le contenu généré par OpenAI (trimmed)', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '  Tu es le Dungeon Master.  ' } }],
    } as never);

    const result = await generateSystemPrompt(validInput);

    expect(result).toBe('Tu es le Dungeon Master.');
    expect(mockCreate).toHaveBeenCalledOnce();
  });

  it('appelle gpt-4o-mini avec le bon modèle et les bons paramètres', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'System prompt' } }],
    } as never);

    await generateSystemPrompt(validInput);

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4o-mini',
        max_tokens: 800,
        temperature: 0.7,
      }),
    );
  });

  it('inclut le titre et le thème dans le meta-prompt envoyé', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'ok' } }],
    } as never);

    await generateSystemPrompt(validInput);

    const call = mockCreate.mock.calls[0][0] as { messages: Array<{ content: string }> };
    const content = call.messages[0].content;
    expect(content).toContain('La Crypte du Roi Oublié');
    expect(content).toContain('HEROIC');
    expect(content).toContain('Réponds exclusivement en français');
  });

  it('lève une erreur si le contenu renvoyé est vide', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: '' } }],
    } as never);

    await expect(generateSystemPrompt(validInput)).rejects.toThrow(
      'La génération du system prompt a échoué',
    );
  });

  it('lève une erreur si choices est vide', async () => {
    mockCreate.mockResolvedValue({ choices: [] } as never);

    await expect(generateSystemPrompt(validInput)).rejects.toThrow(
      'La génération du system prompt a échoué',
    );
  });
});

describe('previewSystemPrompt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('délègue à generateSystemPrompt et retourne le même résultat', async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: 'Aperçu du prompt' } }],
    } as never);

    const result = await previewSystemPrompt(validInput);

    expect(result).toBe('Aperçu du prompt');
    expect(mockCreate).toHaveBeenCalledOnce();
  });
});
