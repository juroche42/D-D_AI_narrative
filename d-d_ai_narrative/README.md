# ⚔️ D&D AI Narrative — Dungeon Master IA

Application web multijoueur de **jeu de rôle narratif** (JDR) propulsée par une **Intelligence Artificielle Générative** jouant le rôle de Dungeon Master. Basée sur l'univers de *Donjons & Dragons*, l'IA scénarise des aventures dynamiques, gère les PNJ, les quêtes et réagit en temps réel aux actions des joueurs.

---

## 🧠 Concept

L'innovation majeure du projet repose sur un **LLM (Large Language Model)** agissant comme **Maître du Jeu** capable de :

- Générer des scénarios narratifs dynamiques
- Mémoriser les actions des joueurs via une **mémoire vectorielle** (pgvector)
- Adapter l'histoire en fonction des décisions de chaque session
- Gérer les règles D&D, les PNJ, les quêtes et le lore de l'univers

---

## 🗄️ Base de données & Données vectorielles

Le projet utilise **PostgreSQL** avec l'extension **pgvector**.

### Pourquoi pgvector ?

Le LLM (Dungeon Master IA) a besoin de **mémoire**. Pour retrouver rapidement les souvenirs pertinents (ex : "Que s'est-il passé lors de la dernière session ?"), chaque souvenir est transformé en **vecteur numérique** (embedding) par le LLM.

> Un embedding est une liste de nombres (ex: 1536 valeurs) qui représente le *sens* d'un texte. Deux textes proches sémantiquement auront des vecteurs proches.

**pgvector** permet de stocker ces vecteurs directement dans PostgreSQL et d'effectuer des **recherches par similarité** ultra-rapides — c'est ainsi que l'IA retrouve les souvenirs les plus pertinents pour la situation actuelle.

---

## 🛠️ Stack technique

| Couche | Technologie |
|---|---|
| Frontend / Backend | Next.js 16 (App Router) |
| Base de données | PostgreSQL 17 + pgvector |
| ORM | Prisma 7 |
| IA / LLM | OpenAI API (ou modèle open-source) |
| Conteneurisation | Docker + Docker Compose |
| UI DB (dev) | Adminer (port 8080) |

---

## ✅ Prérequis

Avant de démarrer, assurez-vous d'avoir installé :

- **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (v24+)
- **[Node.js](https://nodejs.org/)** (v20+)
- **[pnpm](https://pnpm.io/installation)** (v9+) : `npm install -g pnpm`

---

## 🚀 Lancer le projet en local

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd d-d_ai_narrative
```

### 2. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du projet avec le contenu suivant (à adapter selon vos besoins) :

```dotenv
POSTGRES_DB=dnd_ai
POSTGRES_USER=dnd_user
POSTGRES_PASSWORD=change_me
POSTGRES_PORT=5433
DATABASE_URL="postgresql://dnd_user:change_me@localhost:5433/dnd_ai?schema=public"
```

### 3. Démarrer la base de données avec Docker

```bash
docker compose up -d
```

Cela démarre :
- **PostgreSQL 17** avec l'extension `pgvector` déjà activée (port `5433`)
- **Adminer** — interface web pour gérer la DB (port `8080` → http://localhost:8080)

Pour se connecter via Adminer :
- Système : `PostgreSQL`
- Serveur : `postgres`
- Utilisateur / Mot de passe / Base : valeurs de votre `.env`

### 4. Installer les dépendances

```bash
pnpm install
```

### 5. Appliquer les migrations Prisma

```bash
pnpm db:migrate
```

> Cela crée les tables dans la base de données selon le schéma défini dans `prisma/schema.prisma`.

### 6. Lancer le serveur de développement

```bash
pnpm dev
```

L'application est disponible sur **http://localhost:3000**

---

## 📚 Documentation API

La documentation Swagger est disponible sur : **http://localhost:3000/api-docs**

---

## 🗃️ Commandes utiles

| Commande | Description |
|---|---|
| `pnpm dev` | Démarrer en mode développement |
| `pnpm build` | Builder pour la production |
| `pnpm db:migrate` | Créer/appliquer les migrations |
| `pnpm db:generate` | Régénérer le client Prisma |
| `pnpm db:studio` | Ouvrir Prisma Studio (UI DB) |
| `pnpm db:reset` | Réinitialiser la base de données |
| `docker compose up -d` | Démarrer la DB en arrière-plan |
| `docker compose down` | Arrêter la DB |
| `docker compose down -v` | Arrêter + supprimer les données |

---

## 📁 Structure du projet

```
d-d_ai_narrative/
├── app/                    # Routes Next.js (App Router)
│   ├── api/                # Endpoints API
│   │   └── swagger/        # Route GET /api/swagger (spec JSON)
│   ├── api-docs/           # Page Swagger UI
│   └── generated/          # Client Prisma généré (ne pas modifier)
├── lib/
│   ├── prisma.ts           # Singleton client Prisma
│   └── swagger.ts          # Configuration Swagger
├── prisma/
│   ├── schema.prisma       # Schéma de la base de données
│   └── migrations/         # Historique des migrations SQL
├── init-scripts/
│   └── 01-vector.sql       # Activation pgvector au démarrage Docker
├── docker-compose.yaml     # Services Docker (Postgres + Adminer)
├── prisma.config.ts        # Configuration Prisma v7
└── .env                    # Variables d'environnement (non versionné)
```
