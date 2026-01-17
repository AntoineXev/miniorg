# NextAuth v5 Configuration - Production Ready

## ✅ Configuration Complète et Robuste

### 1. **Configuration NextAuth (`lib/auth.ts`)**

```typescript
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { getPrisma } from "@/lib/prisma"

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(getPrisma()),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  trustHost: true, // IMPORTANT pour Cloudflare Workers
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
  },
})
```

**Points clés :**
- ✅ `trustHost: true` - Nécessaire pour Cloudflare Workers (gère différents domaines)
- ✅ `session.strategy: "database"` - Sessions stockées dans D1 via Prisma
- ✅ Authorization params pour Google OAuth (refresh token, offline access)
- ✅ Session callback ajoute `user.id` pour les API routes

---

### 2. **Routes API (`app/api/auth/[...nextauth]/route.ts`)**

```typescript
import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
```

**Notes :**
- ✅ Pas besoin de `export const runtime = 'edge'` avec OpenNext Cloudflare
- ✅ OpenNext gère automatiquement le runtime pour Workers

---

### 3. **Middleware (`middleware.ts`)**

```typescript
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isAuthenticated = !!req.auth
  const pathname = req.nextUrl.pathname

  // Protect dashboard routes
  if (pathname.startsWith("/backlog") || pathname.startsWith("/calendar")) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  // Redirect to dashboard if already logged in
  if (pathname === "/login" && isAuthenticated) {
    return NextResponse.redirect(new URL("/backlog", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

**Points clés :**
- ✅ Utilise `auth()` wrapper de NextAuth pour le middleware
- ✅ Protection automatique des routes dashboard
- ✅ Redirection automatique si déjà authentifié

---

### 4. **Client Components (`lib/auth-client.ts`)**

```typescript
"use client"

export { useSession } from "next-auth/react"
export { signIn, signOut } from "next-auth/react"
```

**Usage dans les composants :**

```typescript
import { useSession, signOut } from "@/lib/auth-client"

function MyComponent() {
  const { data: session } = useSession()
  
  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" })
  }
  
  return <div>{session?.user?.name}</div>
}
```

---

### 5. **SessionProvider (`app/layout.tsx`)**

```typescript
import { Providers } from "@/components/providers/session-provider"

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

**Provider component (`components/providers/session-provider.tsx`):**

```typescript
"use client"

import { SessionProvider } from "next-auth/react"

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

---

### 6. **API Routes Protection**

Dans toutes les API routes (`app/api/*/route.ts`) :

```typescript
import { auth } from "@/lib/auth"
import { getPrisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const userId = session.user.id
  const prisma = getPrisma()
  
  // Votre logique ici
}
```

**Points clés :**
- ✅ Toujours vérifier `session?.user?.id`
- ✅ Utiliser `getPrisma()` pour compatibilité D1/SQLite
- ✅ Filtrer par `userId` pour la sécurité

---

### 7. **TypeScript Types (`types/next-auth.d.ts`)**

```typescript
import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
    } & DefaultSession["user"]
  }
}
```

---

### 8. **Variables d'Environnement**

**Local (`.env`) :**
```bash
DATABASE_URL="file:./prisma/dev.db"
AUTH_SECRET="generate-with-openssl-rand-base64-32"
AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

**Production (Cloudflare Workers) :**
```bash
# Configurer via wrangler CLI
wrangler secret put AUTH_SECRET
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET

# Ou ajouter AUTH_URL en variable d'environnement
wrangler secret put AUTH_URL
# Valeur: https://miniorg.your-domain.workers.dev
```

**Variables nécessaires :**
- ✅ `AUTH_SECRET` - Secret pour JWT/cookies (NextAuth v5)
- ✅ `AUTH_URL` - URL complète de l'app
- ✅ `GOOGLE_CLIENT_ID` - OAuth client ID
- ✅ `GOOGLE_CLIENT_SECRET` - OAuth client secret
- ✅ `DB` - Binding D1 (configuré dans wrangler.toml)

---

### 9. **Schéma Prisma**

Les modèles NextAuth sont déjà configurés :
- ✅ `User` - Utilisateurs avec sessions et accounts
- ✅ `Account` - Comptes OAuth (Google, etc.)
- ✅ `Session` - Sessions avec strategy "database"
- ✅ `VerificationToken` - Tokens de vérification email

**Relation avec vos modèles :**
```prisma
model User {
  tasks          Task[]
  tags           Tag[]
  calendarEvents CalendarEvent[]
  // ... autres relations
}
```

---

### 10. **Pre-rendering Désactivé pour Routes Protégées**

Dans `app/(dashboard)/layout.tsx` :
```typescript
export const dynamic = 'force-dynamic'
```

Cela évite les erreurs de pre-rendering lors du build car `useSession()` nécessite un contexte runtime.

---

## 🚀 Déploiement Cloudflare Workers

### Build et Deploy

```bash
# Build pour Workers
npm run build:worker

# Preview local
npm run preview

# Deploy
npm run deploy
```

### Checklist Pré-Déploiement

- ✅ Secrets configurés dans Cloudflare
- ✅ D1 database créée et binding configuré
- ✅ Google OAuth redirect URI ajouté : `https://your-domain.workers.dev/api/auth/callback/google`
- ✅ AUTH_URL pointant vers votre domaine Workers
- ✅ Migrations Prisma appliquées à D1

---

## 🔒 Sécurité

### Points Vérifiés

1. ✅ **CSRF Protection** - Intégrée dans NextAuth
2. ✅ **Session Database** - Révocation possible côté serveur
3. ✅ **API Protection** - Toutes les routes vérifient la session
4. ✅ **User Isolation** - Filtrage par `userId` partout
5. ✅ **Trust Host** - Configuré pour Workers multi-domaines

---

## 📝 Différences vs Better Auth

| Aspect | Better Auth | NextAuth v5 |
|--------|-------------|-------------|
| Configuration | Plus complexe | Plus simple |
| Session | JWT uniquement | Database + JWT |
| OAuth | Config manuelle | Providers intégrés |
| TypeScript | Types custom | Types officiels |
| Workers | Nécessite edge runtime | Fonctionne automatiquement |
| Middleware | Custom wrapper | Wrapper intégré |

---

## ✅ Tests de Validation

1. **Login Flow**
   - ✅ Redirection vers Google OAuth
   - ✅ Création compte + session en DB
   - ✅ Redirection vers /backlog

2. **Protected Routes**
   - ✅ /calendar → redirect si non-auth
   - ✅ /backlog → redirect si non-auth
   - ✅ /login → redirect vers /backlog si auth

3. **API Routes**
   - ✅ GET /api/tasks → 401 si non-auth
   - ✅ POST /api/tasks → créé avec userId correct
   - ✅ Isolation utilisateurs

4. **Logout**
   - ✅ Session supprimée de DB
   - ✅ Redirection vers /login
   - ✅ Accès protégé bloqué

---

## 🎯 Configuration Production-Ready

La configuration actuelle est **robuste et production-ready** pour Cloudflare Workers :

- ✅ Pas de dépendances better-auth restantes
- ✅ NextAuth v5 avec database sessions
- ✅ Protection middleware complète
- ✅ TypeScript types corrects
- ✅ Variables d'environnement documentées
- ✅ TrustHost configuré pour Workers
- ✅ Google OAuth avec refresh tokens
- ✅ Prisma adapter pour D1/SQLite
- ✅ Pre-rendering désactivé sur routes protégées

**Status : PRÊT POUR LA PRODUCTION 🚀**
