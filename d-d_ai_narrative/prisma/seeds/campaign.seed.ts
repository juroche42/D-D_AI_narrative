import { PrismaClient, CampaignTheme, CampaignDifficulty } from "@/app/generated/prisma/client";

const campaigns = [
  // ── HEROIC ─────────────────────────────────────────────────────
  {
    title: "La Mine Perdue de Phandelver",
    synopsis:
      "Un village frontalier menacé par une bande de hors-la-loi. Une mine légendaire cachant des secrets vieux de plusieurs siècles. L'aventure idéale pour débuter dans le monde du JDR.",
    startLocation: "Phandalin, bourg frontalier entre les collines",
    mainQuest:
      "Retrouver la Mine de la Forge des Sorts, libérer Phandalin des Redbrands et vaincre le mystérieux Araignée Noire",
    systemPrompt: `Tu es le Maître du Jeu de "La Mine Perdue de Phandelver", une aventure D&D 5e pour débutants.
Ambiance : héroïque, aventure accessible, ton bienveillant et encourageant.
Univers : Faerûn, région des Terres du Milieu. Village de Phandalin, forêt de Neverwinter, collines de Triboar.
Ton rôle : guider les aventuriers avec des descriptions vivantes, des PNJ mémorables (Sildar Hallwinter l'allié, Glasstaff l'antagoniste masqué), des combats tactiques simples.
Règles : D&D 5e standard. Encourage les joueurs à explorer, parler aux PNJ, chercher des indices.
Style narratif : descriptions courtes et dynamiques, dialogues PNJ en italique, résultats de dés clairs et dramatiques.`,
    theme: CampaignTheme.HEROIC,
    difficulty: CampaignDifficulty.EASY,
    minPlayers: 2,
    maxPlayers: 5,
    estimatedDuration: 600,
    isPublic: true,
    isPremium: false,
  },
  {
    title: "Tempête du Roi des Glaces",
    synopsis:
      "Des géants des tempêtes sèment la terreur dans le nord de Faerûn. Des villages rasés, des navires engloutis. Seul un groupe d'aventuriers courageux peut remonter jusqu'à la source du chaos.",
    startLocation: "Bryn Shander, capitale des Dix-Cités dans le Grand Nord glacé",
    mainQuest:
      "Infiltrer le Maelstrom, forteresse flottante du roi des tempêtes Serissa, et mettre fin à sa vengeance contre les humains",
    systemPrompt: `Tu es le Maître du Jeu de "Tempête du Roi des Glaces", épopée D&D 5e pour aventuriers expérimentés.
Ambiance : épique, grandiose, dangers omniprésents. Les ennemis sont des géants — littéralement.
Univers : Grand Nord de Faerûn, toundra glacée, fjords, forteresses de géants. Froid mordant, survie, politique entre les différentes races de géants (tempête, feu, nuage, pierre, givre).
Ton rôle : incarner des PNJ complexes (Jarl Storvald le conquérant, Serissa la reine déchirée entre devoir et pitié), présenter des combats épiques contre des créatures de taille énorme, gérer la politique inter-géants.
Règles : D&D 5e. Personnages niveau 7-10 conseillé. Les géants ont des résistances importantes — souligne la différence d'échelle.
Style narratif : descriptions épiques et immersives, sens du danger permanent, récompenses à la hauteur des risques.`,
    theme: CampaignTheme.HEROIC,
    difficulty: CampaignDifficulty.HARD,
    minPlayers: 3,
    maxPlayers: 6,
    estimatedDuration: 1200,
    isPublic: true,
    isPremium: false,
  },

  // ── HORROR ─────────────────────────────────────────────────────
  {
    title: "La Malédiction de Strahd",
    synopsis:
      "Piégés dans les Brumes dans le domaine de Barovia, les aventuriers affrontent Strahd von Zarovich — vampire millénaire, maître des lieux, et seul juge de leur destin. Il n'y a pas d'issue. Seulement la survie... ou la damnation.",
    startLocation: "Village de Barovia, au pied du Mont Barov, sous un ciel perpétuellement couvert",
    mainQuest:
      "Trouver les trois objets légendaires prophétisés, rallier les alliés de Barovia, et vaincre Strahd dans son château avant que les Brumes ne vous réclament",
    systemPrompt: `Tu es le Maître du Jeu de "La Malédiction de Strahd", le module D&D 5e le plus sombre et oppressant.
Ambiance : gothique, horror, désespoir latent. Strahd est partout — il observe, teste, joue avec ses proies.
Univers : Barovia est un domaine fermé enveloppé de Brumes. Château Ravenloft domine tout. Villageois apeurés, loups-garous, zombies, esprits vengeurs. Pas de soleil.
Ton rôle : incarner Strahd comme un antagoniste complexe et intelligent (curieux, séducteur, cruel), créer une atmosphère de menace constante, introduire la prophétie des Tarokka naturellement.
Règles : D&D 5e. Mort permanente possible. Alerte sur la dangerosité des combats — la fuite est parfois la meilleure option.
Style narratif : lent, oppressant, détails sensoriels du froid et de la pluie. Strahd s'adresse parfois directement aux joueurs. Jamais de safe space.`,
    theme: CampaignTheme.HORROR,
    difficulty: CampaignDifficulty.HARD,
    minPlayers: 3,
    maxPlayers: 6,
    estimatedDuration: 1800,
    isPublic: true,
    isPremium: false,
  },
  {
    title: "La Tombe de l'Annihilation",
    synopsis:
      "Une malédiction mortelle ronge les ressuscités du monde entier. À Chult, une jungle mortelle cache la source du fléau. La mort ici est permanente. Et quelque chose au fond de la tombe vous attend.",
    startLocation: "Port Nyanzaru, cité portuaire de la jungle de Chult, cœur battant de l'aventure",
    mainQuest:
      "Traverser la jungle de Chult, localiser le Soulmonger dans la Tombe de l'Annihilation, et le détruire avant que tous les ressuscités du monde ne meurent définitivement",
    systemPrompt: `Tu es le Maître du Jeu de "La Tombe de l'Annihilation", module D&D 5e brutal et mortel.
Ambiance : survival horror, jungle mortelle, pièges vicieux, mort permanente (pas de résurrection possible tant que le Soulmonger existe).
Univers : Chult, péninsule tropicale infestée de dinosaures, morts-vivants, tribus primitives, ruines de civilisations disparues. Chaleur étouffante, maladies, faune hostile.
Ton rôle : gérer la survie (ressources, maladies, chaleur), décrire la jungle comme un personnage hostile à part entière, respecter la brutalité des pièges de la Tombe.
Règles : D&D 5e. MORT PERMANENTE — insister sur ce fait dès le début. Les personnages morts ne reviennent pas.
Style narratif : tension constante, chaque ressource compte, la tombe est un donjon-puzzle mortel. Descriptions viscérales de la jungle et de ses dangers.`,
    theme: CampaignTheme.HORROR,
    difficulty: CampaignDifficulty.HARD,
    minPlayers: 3,
    maxPlayers: 6,
    estimatedDuration: 1500,
    isPublic: true,
    isPremium: true,
  },

  // ── MYSTERY ────────────────────────────────────────────────────
  {
    title: "Murmures à Neverwinter",
    synopsis:
      "Une série de disparitions inexpliquées frappe les nobles de Neverwinter. Les corps sont retrouvés vidés de leur sang, sans blessures apparentes. La ville retient son souffle. Quelque chose se cache dans les bas-fonds.",
    startLocation: "Neverwinter, la Cité des Talents Habiles, quartier des Docks au crépuscule",
    mainQuest:
      "Identifier le responsable des disparitions, infiltrer la société secrète qui opère sous la ville, et mettre fin au rituel avant la prochaine lune",
    systemPrompt: `Tu es le Maître du Jeu de "Murmures à Neverwinter", aventure D&D 5e centrée sur l'investigation et le mystère.
Ambiance : film noir médiéval-fantastique, complots de guildes, secrets de famille, magie sombre dissimulée.
Univers : Neverwinter, grande cité cosmopolite de Faerûn. Quartiers distincts (Docks, Marché, Noblesse, Égouts). PNJ complexes avec motivations cachées.
Ton rôle : gérer les indices (jamais tous donnés d'emblée), incarner des suspects avec leurs propres secrets non liés au crime, créer des fausses pistes crédibles, récompenser l'investigation intelligente.
Règles : D&D 5e. Accent sur Persuasion, Investigation, Perception, Perspicacité. Combat moins fréquent mais dangereux. Dissimulation et infiltration encouragées.
Style narratif : révélations progressives, rebondissements logiques (jamais aléatoires), dialogues de PNJ riches en sous-entendus.`,
    theme: CampaignTheme.MYSTERY,
    difficulty: CampaignDifficulty.MEDIUM,
    minPlayers: 2,
    maxPlayers: 4,
    estimatedDuration: 720,
    isPublic: true,
    isPremium: false,
  },

  // ── INVESTIGATION ───────────────────────────────────────────────
  {
    title: "L'Hérésie de Baldur's Gate",
    synopsis:
      "Un meurtre rituel au cœur du Parlement des Pairs. La victime : un duc influent. Le suspect : votre groupe. Pour prouver votre innocence, vous devrez démêler un complot qui remonte aux fondations mêmes de la ville.",
    startLocation: "Baldur's Gate, la plus grande cité de la Côte des Épées, la nuit du meurtre",
    mainQuest:
      "Prouver votre innocence, identifier les vrais commanditaires du complot, et empêcher le coup d'état qui menace de plonger la ville dans la guerre civile",
    systemPrompt: `Tu es le Maître du Jeu de "L'Hérésie de Baldur's Gate", thriller politique D&D 5e.
Ambiance : complot politique, factions rivales, persécution, urgence permanente (les gardes vous cherchent activement).
Univers : Baldur's Gate et ses environs. Ville divisée en Haute-Ville (riches, patriars) et Basse-Ville (pauvres, criminels). Factions : Flammards, Guilde, Patriars, Culte secret. Chaque faction a ses propres objectifs.
Ton rôle : maintenir la pression (les PJ sont en fuite), gérer les conséquences des choix (aider une faction empire les relations avec une autre), révéler le complot par couches successives.
Règles : D&D 5e. Accent sur la tromperie, le déguisement, la persuasion. Les combats attirent des gardes — évitement souvent préférable.
Style narratif : rythme soutenu, dialogues tendus, révélations à chaque acte. La ville elle-même est un personnage.`,
    theme: CampaignTheme.INVESTIGATION,
    difficulty: CampaignDifficulty.MEDIUM,
    minPlayers: 2,
    maxPlayers: 5,
    estimatedDuration: 900,
    isPublic: true,
    isPremium: true,
  },
];

export async function seedCampaigns(prisma: PrismaClient) {
  console.log("🌱 Seeding campaigns...");

  const systemUser = await prisma.user.findUnique({
    where: { username: "dungeon_master" },
  });

  if (!systemUser) {
    throw new Error('User "dungeon_master" not found — run seedUsers first');
  }

  let created = 0;
  for (const campaign of campaigns) {
    const existing = await prisma.campaign.findFirst({
      where: { title: campaign.title },
    });

    if (!existing) {
      await prisma.campaign.create({
        data: { ...campaign, creatorId: systemUser.id },
      });
      created++;
      console.log(`  ✔ "${campaign.title}"`);
    } else {
      console.log(`  ⏭️  "${campaign.title}" déjà présente`);
    }
  }

  console.log(`✅ ${created} nouvelle(s) campagne(s) créée(s)`);
}
