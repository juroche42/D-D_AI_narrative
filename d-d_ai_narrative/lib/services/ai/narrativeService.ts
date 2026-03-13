import 'server-only';
import { prisma } from '@/lib/prisma';
import { completeStream, complete } from '@/lib/services/ai/openAIService';
import { buildRagContext } from '@/lib/services/ai/ragService';
import { NarrativeEntryType, TurnActionType } from '@/app/generated/prisma/enums';
import type { ChatMessage } from '@/lib/services/ai/types';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface GameContext {
  roomCode:              string;
  campaignTitle:         string;
  campaignSynopsis:      string;
  campaignStartLocation: string;
  campaignMainQuest:     string;
  campaignSystemPrompt:  string;
  gameStateId:           string;
  currentTurn:           number;
  narrativeContext:      string;
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
      gameState: {
        select: {
          id:               true,
          currentTurn:      true,
          narrativeContext: true,
        },
      },
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
    currentTurn:           room.gameState.currentTurn,
    narrativeContext:      room.gameState.narrativeContext,
    players: room.players.map((p) => ({
      username:      p.user.username,
      characterName: p.character?.name,
      race:          p.character?.race ?? undefined,
      class:         p.character?.class ?? undefined,
    })),
  };
}

// ─── Prompt builders ────────────────────────────────────────────────────────────

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

function buildNarrativeContextSummary(
  ctx: GameContext,
  lastAction: string,
  lastNarration: string,
): string {
  return `[Tour ${ctx.currentTurn}] Action : "${lastAction}" → ${lastNarration.slice(0, 300)}...`;
}

// ─── Historique conversationnel ─────────────────────────────────────────────────

/**
 * Charge les N dernières entrées narratives comme contexte conversationnel OpenAI.
 * Limite à `limit` entrées pour ne pas saturer la fenêtre de contexte (~2000 tokens max).
 */
async function loadConversationHistory(
  gameStateId: string,
  limit = 10,
): Promise<ChatMessage[]> {
  const entries = await prisma.narrativeEntry.findMany({
    where:   { gameStateId },
    orderBy: { createdAt: 'asc' },
    take:    limit,
  });

  return entries.map((entry) => {
    if (entry.type === NarrativeEntryType.NARRATION) {
      return { role: 'assistant' as const, content: entry.content };
    }
    return {
      role: 'user' as const,
      content: entry.authorId
        ? `[Action joueur] ${entry.content}`
        : `[Système] ${entry.content}`,
    };
  });
}

// ─── Génération — Introduction ───────────────────────────────────────────────────

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

// ─── Génération — Actions suggérées ─────────────────────────────────────────────

/**
 * Génère 3 actions suggérées pour le tour courant (non-streaming, réponse JSON).
 * Les actions sont cohérentes avec la dernière scène narrée.
 */
export async function generateTurnActions(
  ctx: GameContext,
  lastNarration: string,
): Promise<string[]> {
  const history = await loadConversationHistory(ctx.gameStateId, 8);

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `${ctx.campaignSystemPrompt}

Tu es le Maître du Jeu. Génère exactement 3 actions possibles pour les joueurs.
Règles STRICTES :
- Chaque action commence par un verbe à l'infinitif (ex: "Inspecter", "Attaquer", "Parler à")
- 10-15 mots maximum par action
- Les 3 actions doivent être distinctes (une prudente, une audacieuse, une créative)
- Cohérentes avec la scène et la campagne ${ctx.campaignTitle}
- Réponds UNIQUEMENT avec un JSON valide, rien d'autre :
  {"actions": ["action1", "action2", "action3"]}`,
    },
    ...history,
    {
      role: 'user',
      content: `Dernière scène : "${lastNarration.slice(0, 400)}"\n\nGénère les 3 actions pour ce tour.`,
    },
  ];

  const result = await complete({
    messages,
    maxTokens:   200,
    temperature: 0.8,
  });

  try {
    const cleaned = result.content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    const parsed = JSON.parse(cleaned) as { actions: string[] };

    if (!Array.isArray(parsed.actions) || parsed.actions.length === 0) {
      throw new Error('Format invalide');
    }

    return parsed.actions.slice(0, 3);
  } catch {
    console.error('[narrativeService] Parsing actions échoué, fallback générique');
    return [
      'Explorer les environs avec prudence',
      'Engager la situation de front',
      'Chercher une approche créative et inattendue',
    ];
  }
}

