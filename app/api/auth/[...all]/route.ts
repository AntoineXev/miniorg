import { auth } from "@/lib/auth-better";
import { toNextJsHandler } from "better-auth/next-js";

// Enable Edge Runtime for Cloudflare Workers
export const runtime = 'edge';

// Better Auth handlers - compatible with Edge Runtime
export const { GET, POST } = toNextJsHandler(auth);
