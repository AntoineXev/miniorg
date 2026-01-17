import { handlers } from "@/lib/auth";

// Enable Edge Runtime for Cloudflare Workers
export const runtime = 'edge';

export const { GET, POST } = handlers;
