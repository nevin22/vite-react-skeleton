import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { Buffer } from 'buffer'; // Import Buffer explicitly

let mqtt_client: MqttClient | null = null;

export const initializeMqttClient = (cb: () => void): void => {
    const clientId: string = 'nevin_mqttjs_' + Math.random().toString(16).substr(2, 8);
    const host: string = 'wss://dev.broker.internal.viana.ai:8084/mqtt';

    const username: string = import.meta.env.VITE_MQTT_USERNAME;   
    const password: string = import.meta.env.VITE_MQTT_PASSWORD;

    const mqttOption: IClientOptions = {
        username,
        password,
        keepalive: 60,
        clientId,
        protocolId: 'MQTT',
        protocolVersion: 4,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000,
        will: {
            topic: 'WillMsg',
            payload: Buffer.from('Connection Closed abnormally..!'),
            qos: 0,
            retain: false,
        },
    };

    try {
        mqtt_client = mqtt.connect(host, mqttOption);
    } catch (error) {
        console.error('error', error);
    }

    return cb();
};

export const getMqttClient = (): MqttClient | null => {
    return mqtt_client;
};