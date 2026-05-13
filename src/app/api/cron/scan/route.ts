import { NextResponse } from "next/server";
import { runScan } from "@/lib/airframes";

async function handler() {
  const result = await runScan();
  return NextResponse.json(result);
}

// QStash sends POST with signature — verify it if signing keys are configured
let postHandler: (req: Request) => Promise<Response>;

if (process.env.QSTASH_CURRENT_SIGNING_KEY) {
  // Dynamic import to avoid build errors when env vars are missing
  const { verifySignatureAppRouter } = await import("@upstash/qstash/nextjs");
  postHandler = verifySignatureAppRouter(handler) as unknown as (req: Request) => Promise<Response>;
} else {
  postHandler = handler;
}

export const POST = postHandler;

// Keep GET for manual triggers (protected by CRON_SECRET)
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runScan();
  return NextResponse.json(result);
}
