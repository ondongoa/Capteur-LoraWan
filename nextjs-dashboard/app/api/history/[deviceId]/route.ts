import { NextRequest, NextResponse } from "next/server";
import { ensureMqttConnected } from "@/lib/ttn-mqtt";
import { getHistory } from "@/lib/ttn-store";

export const dynamic = "force-dynamic";

ensureMqttConnected();

export async function GET(
  request: NextRequest,
  { params }: { params: { deviceId: string } }
) {
  const hours = Number(request.nextUrl.searchParams.get("hours") || "24");
  const data = getHistory(params.deviceId, hours);
  return NextResponse.json(data);
}
