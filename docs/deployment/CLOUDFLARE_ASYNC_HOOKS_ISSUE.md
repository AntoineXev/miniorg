# Cloudflare async_hooks - Workaround

## Problème

L'erreur `No such module "async_hooks"` persiste sur Cloudflare Pages malgré les efforts de migration car:

1. **Next.js lui-même** importe `async_hooks` dans son runtime Edge
2. `@cloudflare/next-on-pages` ne supporte pas complètement `async_hooks` même avec `nodejs_compat`
3. C'est une limitation de l'architecture, pas de notre code

## Solutions possibles

### Option 1: Mise à jour de la `compatibility_date` (À TESTER)

J'ai mis à jour `wrangler.toml` avec une date plus récente (2025-01-01). Les versions récentes de Cloudflare Workers supportent mieux `async_hooks`.

```toml
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]
```

**À tester**: Déployer et voir si l'erreur disparaît.

### Option 2: Migrer vers `@opennextjs/cloudflare` (Recommandé si Option 1 échoue)

`@opennextjs/cloudflare` est le nouveau standard pour Next.js sur Cloudflare et supporte mieux les modules Node.js.

**Avantages**:
- Support complet de `async_hooks`
- Meilleures performances
- Maintenu activement par Cloudflare

**Inconvénients**:
- Nécessite une reconfiguration du build
- Changements dans le déploiement

### Option 3: Désactiver le middleware (Non recommandé)

Supprimer la protection middleware et gérer l'auth uniquement côté client. **Pas sécurisé**.

## Code actuel

Le code a été optimisé pour utiliser le minimum de dépendances dans le middleware:
- `lib/auth-middleware.ts` - Décodage JWT simple sans bibliothèques lourdes
- Pas de Better Auth dans le middleware
- Pas de Prisma dans le middleware

Mais Next.js import e toujours `async_hooks` dans son propre runtime.

## Recommandation

1. **Immédiat**: Tester avec la nouvelle `compatibility_date`
2. **Si échec**: Migrer vers `@opennextjs/cloudflare`
3. **Alternative**: Contacter Cloudflare Support pour confirmer le support d'`async_hooks` avec Next.js 16

## Liens utiles

- [OpenNext Cloudflare](https://opennext.js.org/cloudflare)
- [Cloudflare compatibility_date](https://developers.cloudflare.com/workers/configuration/compatibility-dates/)
- [Cloudflare Node.js compatibility](https://developers.cloudflare.com/workers/runtime-apis/nodejs/)
