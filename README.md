# MiniOrg - Life Planner

A minimal, clean life planner, built with Next.js and designed for modern professionals who want to stay organized without the complexity.

## Features

- 🎯 **Today View** - Plan your day with time-specific task scheduling
- 📋 **Smart Backlog** - Automatic grouping by deadline (Overdue, Next 3 Days, Week, Month, Quarter, Year, No Date)
- 📅 **Calendar View** - Week-based kanban board to visualize your schedule
- 🎯 **Drag & Drop** - Move incomplete tasks between days in the calendar view
- ⚡ **Quick Add** - Keyboard shortcut (⌘K / Ctrl+K) for rapid task creation
- ✨ **Beautiful UI** - Clean, minimal design with smooth animations
- 🔐 **Secure Auth** - Google OAuth authentication
- 🏷️ **Tags & Organization** - Categorize tasks with color-coded tags
- ✅ **Task Completion** - Animated checkmarks with task history

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Database:** Prisma + SQLite (dev) → D1 (production)
- **Auth:** NextAuth.js v5 with Google OAuth
- **UI:** shadcn/ui + Tailwind CSS
- **Animations:** Framer Motion
- **Deployment:** Cloudflare Workers (free tier compatible)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Google OAuth credentials ([Get them here](https://console.cloud.google.com/))

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd miniorg
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory:
```env
DATABASE_URL="file:./dev.db"
AUTH_URL="http://localhost:3000"
AUTH_SECRET="your-secret-key-here"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

4. Initialize the database:
```bash
npx prisma migrate dev --name init
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Usage

### Quick Add Task
Press `⌘K` (Mac) or `Ctrl+K` (Windows/Linux) anywhere in the app to quickly add a task.

### Plan Your Day
1. Go to **Today** view
2. Click on tasks from the backlog to plan them for today
3. Tasks will be organized by time

### Organize Your Backlog
1. Go to **Backlog** view
2. See all tasks grouped by deadline type
3. Overdue tasks are highlighted in red

### View Your Week
1. Go to **Calendar** view
2. See your tasks organized by day
3. **Drag & Drop** incomplete tasks to reschedule them to different days
4. Completed tasks show at the bottom of each day column (cannot be dragged)

## Project Structure

```
miniorg/
├── app/
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Main app pages
│   └── api/             # API routes
├── components/
│   ├── ui/              # Reusable UI components
│   ├── tasks/           # Task-related components
│   ├── calendar/        # Calendar components
│   ├── backlog/         # Backlog components
│   └── layout/          # Layout components
├── lib/
│   ├── prisma.ts        # Prisma client
│   ├── auth.ts          # NextAuth configuration
│   └── task-utils.ts    # Task utility functions
├── prisma/
│   └── schema.prisma    # Database schema
└── docs/                # 📚 Documentation
    ├── README.md        # Documentation index
    ├── architecture/    # Architecture documentation
    ├── deployment/      # Deployment guides
    ├── migration/       # Migration history
    └── guides/          # User guides
```

## 📚 Documentation

Pour une documentation complète, consultez le [dossier docs](./docs/README.md) qui contient :
- 🏗️ Documentation d'architecture
- 🚀 Guides de déploiement
- 🔄 Historique des migrations
- 📖 Guides utilisateurs et références

## Deployment

### Cloudflare Workers + D1

**⚡ Le projet est maintenant prêt pour le déploiement sur Cloudflare !**

#### Quick Start

1. **Installer Wrangler CLI** (si pas déjà fait)
```bash
npm install -g wrangler
wrangler login
```

2. **Créer la base D1**
```bash
wrangler d1 create miniorg-production
```
Copiez le `database_id` affiché et mettez-le à jour dans `wrangler.toml`.

3. **Migrer le schéma**
```bash
./scripts/migrate-to-d1.sh miniorg-production
```

4. **Configurer les secrets**
```bash
wrangler secret put AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put AUTH_URL
```

5. **Build et déployer**
```bash
npm run build
npm run deploy
```

6. **Configurer Google OAuth**
Ajoutez l'URI de redirection dans [Google Cloud Console](https://console.cloud.google.com/):
```
https://miniorg.your-subdomain.workers.dev/api/auth/callback/google
```

#### Documentation complète

- 📘 [Guide de déploiement complet](./docs/deployment/DEPLOYMENT.md)
- 🔐 [Configuration Google OAuth](./docs/guides/GOOGLE_OAUTH_SETUP.md)
- 📚 [Toute la documentation](./docs/README.md)

#### Vérification pré-déploiement

Avant de déployer, vérifiez votre configuration :
```bash
npm run build
```

### Alternative : Autres plateformes

Bien que le projet soit optimisé pour Cloudflare, vous pouvez aussi le déployer sur :
- Vercel (avec PostgreSQL ou autre DB)
- Railway
- Render
- Fly.io

Note : Ces plateformes nécessiteront quelques ajustements (retirer `runtime = 'edge'` des API routes).

## Roadmap

- [x] Drag-and-drop task scheduling with Pragmatic DnD
- [ ] Time picker for precise scheduling
- [ ] Markdown editor for task descriptions (Novel)
- [ ] Recurring tasks
- [ ] Calendar integrations (Google Calendar)
- [ ] Weekly/Monthly views
- [ ] Analytics and insights
- [ ] Dark mode
- [ ] Mobile app

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