/**
 * Persiste les actions générées dans TurnAction (idempotent par tour).
 */
export async function saveTurnActions(
  gameStateId: string,
  turn: number,
  actions: string[],
): Promise<Array<{ id: string; content: string; type: string }>> {
  return prisma.$transaction(async (tx) => {
    await tx.turnAction.deleteMany({
      where: { gameStateId, turn, type: TurnActionType.SUGGESTED },
    });

    const created = await Promise.all(
      actions.map((content) =>
        tx.turnAction.create({
          data: {
            gameStateId,
            turn,
            type:     TurnActionType.SUGGESTED,
            content,
            authorId: null,
          },
          select: { id: true, content: true, type: true },
        }),
      ),
    );

    return created.map((a) => ({ ...a, type: a.type as string }));
  });
}

// ─── Génération — Scène narrative ───────────────────────────────────────────────

/**
 * Génère la scène narrative suivante en streaming basée sur l'action choisie.
 * 1. Charge l'historique conversationnel
 * 2. Récupère le contexte RAG pertinent pour l'action
 * 3. Streame la narration token par token via onChunk
 * 4. Persiste l'action (ACTION) + la narration (NARRATION) en base
 * 5. Incrémente le tour et met à jour narrativeContext
 */
export async function generateSceneNarrative(
  ctx: GameContext,
  chosenAction: string,
  _chosenActionId: string | null,
  onChunk: (token: string) => void,
): Promise<string> {
  const history = await loadConversationHistory(ctx.gameStateId, 10);

  const ragQuery  = `${chosenAction} ${ctx.campaignStartLocation}`;
  const ragResult = await buildRagContext(ragQuery);

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `${ctx.campaignSystemPrompt}

## Tour ${ctx.currentTurn} — Continuation de l'aventure
${ragResult.contextText ? `## Contexte D&D (RAG)\n${ragResult.contextText}\n` : ''}
## Contexte narratif actuel
${ctx.narrativeContext || '(début de partie)'}

## Instructions
- Décris les conséquences de l'action choisie et la nouvelle situation.
- 150-250 mots, en français, à la 2ème personne du pluriel ("vous").
- Termine par une situation de tension qui invite à agir.
- NE génère PAS de nouvelles actions — elles seront proposées séparément.`,
    },
    ...history,
    {
      role: 'user',
      content: `Les aventuriers ont décidé : "${chosenAction}"\n\nDécris ce qui se passe.`,
    },
  ];

  await prisma.narrativeEntry.create({
    data: {
      gameStateId: ctx.gameStateId,
      turn:        ctx.currentTurn,
      type:        NarrativeEntryType.ACTION,
      content:     chosenAction,
      authorId:    null,
    },
  });

  let fullContent = '';
  await completeStream({
    messages,
    maxTokens:   600,
    temperature: 0.85,
    onChunk: (token) => {
      fullContent += token;
      onChunk(token);
    },
  });

  await prisma.narrativeEntry.create({
    data: {
      gameStateId: ctx.gameStateId,
      turn:        ctx.currentTurn,
      type:        NarrativeEntryType.NARRATION,
      content:     fullContent,
      authorId:    null,
    },
  });

  await prisma.gameState.update({
    where: { id: ctx.gameStateId },
    data: {
      currentTurn:      { increment: 1 },
      narrativeContext: buildNarrativeContextSummary(ctx, chosenAction, fullContent),
      lastActivityAt:   new Date(),
    },
  });

  return fullContent;
}
