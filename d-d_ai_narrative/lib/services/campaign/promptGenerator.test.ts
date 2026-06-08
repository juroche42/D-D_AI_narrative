import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CampaignTheme, CampaignDifficulty } from '@/app/generated/prisma/enums';

const mockComplete = vi.hoisted(() => vi.fn());

vi.mock('@/lib/services/ai/openAIService', () => ({
  complete: mockComplete,
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
    mockComplete.mockResolvedValue({ content: 'Tu es le Dungeon Master.', totalTokens: 100 });

    const result = await generateSystemPrompt(validInput);

    expect(result).toBe('Tu es le Dungeon Master.');
    expect(mockComplete).toHaveBeenCalledOnce();
  });

  it('appelle complete avec les bons paramètres (maxTokens, temperature)', async () => {
    mockComplete.mockResolvedValue({ content: 'System prompt', totalTokens: 50 });

    await generateSystemPrompt(validInput);

    expect(mockComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        maxTokens:   800,
        temperature: 0.7,
      }),
    );
  });

  it('inclut le titre et le thème dans le meta-prompt envoyé', async () => {
    mockComplete.mockResolvedValue({ content: 'ok', totalTokens: 10 });

    await generateSystemPrompt(validInput);

    const call = mockComplete.mock.calls[0][0] as { messages: Array<{ content: string }> };
    const content = call.messages[0].content;
    expect(content).toContain('La Crypte du Roi Oublié');
    expect(content).toContain('HEROIC');
    expect(content).toContain('Réponds exclusivement en français');
  });

  it('lève une erreur si le contenu renvoyé est vide', async () => {
    mockComplete.mockResolvedValue({ content: '', totalTokens: 0 });

    await expect(generateSystemPrompt(validInput)).rejects.toThrow(
      'La génération du system prompt a échoué',
    );
  });

  it('propage les erreurs de complete()', async () => {
    mockComplete.mockRejectedValue(new Error('[OpenAI] Rate limit atteint'));

    await expect(generateSystemPrompt(validInput)).rejects.toThrow('Rate limit');
  });
});

describe('previewSystemPrompt', () => {
  beforeEach(() => vi.clearAllMocks());

  it('délègue à generateSystemPrompt et retourne le même résultat', async () => {
    mockComplete.mockResolvedValue({ content: 'Aperçu du prompt', totalTokens: 30 });

    const result = await previewSystemPrompt(validInput);

    expect(result).toBe('Aperçu du prompt');
    expect(mockComplete).toHaveBeenCalledOnce();
  });
});
