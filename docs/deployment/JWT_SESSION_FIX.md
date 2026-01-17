# Fix: JWT Sessions pour Cloudflare Workers

## Problème rencontré

Lors du déploiement sur Cloudflare Workers, l'erreur suivante apparaissait lors de l'authentification Google :

```
Error: [unenv] fs.readdir is not implemented yet!
AdapterError: Read more at https://errors.authjs.dev#adaptererror
```

## Cause racine

1. **PrismaAdapter utilise le système de fichiers** : `@auth/prisma-adapter` essaie de lire le schéma Prisma via `fs.readdir` au runtime
2. **Cloudflare Workers = Edge Runtime** : Pas d'accès au système de fichiers (`fs`) comme dans Node.js
3. **`runtime = 'nodejs'` ne fonctionne pas** : Même en forçant le runtime Node.js dans le route handler, Workers ne peut pas exécuter du code Node.js pur

## Solution : JWT Sessions

Au lieu d'utiliser des sessions en base de données avec `PrismaAdapter`, on utilise des **sessions JWT** qui sont compatibles avec Edge Runtime.

### Avantages des JWT sessions

- ✅ **Compatible Workers** : Pas besoin de `fs` ou de modules Node.js
- ✅ **Performant** : Pas de requête DB à chaque requête
- ✅ **Scalable** : Pas de stockage de session côté serveur
- ✅ **Stateless** : Le token contient toutes les infos

### Inconvénients

- ⚠️ **Pas de révocation instantanée** : Les tokens sont valides jusqu'à expiration
- ⚠️ **Taille** : Le token contient les données utilisateur (limité à ~4kb)
- ⚠️ **Pas de gestion des comptes** : Pas de stockage automatique des utilisateurs en DB

## Changements effectués

### 1. Route handler (`app/api/auth/[...nextauth]/route.ts`)

**Avant** :
```typescript
export const runtime = 'nodejs' // ❌ Ne fonctionne pas dans Workers
```

**Après** :
```typescript
// Removed - edge runtime is used by default
```

### 2. Configuration NextAuth (`lib/auth.ts`)

**Avant** :
```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(getPrisma()), // ❌ Utilise fs
  session: {
    strategy: "database", // ❌ Nécessite l'adapter
  },
  // ...
})
```

**Après** :
```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  // ✅ Pas d'adapter - JWT uniquement
  session: {
    strategy: "jwt", // ✅ Compatible Workers
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Stocke les infos user dans le token JWT
      if (account && profile) {
        token.id = profile.sub
        token.email = profile.email
        token.name = profile.name
        token.picture = profile.picture
      }
      return token
    },
    async session({ session, token }) {
      // Copie les infos du token vers la session
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
})
```

## Gestion des utilisateurs

### Option 1 : Sync manuelle lors du sign-in

Si vous voulez quand même stocker les utilisateurs en DB, ajoutez dans le callback `jwt` :

```typescript
async jwt({ token, account, profile }) {
  if (account && profile) {
    // Save user to database on first sign in
    const prisma = getPrisma()
    await prisma.user.upsert({
      where: { email: profile.email },
      update: {
        name: profile.name,
        image: profile.picture,
      },
      create: {
        email: profile.email!,
        name: profile.name,
        image: profile.picture,
        emailVerified: new Date(),
      },
    })
    
    token.id = profile.sub
    token.email = profile.email
    token.name = profile.name
    token.picture = profile.picture
  }
  return token
}
```

### Option 2 : Utiliser un webhook/API route

Créer un endpoint qui synchronise les users depuis le JWT lors de la première connexion.

## Variables d'environnement requises

Pour que JWT fonctionne, vous devez définir :

```bash
# Auth secret (32+ caractères aléatoires)
wrangler secret put AUTH_SECRET

# URL de l'application
wrangler secret put AUTH_URL
# Valeur : https://miniorg.antoine-hervet.workers.dev

# Credentials Google OAuth
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

## Testing

1. **Build** :
   ```bash
   npm run build:worker
   ```

2. **Deploy** :
   ```bash
   npm run deploy
   ```

3. **Test login** :
   - Aller sur `https://miniorg.antoine-hervet.workers.dev`
   - Cliquer sur "Sign in with Google"
   - ✅ Devrait fonctionner sans erreur `fs.readdir`

## Références

- [NextAuth JWT Sessions](https://next-auth.js.org/configuration/options#session)
- [Cloudflare Workers Limitations](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
- [NextAuth Edge Compatibility](https://authjs.dev/guides/edge-compatibility)
