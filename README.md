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
- **Database:** Prisma 7 + Cloudflare D1
- **Auth:** NextAuth.js v5 with Google OAuth
- **UI:** shadcn/ui + Tailwind CSS
- **Animations:** Framer Motion
- **Deployment:** Cloudflare Workers (free tier compatible)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Wrangler CLI installed (`npm install -g wrangler`)
- Google OAuth credentials ([Get them here](https://console.cloud.google.com/))
- Cloudflare account (for D1 database)

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

3. Set up D1 database (local development):
```bash
# Create a local D1 database (or use production database ID from Cloudflare Dashboard)
wrangler d1 create miniorg-local
```

4. Update `wrangler.toml` with your D1 database ID (for local, you can use the database_id from the command output or leave it empty for local dev)

5. Set up environment variables:
Create a `.dev.vars` file in the root directory (for local development):
```env
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
AUTH_SECRET="your-secret-key-here"
AUTH_URL="http://localhost:8788"
```

6. Generate Prisma client:
```bash
npm run db:generate
```

7. Create and apply database migrations:
```bash
# Create a new migration based on your schema
npm run db:migrate:d1:create <migration_name>

# Apply migration to local D1 database
npm run db:migrate:d1:apply

# Or apply to remote D1 database
npm run db:migrate:d1:apply:remote
```

8. Generate TypeScript types for Cloudflare bindings:
```bash
npm run db:types
```

9. Run the development server:
```bash
# Using OpenNext Cloudflare for local development
npm run dev

# Or using Wrangler for Cloudflare Workers environment
wrangler dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown by wrangler) to see your app.

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
└── prisma/
    └── schema.prisma    # Database schema
```

## Database Management

### Prisma Schema

The database schema is defined in `prisma/schema.prisma`. To modify it:

1. Edit `prisma/schema.prisma`
2. Generate Prisma client: `npm run db:generate`
3. Create a migration: `npm run db:migrate:d1:create <migration_name>`
4. Review the generated SQL in `migrations/` directory
5. Apply migration: `npm run db:migrate:d1:apply` (local) or `npm run db:migrate:d1:apply:remote` (production)

### Local Development with D1

For local development, D1 is automatically available when using `wrangler dev`. The database state is stored locally and persists between runs.

## Deployment

### Cloudflare Workers

1. Ensure Wrangler CLI is installed:
```bash
npm install -g wrangler
```

2. Log in to Cloudflare:
```bash
wrangler login
```

3. Set up D1 database (if not already created):
```bash
wrangler d1 create miniorg-production
```

4. Update `wrangler.toml` with your D1 database ID (already configured in this repo)

5. Apply migrations to production database:
```bash
npm run db:migrate:d1:apply:remote
```

6. Set environment secrets (required for NextAuth):
```bash
wrangler secret put AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put AUTH_URL  # Your production URL, e.g., https://miniorg.your-domain.workers.dev
```

7. Generate TypeScript types for bindings:
```bash
npm run db:types
```

8. Build and deploy:
```bash
npm run build
wrangler deploy
```

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
