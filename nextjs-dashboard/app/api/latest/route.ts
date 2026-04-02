import { NextResponse } from "next/server";
import { ensureMqttConnected } from "@/lib/ttn-mqtt";
import { getLatest } from "@/lib/ttn-store";

// Demarre la connexion MQTT au premier appel
ensureMqttConnected();

export async function GET() {
  const data = getLatest();
  return NextResponse.json(data);
}
