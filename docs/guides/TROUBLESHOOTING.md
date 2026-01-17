# Troubleshooting - Erreurs communes

## Erreur : `npm ci` - package.json et package-lock.json non synchronisés

### Symptôme
```
npm error `npm ci` can only install packages when your package.json 
and package-lock.json are in sync.
npm error Missing: solid-js@1.9.10 from lock file
npm error Missing: seroval@1.3.2 from lock file
...
```

### Cause
Le `package-lock.json` n'est pas synchronisé avec `package.json`, souvent après avoir installé des packages avec `--legacy-peer-deps`.

### Solution

**En local** :
```bash
rm package-lock.json
npm install --legacy-peer-deps
git add package-lock.json
git commit -m "fix: regenerate package-lock.json with legacy-peer-deps"
git push
```

**Dans Cloudflare Dashboard** :
Modifiez la commande de build :
- ❌ `npm run pages:build`
- ✅ `npm install --legacy-peer-deps && npm run pages:build`

Allez dans : Pages > miniorg > Settings > Builds & deployments > Edit configurations

---

## Erreur : "It looks like you've run a Workers-specific command in a Pages project"

### Symptôme
```
✘ [ERROR] It looks like you've run a Workers-specific command in a Pages project.
```

### Cause
Utilisation d'une commande Workers au lieu d'une commande Pages.

### Solution

**Mauvaises commandes (Workers)** :
```bash
wrangler secret put NEXTAUTH_SECRET          ❌
wrangler deploy                              ❌
wrangler tail                                ❌
```

**Bonnes commandes (Pages)** :
```bash
wrangler pages secret put NEXTAUTH_SECRET --project-name=miniorg  ✅
wrangler pages deploy .vercel/output/static --project-name=miniorg ✅
wrangler pages deployment tail                                     ✅
```

**Ou utilisez le Dashboard** (recommandé pour les secrets).

---

## Erreur : "DB binding not found"

### Symptôme
```
Error: D1 database binding not found. Make sure DB is configured in wrangler.toml
```

### Cause
Le binding D1 n'est pas configuré correctement.

### Solution

**Vérifiez `wrangler.toml`** :
```toml
[[d1_databases]]
binding = "DB"
database_name = "miniorg-production"
database_id = "votre-vrai-database-id"  # Pas "REPLACE_WITH..."
```

**Obtenez le database_id** :
```bash
wrangler d1 list
```

**Dans le Dashboard** :
Pages > miniorg > Settings > Functions > D1 database bindings
- Variable name: `DB`
- D1 database: Sélectionnez votre base

---

## Erreur : Google OAuth "redirect_uri_mismatch"

### Symptôme
```
Error 400: redirect_uri_mismatch
The redirect URI in the request does not match the authorized redirect URIs
```

### Cause
L'URI de callback n'est pas configuré dans Google Cloud Console.

### Solution

1. Allez sur https://console.cloud.google.com/apis/credentials
2. Sélectionnez votre OAuth Client ID
3. Dans "Authorized redirect URIs", ajoutez :
   ```
   https://miniorg.pages.dev/api/auth/callback/google
   https://votre-domaine-custom.com/api/auth/callback/google
   ```
4. **Attention** : L'URI doit être EXACTEMENT le même (pas d'espace, pas de slash à la fin)
5. Sauvegardez et attendez quelques minutes pour la propagation

**Vérifiez aussi** :
```bash
# Via Dashboard ou CLI
wrangler pages secret list --project-name=miniorg

# NEXTAUTH_URL doit correspondre à votre URL déployée
```

---

## Erreur : Build échoue avec "Cannot find module 'next'"

### Symptôme
```
Error: Cannot find module 'next'
```

### Cause
Dépendances pas installées ou cache corrompu.

### Solution

**En local** :
```bash
rm -rf node_modules .next .vercel
npm install --legacy-peer-deps
npm run pages:build
```

**Dans Cloudflare Dashboard** :
1. Pages > miniorg > Deployments
2. Retry deployment (avec le bouton "Retry deployment")
3. Si ça échoue encore, dans Settings > Builds :
   - Cochez "Clear build cache"
   - Retry

---

## Erreur : "Invalid token" ou "Unauthorized" lors de l'auth

### Symptôme
L'utilisateur ne peut pas se connecter ou est déconnecté immédiatement.

### Cause
`NEXTAUTH_SECRET` manquant ou mal configuré.

### Solution

**Générez un nouveau secret** :
```bash
openssl rand -base64 32
```

**Configurez-le** :
- Via Dashboard : Pages > miniorg > Settings > Environment variables
  - Name: `NEXTAUTH_SECRET`
  - Value: (collez le secret généré)
  - Type: **Encrypt** ✅

- Ou via CLI :
```bash
wrangler pages secret put NEXTAUTH_SECRET --project-name=miniorg
```

**Redéployez** :
```bash
wrangler pages deploy .vercel/output/static --project-name=miniorg
```

---

## Erreur : "No such module async_hooks"

### Symptôme
```
Error: No such module "__next-on-pages-dist__/functions/async_hooks".
  imported from "__next-on-pages-dist__/functions/middleware.func.js"
```

L'application se déploie mais crash avec une erreur 500 mentionnant `async_hooks`.

