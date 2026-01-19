# Architecture du projet MiniOrg

## Structure des dossiers

### `/app`
Routes et pages Next.js suivant la structure App Router.
- `(auth)/` - Pages d'authentification
- `(dashboard)/` - Pages du dashboard (calendrier, backlog, settings)
- `api/` - Routes API Next.js

### `/components`
Composants React réutilisables organisés par domaine.

#### `/components/ui`
Composants UI atomiques et réutilisables (boutons, inputs, dialogs, etc.)

#### `/components/layout`
Composants de mise en page (header, sidebar)

#### `/components/tasks`
Composants spécifiques aux tâches

#### `/components/calendar`
Composants spécifiques au calendrier

#### `/components/backlog`
Composants spécifiques au backlog

### `/lib`
Logique métier, utilities et services **non-React** (code TypeScript pur).

#### `/lib/utils`
Fonctions utilitaires pures
- `common.ts` - Utilities génériques (ex: `cn`)
- `task.ts` - Logique métier pour les tâches
- `calendar.ts` - Logique métier pour le calendrier
- `index.ts` - Re-exports pour faciliter les imports

#### `/lib/services`
Services et clients API
- `api-client.ts` - Client HTTP avec gestion d'erreurs
- `task-events.ts` - Système d'événements pour synchroniser les tâches
- `index.ts` - Re-exports

#### `/lib/auth`
Logique d'authentification
- `auth.ts` - Configuration NextAuth
- `auth-edge.ts` - Utilities pour Edge Runtime

#### `/lib/database`
Gestion de la base de données
- `client.ts` - Client Prisma
- `config.ts` - Configuration
- `/adapters` - Adaptateurs pour différentes bases de données (D1, PostgreSQL, SQLite)

#### `/lib/calendar`
Services calendrier
- `calendar-service.ts` - Service principal
- `token-manager.ts` - Gestion des tokens OAuth
- `types.ts` - Types TypeScript
- `/google` - Intégration Google Calendar

### `/providers`
React Contexts et Providers globaux (code React uniquement).

- `quick-add-task.tsx` - Context pour le modal de création de tâche
- `toast.tsx` - Context pour les notifications toast
- `index.ts` - Re-exports centralisés

### `/types`
Types TypeScript globaux et extensions de types de librairies tierces.

## Conventions d'import

### Imports recommandés

```typescript
// Utilities (via index.ts)
import { cn, getTaskDeadlineGroup, calculateDuration } from "@/lib/utils";

// Ou imports spécifiques si nécessaire
import { cn } from "@/lib/utils/common";
import { getTaskDeadlineGroup } from "@/lib/utils/task";
import { calculateDuration } from "@/lib/utils/calendar";

// Services
import { useApiClient, emitTaskUpdate } from "@/lib/services";

// Providers
import { useQuickAddTask, useToast } from "@/providers";
```

### Règles

1. **`/lib`** = Code non-React uniquement (pas de hooks, pas de JSX)
2. **`/providers`** = React Contexts et hooks personnalisés
3. **`/components`** = Composants React réutilisables
4. Privilégier les imports depuis les fichiers `index.ts` quand ils existent
5. Éviter les imports circulaires

## Séparation des responsabilités

### Logique métier (`/lib`)
- Calculs purs
- Transformations de données
- Appels API
- Utilities génériques

### State management (`/providers`)
- React Context
- State global partagé
- Hooks personnalisés pour accéder au state

### UI (`/components`)
- Présentation
- Interactions utilisateur
- Composition de composants
