// default open-next.config.ts file created by @opennextjs/cloudflare
import { defineCloudflareConfig } from "@opennextjs/cloudflare/config";

export default defineCloudflareConfig({
	// Pas de cache incrémental R2 - utilise le cache par défaut (mémoire)
	// Si vous avez besoin de cache persistant plus tard, vous pouvez:
	// 1. Créer un bucket R2 et utiliser r2IncrementalCache
	// 2. Utiliser Workers KV avec kvIncrementalCache
});
