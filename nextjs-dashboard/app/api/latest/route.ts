import { NextResponse } from "next/server";
import { ensureMqttConnected } from "@/lib/ttn-mqtt";
import { getLatest } from "@/lib/ttn-store";

export const dynamic = "force-dynamic";

ensureMqttConnected();

export async function GET() {
  const data = getLatest();
  return NextResponse.json(data);
}
