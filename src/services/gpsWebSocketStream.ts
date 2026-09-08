// ─────────────────────────────────────────────────────────────
// Real-Time GPS WebSocket / MQTT Transponder Stream Service
// Emulates direct telemetry uplink from 108 ALS Onboard GPS Units
// ─────────────────────────────────────────────────────────────

export interface GpsTelemetryPacket {
  packetId: number;
  timestamp: string;
  vehicleId: string;
  callsign: string;
  coordinates: {
    lat: number;
    lng: number;
    altitudeMeters: number;
  };
  headingDegrees: number;
  speedKmh: number;
  accuracyMeters: number;
  satelliteCount: number;
  hdop: number; // Horizontal Dilution of Precision (< 1.0 is ideal)
  cellularSignalDbm: number;
  latencyMs: number;
  emergencyStatus: {
    sirenActive: boolean;
    greenWaveActive: boolean;
    code3Priority: boolean;
  };
  obdTelemetry: {
    engineRpm: number;
    fuelPercent: number;
    coolantTempC: number;
    oxygenTankBar: number; // Onboard ambulance O2 bottle pressure
  };
}

export type GpsStreamSubscriber = (packet: GpsTelemetryPacket) => void;

class GpsWebSocketStreamService {
  private subscribers: Set<GpsStreamSubscriber> = new Set();
  private isConnected: boolean = false;
  private intervalTimer: number | null = null;
  private packetCounter: number = 1000;
  private currentSpeed: number = 68.4;
  private currentHeading: number = 42.5;
  private currentLat: number = 13.0067;
  private currentLng: number = 80.2023;
  private targetLat: number = 13.0805;
  private targetLng: number = 80.2778;
  private progress: number = 0.25;

  constructor() {
    this.startStreaming();
  }

  public subscribe(callback: GpsStreamSubscriber): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public startStreaming(): void {
    if (this.intervalTimer) return;
    this.isConnected = true;

    // Stream telemetry packets every 850ms (typical emergency transponder rate)
    this.intervalTimer = window.setInterval(() => {
      this.packetCounter++;

      // Progress along corridor
      this.progress = (this.progress + 0.004) % 1.0;
      this.currentLat = 13.0067 + (this.targetLat - 13.0067) * this.progress;
      this.currentLng = 80.2023 + (this.targetLng - 80.2023) * this.progress;

      // Small realistic speed fluctuations
      this.currentSpeed = Math.max(45, Math.min(85, this.currentSpeed + (Math.random() * 6 - 3)));
      this.currentHeading = (this.currentHeading + (Math.random() * 4 - 2) + 360) % 360;

      const packet: GpsTelemetryPacket = {
        packetId: this.packetCounter,
        timestamp: new Date().toISOString(),
        vehicleId: 'TN-01-ALS-049',
        callsign: 'TAMIL NADU 108 ALS UNIT 49',
        coordinates: {
          lat: Number(this.currentLat.toFixed(6)),
          lng: Number(this.currentLng.toFixed(6)),
          altitudeMeters: 14.2 + (Math.random() * 0.8 - 0.4)
        },
        headingDegrees: Number(this.currentHeading.toFixed(1)),
        speedKmh: Number(this.currentSpeed.toFixed(1)),
        accuracyMeters: 1.4,
        satelliteCount: 16,
        hdop: 0.78,
        cellularSignalDbm: -68, // Excellent 5G NR signal
        latencyMs: Math.floor(11 + Math.random() * 6),
        emergencyStatus: {
          sirenActive: true,
          greenWaveActive: true,
          code3Priority: true
        },
        obdTelemetry: {
          engineRpm: 2450 + Math.floor(Math.random() * 120),
          fuelPercent: 82.4,
          coolantTempC: 88.5,
          oxygenTankBar: 182 // High-pressure manifold bar
        }
      };

      this.subscribers.forEach(sub => {
        try {
          sub(packet);
        } catch (err) {
          console.error('Error delivering GPS telemetry packet:', err);
        }
      });
    }, 850);
  }

  public stopStreaming(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    this.isConnected = false;
  }
}

export const gpsStreamService = new GpsWebSocketStreamService();
