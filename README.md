# MiniOrg - Life Planner

A minimal, clean life planner inspired by Sunsama, built with Next.js and designed for modern professionals who want to stay organized without the complexity.

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
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
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
└── prisma/
    └── schema.prisma    # Database schema
```

## Deployment

### Cloudflare Workers

1. Install Wrangler CLI:
```bash
npm install -g wrangler
```

2. Set up D1 database:
```bash
wrangler d1 create miniorg-db
```

3. Update `wrangler.toml` with your D1 database ID

4. Deploy:
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
