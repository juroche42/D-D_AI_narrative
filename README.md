# ⚔️ D&D AI Narrative

> Application web multijoueur de jeu de rôle (JDR) narratif propulsée par une IA Générative.

---

## 📖 Présentation

**D&D AI Narrative** est une application web multijoueur permettant de vivre des aventures de jeu de rôle dans l'univers de **Donjons & Dragons**.

L'innovation majeure du projet réside dans l'utilisation d'une **Intelligence Artificielle Générative (LLM)** jouant le rôle de **Maître du Jeu (Dungeon Master)**. Cette IA est capable de :

- Scénariser des aventures dynamiques et personnalisées
- Réagir en temps réel aux décisions des joueurs
- Générer des descriptions immersives, des dialogues et des rebondissements narratifs
- Gérer les règles et l'univers de Donjons & Dragons

---

## 🛠️ Stack Technique

| Technologie | Rôle |
|---|---|
| **Next.js 16** | Framework front-end & back-end (App Router) |
| **React 19** | Interface utilisateur |
| **TypeScript** | Typage statique |
| **Prisma 7** | ORM pour la base de données |
| **PostgreSQL 17** | Base de données relationnelle |
| **Docker** | Conteneurisation de la base de données |
| **pgvector** | Extension PostgreSQL pour les embeddings vectoriels de l'IA |
| **Tailwind CSS 4** | Styles |
| **Swagger / OpenAPI** | Documentation de l'API REST |

---

## ✅ Prérequis

Avant de lancer le projet, assurez-vous d'avoir installé sur votre machine :

- [Node.js](https://nodejs.org/) **≥ 20**
- [pnpm](https://pnpm.io/) **≥ 9** (`npm install -g pnpm`)
- [Docker](https://www.docker.com/) & **Docker Compose**

---

## 🚀 Lancer le projet en local

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-utilisateur/D-D_AI_narrative.git
cd D-D_AI_narrative/d-d_ai_narrative
```

### 2. Installer les dépendances

```bash
pnpm install
```

### 3. Configurer les variables d'environnement

Créez un fichier `.env` à la racine du dossier `d-d_ai_narrative/` en vous basant sur l'exemple ci-dessous :

```env
# PostgreSQL
POSTGRES_USER=#db_user
POSTGRES_PASSWORD=#db_password
POSTGRES_DB=#db_name

# Prisma
DATABASE_URL="postgresql://postgres:#db_user@localhost:5432/#db_name"
```

### 4. Démarrer la base de données avec Docker

```bash
docker compose up -d
```

> Cela lance un conteneur **PostgreSQL 17** en arrière-plan sur le port `5432`.

### 5. Appliquer les migrations Prisma

```bash
pnpm exec prisma migrate dev --name init
```

### 6. Lancer le serveur de développement

```bash
pnpm dev
```

L'application est maintenant accessible sur **[http://localhost:3000](http://localhost:3000)**.

La documentation API Swagger est disponible sur **[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**.

---

## 🧠 Intelligence Artificielle & Mémoire Vectorielle

L'IA Dungeon Master utilise un système de **mémoire vectorielle** basé sur `pgvector` (extension PostgreSQL) pour garantir la cohérence narrative.

### Comment ça fonctionne

```
Événement du jeu → Embedding (LLM) → Vecteur stocké dans PostgreSQL
                                              ↓
Nouvelle situation → Recherche par similarité → Top 5 souvenirs pertinents
                                              ↓
                           Injection dans le prompt → Réponse du DM IA
```

### Types de mémoire gérés

| Type | Exemple |
|---|---|
| `EVENT` | "Thorin a tué le dragon rouge au tour 42" |
| `LORE` | "La forêt de Cormanthor est hantée" |
| `NPC` | "Garrick le forgeron est allié des joueurs" |
| `QUEST` | "Récupérer l'épée légendaire de Baldur" |
| `RULE` | "Un jet de 20 naturel est un coup critique" |

> 💡 **pgvector** est intégré directement dans PostgreSQL, pas besoin d'un service séparé.

---



| Commande | Description |
|---|---|
| `docker compose up -d` | Démarrer la base de données |
| `docker compose down` | Arrêter les conteneurs |
| `docker compose down -v` | Arrêter et supprimer les données |

---

## 📚 Documentation API

La documentation interactive de l'API est générée automatiquement via **Swagger UI** et accessible à l'adresse :

```
http://localhost:3000/api-docs
```

---

## 📄 Licence

Projet en cours de développement — tous droits réservés.
