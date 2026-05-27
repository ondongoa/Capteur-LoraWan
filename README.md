# IoT Air  Monitor - LoRaWAN

Surveillance qualite de l'air interieur avec capteur GMXXX (NO2, Ethanol, VOC, CO) + temperature Grove v1.2, via LoRaWAN / TTN.

## Architecture

```
[Arduino R4 + GMXXX + Temp]  --LoRa-E5-HF-->  [TTN]  --MQTT-->  [Node-RED + Dashboard]  --REST API-->  [Next.js App]
         PC capteurs                                               192.168.141.154:1880                   sur aws http://54.242.158.223:3000
 
         
```

## Composants

### Arduino 
- Arduino UNO WiFi R4 + LoRa-E5-HF (lib SylvainMontagny/LoRaE5)
- Grove Gas Sensor V2 (GMXXX) - I2C : NO2, Ethanol, VOC, CO
- Grove Temperature Sensor V1.2 - A0
- Payload 17 bytes, Class C, OTAA, EU868

### Node-RED (192.168.141.154:1880)
- Flow existant avec dashboard complet (hero, gauges, charts, LED control, debug)`

### Next.js Dashboard (ton PC)
- App client qui interroge l'API Node-RED toutes les 5-15 secondes
- Affiche : temperature, NO2, Ethanol, VOC, CO, air index, alertes, historique

## Installation

### 1. Ajouter les endpoints API a Node-RED

Dans Node-RED (http://192.168.141.154:1880) :


**Important** : Ouvrir le port 1880 dans le pare-feu du PC Node-RED 

### 2. Lancer l'app Next.js

```bash
cd nextjs-dashboard
npm install
npm run dev
```

L'app sera sur http://54.242.158.223:3000

## API REST 

| Endpoint | Description |
|---|---|
| GET /api/latest | Dernieres valeurs par capteur |
| GET /api/history/:deviceId?hours=24 | Historique |
| GET /api/stats | Nombre messages, alertes, devices |
