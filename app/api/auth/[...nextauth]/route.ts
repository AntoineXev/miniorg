import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;

// For static export (Tauri builds), provide empty params
export async function generateStaticParams() {
  return [];
}
