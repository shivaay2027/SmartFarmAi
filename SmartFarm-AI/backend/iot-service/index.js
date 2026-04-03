const mqtt = require('mqtt');
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MQTT Broker (EMQX)
const client = mqtt.connect(process.env.MQTT_BROKER || 'mqtt://emqx:1883');

// Connect to MongoDB
mongoose.connect('mongodb://mongodb:27017/smartfarm_iot', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('farms/+/sensors/#', (err) => {
        if (!err) {
            console.log('Subscribed to all farm sensors');
        }
    });
});

client.on('message', (topic, message) => {
    // Topic format: farms/{farmId}/sensors/{sensorId}/tx
    console.log(`Received telemetry on ${topic}:`, message.toString());
    // TODO: Store in MongoDB Document telemetry collection
    // TODO: Update Redis hash with latest values for real-time dashboards
});

app.get('/health', (req, res) => res.send('IoT Service OK'));

app.listen(port, () => console.log(`IoT service running on ${port}`));
