import 'server-only';
import { prisma } from '@/lib/prisma';
import { completeStream } from '@/lib/services/ai/openAIService';
import { buildRagContext } from '@/lib/services/ai/ragService';
import { NarrativeEntryType } from '@/app/generated/prisma/enums';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GameContext {
  roomCode:              string;
  campaignTitle:         string;
  campaignSynopsis:      string;
  campaignStartLocation: string;
  campaignMainQuest:     string;
  campaignSystemPrompt:  string;
  gameStateId:           string;
  players: {
    username:      string;
    characterName?: string;
    race?:          string;
    class?:         string;
  }[];
}

// ─── Context loader ─────────────────────────────────────────────────────────────

/**
 * Charge le contexte de jeu complet depuis la base de données.
 * @throws si le salon, la campagne ou le GameState est introuvable.
 */
export async function getGameContext(roomCode: string): Promise<GameContext> {
  const room = await prisma.room.findUnique({
    where: { code: roomCode.toUpperCase() },
    include: {
      campaign: true,
      gameState: true,
      players: {
        include: {
          user:      { select: { username: true } },
          character: { select: { name: true, race: true, class: true } },
        },
      },
    },
  });

  if (!room)           throw new Error('Salon introuvable');
  if (!room.campaign)  throw new Error('Aucune campagne sélectionnée');
  if (!room.gameState) throw new Error("GameState introuvable — la partie n'a pas été démarrée");

  return {
    roomCode:              room.code,
    campaignTitle:         room.campaign.title,
    campaignSynopsis:      room.campaign.synopsis,
    campaignStartLocation: room.campaign.startLocation,
    campaignMainQuest:     room.campaign.mainQuest,
    campaignSystemPrompt:  room.campaign.systemPrompt,
    gameStateId:           room.gameState.id,
    players: room.players.map((p) => ({
      username:      p.user.username,
      characterName: p.character?.name,
      race:          p.character?.race ?? undefined,
      class:         p.character?.class ?? undefined,
    })),
  };
}

// ─── Prompt builder ─────────────────────────────────────────────────────────────

function buildIntroSystemPrompt(ctx: GameContext, ragContext: string): string {
  const playerList = ctx.players
    .map((p) =>
      p.characterName
        ? `${p.username} joue ${p.characterName} (${p.race ?? '?'} ${p.class ?? '?'})`
        : `${p.username} (personnage non créé)`,
    )
    .join(', ');

  return [
    ctx.campaignSystemPrompt,
    '',
    '## Contexte D&D (RAG)',
    ragContext || '(aucun contexte disponible)',
    '',
    '## Joueurs présents',
    playerList,
    '',
    `## Campagne : ${ctx.campaignTitle}`,
    ctx.campaignSynopsis,
    `Lieu de départ : ${ctx.campaignStartLocation}`,
    `Quête principale : ${ctx.campaignMainQuest}`,
  ].join('\n');
}

// ─── Génération ─────────────────────────────────────────────────────────────────

/**
 * Génère l'introduction narrative de la campagne via RAG + OpenAI streaming.
 * Persiste le texte complet en base une fois le stream terminé.
 *
 * @param ctx     Contexte de jeu chargé par getGameContext()
 * @param onChunk Callback appelé pour chaque token reçu (pour SSE)
 */
export async function generateCampaignIntroduction(
  ctx: GameContext,
  onChunk: (token: string) => void,
): Promise<void> {
  const { contextText } = await buildRagContext(ctx.campaignStartLocation);
  const systemPrompt = buildIntroSystemPrompt(ctx, contextText);

  let fullContent = '';

  await completeStream({
    messages: [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content:
          "Commence l'aventure avec une introduction narrative immersive (3-4 paragraphes). Décris l'atmosphère, le lieu de départ et ce que les héros perçoivent.",
      },
    ],
    maxTokens:   1000,
    temperature: 0.9,
    onChunk: (token) => {
      fullContent += token;
      onChunk(token);
    },
    onDone: async () => {
      await prisma.narrativeEntry.create({
        data: {
          gameStateId: ctx.gameStateId,
          turn:        1,
          type:        NarrativeEntryType.NARRATION,
          content:     fullContent,
        },
      });
      await prisma.gameState.update({
        where: { id: ctx.gameStateId },
        data:  { narrativeContext: fullContent, lastActivityAt: new Date() },
      });
    },
  });
}
