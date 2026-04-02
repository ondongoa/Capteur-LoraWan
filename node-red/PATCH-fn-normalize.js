// =====================================================
// PATCH: Ajouter ces lignes a la FIN du code de
// "Normaliser la telemetrie" (fn_normalize),
// juste AVANT la ligne "return outputs;"
// =====================================================

// --- Stockage API pour Next.js ---
var apiDevices = flow.get('api_devices') || {};
apiDevices[deviceId] = {
    deviceId: deviceId,
    timestamp: new Date().toISOString(),
    temperature: temperature !== null ? Number(temperature.toFixed(2)) : 0,
    temperatureAdc: temperatureAdc !== null ? String(temperatureAdc) : 'n/a',
    no2: gasNo2 || 0,
    ethanol: gasEthanol || 0,
    voc: gasVoc || 0,
    co: gasCo || 0,
    airQuality: airQuality,
    warmup: gasWarmupDone ? 'termine' : 'en cours',
    ledText: actualLedText,
    rssi: bestRssi !== null ? (bestRssi + ' dBm') : 'n/a',
    snr: bestSnr !== null ? (bestSnr.toFixed(1) + ' dB') : 'n/a',
    alerts: alerts.length ? alerts.join(' | ') : 'RAS'
};
flow.set('api_devices', apiDevices);

var apiHistory = flow.get('api_history_' + deviceId) || [];
apiHistory.push(apiDevices[deviceId]);
if (apiHistory.length > 2000) apiHistory = apiHistory.slice(-2000);
flow.set('api_history_' + deviceId, apiHistory);

var apiStats = flow.get('api_stats') || { totalMessages: 0, totalAlerts: 0 };
apiStats.totalMessages++;
if (alerts.length > 0) apiStats.totalAlerts++;
flow.set('api_stats', apiStats);
// --- Fin stockage API ---

// return outputs;  <-- cette ligne existe deja
