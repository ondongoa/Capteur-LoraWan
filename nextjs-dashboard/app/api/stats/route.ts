import { NextResponse } from "next/server";
import { ensureMqttConnected } from "@/lib/ttn-mqtt";
import { getStats } from "@/lib/ttn-store";

export const dynamic = "force-dynamic";

ensureMqttConnected();

export async function GET() {
  const data = getStats();
  return NextResponse.json(data);
}