### Cause
Le module `async_hooks` est un module Node.js natif qui **n'est pas disponible** dans l'Edge Runtime de Cloudflare, même avec le flag `nodejs_compat`. Cette erreur se produit généralement quand :
- Le middleware utilise `auth()` de NextAuth v5, qui utilise `async_hooks` en interne
- D'autres bibliothèques utilisent des APIs Node.js non supportées

### Solution

**Dans le middleware** : Utilisez `getToken()` au lieu de `auth()` :

```typescript
// ❌ MAUVAIS - auth() utilise async_hooks
import { auth } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  // ...
}

// ✅ BON - getToken() est compatible Edge Runtime
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const isAuthenticated = !!token;
  // ...
}
```

**Note importante** : Dans les routes API ou les Server Components (pas le middleware), vous **pouvez** utiliser `auth()` car elles s'exécutent dans l'Edge Runtime avec plus de capacités.

---

## Erreur : "Node.JS Compatibility Error: no nodejs_compat compatibility flag set"

### Symptôme
```
Node.JS Compatibility Error
no nodejs_compat compatibility flag set
```

L'application se déploie correctement mais crash au runtime avec cette erreur.

### Cause
Cloudflare Pages a besoin du flag de compatibilité `nodejs_compat` pour supporter les APIs Node.js utilisées par Next.js et ses dépendances.

### Solution

**Méthode 1 : Via wrangler.toml (RECOMMANDÉ)** :

Vérifiez que votre `wrangler.toml` contient :
```toml
name = "miniorg"
compatibility_date = "2024-01-17"
pages_build_output_dir = ".vercel/output/static"

# Compatibility flags for Node.js APIs (IMPORTANT!)
compatibility_flags = ["nodejs_compat"]
```

Puis commit et push pour redéployer :
```bash
git add wrangler.toml
git commit -m "fix: add nodejs_compat compatibility flag"
git push
```

**Méthode 2 : Via le Dashboard Cloudflare** :

1. Allez sur https://dash.cloudflare.com
2. Pages > miniorg > Settings > Functions
3. Scroll jusqu'à "Compatibility flags"
4. Cliquez sur "Add flag"
5. Ajoutez : `nodejs_compat`
6. Sauvegardez
7. Redéployez votre application

**Vérification** :
Après le déploiement, visitez votre site. L'erreur ne devrait plus apparaître.

---

## Erreur : Edge Runtime incompatibility

### Symptôme
```
Error: The edge runtime does not support Node.js 'fs' module
```

### Cause
Utilisation d'APIs Node.js dans le code Edge Runtime.

### APIs interdites en Edge Runtime
- ❌ `fs`, `path`, `os`
- ❌ `process.cwd()`
- ❌ Node.js `crypto` (utilisez Web Crypto)
- ❌ Node.js streams

### APIs autorisées
- ✅ `fetch`
- ✅ Web APIs (URL, FormData, etc.)
- ✅ `crypto.subtle` (Web Crypto API)
- ✅ Prisma avec D1 adapter

### Solution
Remplacez les APIs Node.js par leurs équivalents Web ou déplacez le code côté client.

---

## Erreur : Build timeout

### Symptôme
```
Error: Build exceeded maximum time of 20 minutes
```

### Cause
Build trop long, souvent dû à des dépendances lourdes ou problèmes réseau.

### Solution

**Optimisez les dépendances** :
```bash
# Supprimez les dépendances inutilisées
npm prune

# Vérifiez la taille du build
npm run pages:build
ls -lh .vercel/output/static/_worker.js/
```

**Si le problème persiste** :
Contactez le support Cloudflare (le tier gratuit a normalement des limites plus souples).

---

## Erreur : D1 "table not found"

### Symptôme
```
Error: no such table: Task
```

### Cause
Le schéma n'a pas été migré vers D1.

### Solution

**Migrez le schéma** :
```bash
./scripts/migrate-to-d1.sh miniorg-production
```

**Ou manuellement** :
```bash
cat prisma/migrations/*/migration.sql > prisma/combined-migration.sql
wrangler d1 execute miniorg-production --file=prisma/combined-migration.sql
```

**Vérifiez** :
```bash
wrangler d1 execute miniorg-production --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

## Besoin d'aide ?

1. **Logs en temps réel** :
   ```bash
   wrangler pages deployment tail
   ```

2. **Vérification pré-déploiement** :
   ```bash
   ./scripts/verify-deployment-ready.sh
   ```

3. **Liste des secrets** :
   ```bash
   wrangler pages secret list --project-name=miniorg
   ```

4. **État de la base D1** :
   ```bash
   wrangler d1 execute miniorg-production --command="SELECT COUNT(*) FROM User"
   ```

5. **Dashboard Cloudflare** :
   https://dash.cloudflare.com > Pages > miniorg > Logs

---

## Checklist de debug

Quand quelque chose ne fonctionne pas :

- [ ] Les dépendances sont installées : `npm install --legacy-peer-deps`
- [ ] Le build local fonctionne : `npm run pages:build`
- [ ] Le `database_id` est correct dans `wrangler.toml`
- [ ] Le flag `nodejs_compat` est présent dans `wrangler.toml`
- [ ] Les 4 secrets sont configurés (NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, etc.)
- [ ] Le binding D1 est configuré (variable `DB`)
- [ ] Google OAuth redirect URIs sont corrects
- [ ] `package-lock.json` est committé
- [ ] Les logs Cloudflare sont consultés

---

Si aucune de ces solutions ne fonctionne, consultez les logs détaillés :
```bash
wrangler pages deployment tail --project-name=miniorg
```
