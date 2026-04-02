// Client MQTT singleton qui se connecte a TTN et decode les uplinks
import mqtt from "mqtt";
import { decodePayload, qualityLabel } from "./decode-payload";
import { pushReading } from "./ttn-store";
import type { Reading } from "./api";

const globalForMqtt = globalThis as unknown as { __ttnMqtt?: mqtt.MqttClient };

function buildLedText(mode: number, periodDs: number, ledOn: boolean): string {
  if (mode === 2) return `LED clignote | ${periodDs * 100} ms`;
  return `LED ${ledOn ? "allumee" : "eteinte"}`;
}

export function ensureMqttConnected() {
  if (globalForMqtt.__ttnMqtt) return; // deja connecte

  const url = process.env.TTN_MQTT_URL;
  const appId = process.env.TTN_APP_ID;
  const apiKey = process.env.TTN_API_KEY;

  if (!url || !appId || !apiKey) {
    console.error("[TTN] Variables manquantes: TTN_MQTT_URL, TTN_APP_ID, TTN_API_KEY");
    return;
  }

  const username = `${appId}@ttn`;
  console.log(`[TTN] Connexion MQTT a ${url} (user: ${username})...`);

  const client = mqtt.connect(url, {
    username,
    password: apiKey,
    clientId: `nextjs-dashboard-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000,
    connectTimeout: 30000,
    rejectUnauthorized: true,
  });

  client.on("connect", () => {
    console.log("[TTN] Connecte au broker MQTT TTN");
    client.subscribe(`v3/${username}/devices/+/up`, (err) => {
      if (err) console.error("[TTN] Erreur subscribe:", err);
      else console.log("[TTN] Abonne aux uplinks");
    });
  });

  client.on("error", (err) => {
    console.error("[TTN] Erreur MQTT:", err.message);
  });

  client.on("message", (_topic, payload) => {
    try {
      const msg = JSON.parse(payload.toString());
      const uplink = msg.uplink_message;
      if (!uplink) return;

      const deviceId =
        msg.end_device_ids?.device_id || "device-inconnu";
      const receivedAt =
        msg.received_at || new Date().toISOString();

      // Essayer decoded_payload d'abord, sinon decoder le frm_payload
      const decoded = uplink.decoded_payload;
      const raw = uplink.frm_payload
        ? decodePayload(uplink.frm_payload)
        : null;

      const temperature =
        decoded?.temperature ?? (raw?.temperature ?? 0);
      const temperatureAdc =
        decoded?.temperature_adc ?? raw?.temperatureAdc ?? 0;
      const no2 =
        decoded?.gas_no2_raw ?? decoded?.gas_no2 ?? raw?.no2 ?? 0;
      const ethanol =
        decoded?.gas_ethanol_raw ??
        decoded?.gas_ethanol ??
        raw?.ethanol ??
        0;
      const voc =
        decoded?.gas_voc_raw ?? decoded?.gas_voc ?? raw?.voc ?? 0;
      const co =
        decoded?.gas_co_raw ?? decoded?.gas_co ?? raw?.co ?? 0;
      const gasOk = decoded?.gas_ok ?? raw?.gasOk ?? true;
      const gasWarmupDone =
        decoded?.gas_warmup_done ?? raw?.gasWarmupDone ?? true;
      const ledMode = decoded?.led_mode_code ?? raw?.ledMode ?? 0;
      const blinkPeriodDs =
        decoded?.blink_period_ms != null
          ? Math.round(decoded.blink_period_ms / 100)
          : (raw?.blinkPeriodDs ?? 10);
      const ledOutput = decoded?.led ?? raw?.ledOutput ?? false;

      const airIndex = Math.max(no2, ethanol, voc, co);
      const airQuality = qualityLabel(airIndex, gasOk, gasWarmupDone);

      // RSSI / SNR
      const rxMeta: Array<{ rssi?: number; snr?: number }> =
        uplink.rx_metadata || [];
      const rssiVals = rxMeta
        .map((m) => m.rssi)
        .filter((v): v is number => v != null);
      const snrVals = rxMeta
        .map((m) => m.snr)
        .filter((v): v is number => v != null);
      const bestRssi = rssiVals.length ? Math.max(...rssiVals) : null;
      const bestSnr = snrVals.length ? Math.max(...snrVals) : null;

      // Alertes
      const alerts: string[] = [];
      if (!gasOk) alerts.push("capteur gaz indisponible");
      if (gasOk && !gasWarmupDone) alerts.push("prechauffage en cours");
      if (temperature >= 35) alerts.push("temperature elevee");
      if (temperature <= 5) alerts.push("temperature basse");
      if (gasOk && gasWarmupDone && airIndex >= 15000)
        alerts.push("niveau gaz critique");
      else if (gasOk && gasWarmupDone && airIndex >= 5000)
        alerts.push("niveau gaz eleve");

      const reading: Reading = {
        deviceId,
        timestamp: receivedAt,
        temperature: Number(temperature.toFixed(2)),
        temperatureAdc: String(temperatureAdc),
        no2,
        ethanol,
        voc,
        co,
        airQuality,
        warmup: gasWarmupDone ? "termine" : "en cours",
        ledText: buildLedText(ledMode, blinkPeriodDs, ledOutput),
        rssi: bestRssi !== null ? `${bestRssi} dBm` : "n/a",
        snr: bestSnr !== null ? `${bestSnr.toFixed(1)} dB` : "n/a",
        alerts: alerts.length ? alerts.join(" | ") : "RAS",
      };

      pushReading(reading);
      console.log(
        `[TTN] Uplink ${deviceId}: temp=${reading.temperature} air=${airQuality}`
      );
    } catch (err) {
      console.error("[TTN] Erreur decode message:", err);
    }
  });

  globalForMqtt.__ttnMqtt = client;
}
