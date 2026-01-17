import { handlers } from "@/lib/auth"

// Remove nodejs runtime - it doesn't work in Cloudflare Workers
// The edge runtime is required for Workers compatibility

export const { GET, POST } = handlers
