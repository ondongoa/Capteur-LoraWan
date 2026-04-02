// Decode le payload 17 bytes du capteur Arduino LoRaWAN
// Format: temp(2) + ADC(2) + NO2(2) + Ethanol(2) + VOC(2) + CO(2) + counter(1) + flags(1) + ledMode(1) + blinkPeriod(1) + ledOutput(1)

export interface DecodedPayload {
  temperature: number | null;
  temperatureAdc: number | null;
  no2: number;
  ethanol: number;
  voc: number;
  co: number;
  counter: number;
  flags: number;
  tempOk: boolean;
  gasOk: boolean;
  gasWarmupDone: boolean;
  ledMode: number;
  blinkPeriodDs: number;
  ledOutput: boolean;
}

function readInt16BE(bytes: number[], index: number): number | null {
  if (bytes.length < index + 2) return null;
  const value = ((bytes[index] & 0xff) << 8) | (bytes[index + 1] & 0xff);
  return value > 0x7fff ? value - 0x10000 : value;
}

function readUInt16BE(bytes: number[], index: number): number | null {
  if (bytes.length < index + 2) return null;
  return ((bytes[index] & 0xff) << 8) | (bytes[index + 1] & 0xff);
}

export function decodePayload(base64: string): DecodedPayload | null {
  try {
    const buf = Buffer.from(base64, "base64");
    const bytes = Array.from(buf);

    if (bytes.length < 17) return null;

    const tempRaw = readInt16BE(bytes, 0);
    const temperature = tempRaw !== null ? tempRaw / 100 : null;
    const temperatureAdc = readUInt16BE(bytes, 2);
    const no2 = readUInt16BE(bytes, 4) || 0;
    const ethanol = readUInt16BE(bytes, 6) || 0;
    const voc = readUInt16BE(bytes, 8) || 0;
    const co = readUInt16BE(bytes, 10) || 0;
    const counter = bytes[12];
    const flags = bytes[13];
    const tempOk = (flags & 0x01) === 0x01;
    const gasOk = (flags & 0x02) === 0x02;
    const gasWarmupDone = (flags & 0x04) === 0x04;
    const ledMode = bytes[14];
    const blinkPeriodDs = bytes[15];
    const ledOutput = bytes[16] === 1;

    return {
      temperature,
      temperatureAdc,
      no2,
      ethanol,
      voc,
      co,
      counter,
      flags,
      tempOk,
      gasOk,
      gasWarmupDone,
      ledMode,
      blinkPeriodDs,
      ledOutput,
    };
  } catch {
    return null;
  }
}

export function qualityLabel(airIndex: number, gasOk: boolean, gasWarmupDone: boolean): string {
  if (!gasOk) return "capteur gaz indisponible";
  if (!gasWarmupDone) return "prechauffage en cours";
  if (airIndex < 1500) return "faible";
  if (airIndex < 5000) return "modere";
  if (airIndex < 15000) return "eleve";
  return "critique";
}
