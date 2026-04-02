# IoT Air Quality Monitor - LoRaWAN

Surveillance qualite de l'air interieur avec capteur GMXXX (NO2, Ethanol, VOC, CO) + temperature Grove v1.2, via LoRaWAN / TTN.

## Architecture

```
[Arduino R4 + GMXXX + Temp]  --LoRa-E5-HF-->  [TTN]  --MQTT-->  [Node-RED + Dashboard]  --REST API-->  [Next.js App]
         PC capteurs                                               192.168.141.154:1880                  Ton PC
```

## Composants

### Arduino (deja en place)
- Arduino UNO WiFi R4 + LoRa-E5-HF (lib SylvainMontagny/LoRaE5)
- Grove Gas Sensor V2 (GMXXX) - I2C : NO2, Ethanol, VOC, CO
- Grove Temperature Sensor V1.2 - A0
- Payload 17 bytes, Class C, OTAA, EU868

### Node-RED (192.168.141.154:1880)
- Flow existant avec dashboard complet (hero, gauges, charts, LED control, debug)
- **A ajouter** : les endpoints API REST dans `node-red/api-endpoints-to-add.json`

### Next.js Dashboard (ton PC)
- App client qui interroge l'API Node-RED toutes les 5-15 secondes
- Affiche : temperature, NO2, Ethanol, VOC, CO, air index, alertes, historique

## Installation

### 1. Ajouter les endpoints API a Node-RED

Dans Node-RED (http://192.168.141.154:1880) :

1. Menu hamburger > Import > Coller le contenu de `node-red/api-endpoints-to-add.json`
2. **Connecter la sortie 10** (heroPayload) du noeud "Normaliser la telemetrie" au noeud "Stocker pour API"
3. Deploy
4. Tester : http://192.168.141.154:1880/api/stats

**Important** : Ouvrir le port 1880 dans le pare-feu du PC Node-RED si ce n'est pas deja fait.

### 2. Lancer l'app Next.js

```bash
cd nextjs-dashboard
npm install
npm run dev
```

L'app sera sur http://localhost:3000 et interrogera Node-RED sur 192.168.141.154:1880.

## API REST (ajoutees a Node-RED)

| Endpoint | Description |
|---|---|
| GET /api/latest | Dernieres valeurs par capteur |
| GET /api/history/:deviceId?hours=24 | Historique |
| GET /api/stats | Nombre messages, alertes, devices |
