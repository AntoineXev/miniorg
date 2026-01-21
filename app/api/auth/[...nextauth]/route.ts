import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const isTauriBuild = process.env.BUILD_TARGET === "tauri";

// For static export (Tauri builds), provide empty params so the catch-all
// route does not block `output: export`.
export const dynamic = "force-static";
export const dynamicParams = false;
export async function generateStaticParams() {
  return [];
}

export async function GET(req: NextRequest) {
  if (isTauriBuild) {
    return NextResponse.json(
      { error: "NextAuth route disabled in Tauri static export" },
      { status: 404 },
    );
  }
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  if (isTauriBuild) {
    return NextResponse.json(
      { error: "NextAuth route disabled in Tauri static export" },
      { status: 404 },
    );
  }
  return handlers.POST(req);
}
