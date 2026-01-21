import { handlers } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

const isTauriBuild = process.env.BUILD_TARGET === "tauri";

// Keep API dynamic for web/Cloudflare; only force-static when exporting for Tauri
export const dynamic = isTauriBuild ? "force-static" : "force-dynamic";
export const dynamicParams = !isTauriBuild;
export async function generateStaticParams() {
  return isTauriBuild ? [] : [];
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
