# API Examples

This document provides detailed examples for all API endpoints and Socket.IO events.

## Table of Contents
- [User Authentication](#user-authentication)
- [Device Management](#device-management)
- [Event Processing](#event-processing)
- [Socket.IO Examples](#socketio-examples)

---

## User Authentication

### Register a New User

**cURL:**
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "secure123",
    "name": "Alice"
  }'
```

**JavaScript (Axios):**
```javascript
const axios = require('axios');

const response = await axios.post('http://localhost:3000/api/users/register', {
  username: 'alice',
  password: 'secure123',
  name: 'Alice'
});

console.log('User:', response.data.data.user);
console.log('Token:', response.data.data.token);
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid-v4",
      "username": "alice",
      "name": "Alice",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login User

**cURL:**
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "alice",
    "password": "secure123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid-v4",
      "username": "alice",
      "name": "Alice",
      "role": "USER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Current User Info

**cURL:**
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Device Management

### Register ESP32 Device

**cURL:**
```bash
curl -X POST http://localhost:3000/api/devices/register \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ESP32_SHYRA_01",
    "deviceType": "ESP32",
    "name": "SHYRA Main Robot",
    "metadata": {
      "firmware": "v1.2.0",
      "location": "living_room"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Device registered successfully",
  "data": {
    "device": {
      "id": "ESP32_SHYRA_01",
      "deviceType": "ESP32",
      "name": "SHYRA Main Robot",
      "role": "DEVICE"
    }
  }
}
```

### Authenticate Device

**cURL:**
```bash
curl -X POST http://localhost:3000/api/devices/auth \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "ESP32_SHYRA_01"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Device authenticated successfully",
  "data": {
    "device": {
      "id": "ESP32_SHYRA_01",
      "deviceType": "ESP32",
      "name": "SHYRA Main Robot",
      "role": "DEVICE"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Get Device Info

**cURL:**
```bash
curl -X GET http://localhost:3000/api/devices/ESP32_SHYRA_01 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### List All Devices

**cURL:**
```bash
curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Event Processing

### Send Event (Async)

**cURL:**
```bash
curl -X POST http://localhost:3000/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "voice_command",
    "source": "ESP32_SHYRA_01",
    "data": {
      "command": "turn on the lights",
      "language": "english"
    }
  }'
```

**JavaScript (Axios):**
```javascript
const response = await axios.post(
  'http://localhost:3000/api/events',
  {
    type: 'voice_command',
    source: 'ESP32_SHYRA_01',
    data: {
      command: 'what is the weather today?',
      language: 'english'
    }
  },
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const eventId = response.data.data.eventId;

// Later, check status
const status = await axios.get(
  `http://localhost:3000/api/events/status/${eventId}`,
  { headers: { 'Authorization': `Bearer ${token}` } }
);
```

**Response:**
```json
{
  "success": true,
  "message": "Event accepted for processing",
  "data": {
    "eventId": "event-uuid",
    "status": "PENDING"
  }
}
```

### Send Event (Sync - Wait for Response)

**cURL:**
```bash
curl -X POST http://localhost:3000/api/events/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text_query",
    "source": "MOBILE_APP",
    "data": {
      "query": "What time is it?"
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Event processed successfully",
  "data": {
    "eventId": "event-uuid",
    "status": "COMPLETED",
    "response": {
      "text": "The current time is 3:30 PM",
      "emotion": "happy",
      "action": "speak"
    }
  }
}
```

### Get Event Status

**cURL:**
```bash
curl -X GET http://localhost:3000/api/events/status/event-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Event History

**cURL:**
```bash
curl -X GET "http://localhost:3000/api/events/history?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Event Statistics

**cURL:**
```bash
curl -X GET http://localhost:3000/api/events/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 2,
    "processing": 1,
    "completed": 142,
    "failed": 5
  }
}
```

---

## Socket.IO Examples

### Node.js Client

```javascript
const io = require('socket.io-client');

// Connect with authentication
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  },
  transports: ['websocket', 'polling']
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Connected to SHYRA!');
});

socket.on('auth:success', (data) => {
  console.log('🔐 Authenticated! Session ID:', data.sessionId);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from SHYRA');
});

// Send event
socket.emit('event:send', {
  type: 'sensor_data',
  source: 'ESP32_SHYRA_01',
  eventData: {
    temperature: 25.5,
    humidity: 60,
    motion: true
  }
});

// Listen for event responses
socket.on('event:received', (data) => {
  console.log('📨 Event received:', data.eventId);
});

socket.on('event:processing', (data) => {
  console.log('⚙️ Processing event:', data.eventId);
});

socket.on('event:completed', (data) => {
  console.log('✅ Event completed:', data.eventId);
  console.log('🧠 AI Response:', data.response);
});

socket.on('event:failed', (data) => {
  console.error('❌ Event failed:', data.error);
});

// Receive Brain responses
socket.on('brain:response', (data) => {
  console.log('🧠 Brain Response:', data);
});

// Health check
setInterval(() => {
  socket.emit('ping');
}, 30000); // Every 30 seconds

socket.on('pong', () => {
  console.log('💓 Connection alive');
});
```

### Browser Client (HTML + JavaScript)

```html
<!DOCTYPE html>
<html>
<head>
  <title>SHYRA Test Client</title>
  <script src="https://cdn.socket.io/4.6.1/socket.io.min.js"></script>
</head>
<body>
  <h1>SHYRA Socket.IO Test</h1>
  <div id="status">Disconnected</div>
  <div id="messages"></div>

  <script>
    const token = 'YOUR_JWT_TOKEN'; // Replace with actual token

    const socket = io('http://localhost:3000', {
      auth: { token }
    });

    const statusDiv = document.getElementById('status');
    const messagesDiv = document.getElementById('messages');

    function addMessage(msg) {
      messagesDiv.innerHTML += `<p>${new Date().toLocaleTimeString()}: ${msg}</p>`;
    }

    socket.on('connect', () => {
      statusDiv.textContent = 'Connected ✅';
      addMessage('Connected to SHYRA!');
    });

    socket.on('auth:success', (data) => {
      addMessage(`Authenticated! Session: ${data.sessionId}`);
    });

    socket.on('disconnect', () => {
      statusDiv.textContent = 'Disconnected ❌';
      addMessage('Disconnected from SHYRA');
    });

    socket.on('event:completed', (data) => {
      addMessage(`Event completed: ${JSON.stringify(data.response)}`);
    });

    socket.on('brain:response', (data) => {
      addMessage(`Brain says: ${JSON.stringify(data)}`);
    });

    // Send test event
    function sendTestEvent() {
      socket.emit('event:send', {
        type: 'test',
        source: 'WEB_CLIENT',
        eventData: { message: 'Hello SHYRA!' }
      });
      addMessage('Sent test event');
    }

    // Auto-send test event after 2 seconds
    setTimeout(sendTestEvent, 2000);
  </script>
</body>
</html>
```

### ESP32 Arduino Example (Pseudo-code)

```cpp
#include <WiFi.h>
#include <SocketIoClient.h>
#include <ArduinoJson.h>

SocketIoClient socket;

const char* token = "YOUR_DEVICE_JWT_TOKEN";

void setup() {
  // Connect to WiFi
  WiFi.begin("SSID", "PASSWORD");
  while (WiFi.status() != WL_CONNECTED) delay(500);
  
  // Connect to Socket.IO
  socket.begin("192.168.1.100", 3000);
  socket.on("connect", onConnect);
  socket.on("auth:success", onAuthSuccess);
  socket.on("event:completed", onEventCompleted);
}

void onConnect(const char* payload, size_t length) {
  // Authenticate
  DynamicJsonDocument doc(256);
  doc["token"] = token;
  String auth;
  serializeJson(doc, auth);
  socket.emit("auth", auth.c_str());
}

void onAuthSuccess(const char* payload, size_t length) {
  Serial.println("Authenticated!");
}

void sendSensorData(float temp, float humidity) {
  DynamicJsonDocument doc(512);
  doc["type"] = "sensor_data";
  doc["source"] = "ESP32_SHYRA_01";
  
  JsonObject data = doc.createNestedObject("eventData");
  data["temperature"] = temp;
  data["humidity"] = humidity;
  
  String event;
  serializeJson(doc, event);
  socket.emit("event:send", event.c_str());
}

void onEventCompleted(const char* payload, size_t length) {
  Serial.println("AI Response received:");
  Serial.println(payload);
}

void loop() {
  socket.loop();
  
  // Send sensor data every 10 seconds
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 10000) {
    float temp = readTemperature();
    float humidity = readHumidity();
    sendSensorData(temp, humidity);
    lastSend = millis();
  }
}
```

---

## Testing Full Flow

### Complete End-to-End Test

```javascript
const axios = require('axios');
const io = require('socket.io-client');

async function testFullFlow() {
  const BASE_URL = 'http://localhost:3000';
  
  // 1. Register user
  console.log('1️⃣ Registering user...');
  const userRes = await axios.post(`${BASE_URL}/api/users/register`, {
    username: 'testuser',
    password: 'test123',
    name: 'Test User'
  });
  const userToken = userRes.data.data.token;
  console.log('✅ User registered, token received');
  
  // 2. Register device
  console.log('2️⃣ Registering device...');
  const deviceRes = await axios.post(`${BASE_URL}/api/devices/register`, {
    deviceId: 'TEST_ESP32',
    deviceType: 'ESP32',
    name: 'Test Robot'
  });
  console.log('✅ Device registered');
  
  // 3. Authenticate device
  console.log('3️⃣ Authenticating device...');
  const authRes = await axios.post(`${BASE_URL}/api/devices/auth`, {
    deviceId: 'TEST_ESP32'
  });
  const deviceToken = authRes.data.data.token;
  console.log('✅ Device authenticated');
  
  // 4. Connect via Socket.IO
  console.log('4️⃣ Connecting via Socket.IO...');
  const socket = io(BASE_URL, { auth: { token: deviceToken } });
  
  socket.on('connect', () => {
    console.log('✅ Socket connected');
    
    // 5. Send event
    console.log('5️⃣ Sending event...');
    socket.emit('event:send', {
      type: 'test_command',
      source: 'TEST_ESP32',
      eventData: { command: 'hello' }
    });
  });
  
  socket.on('event:completed', (data) => {
    console.log('✅ Event completed!');
    console.log('Response:', data.response);
    socket.close();
  });
  
  socket.on('event:failed', (data) => {
    console.error('❌ Event failed:', data.error);
    socket.close();
  });
}

testFullFlow().catch(console.error);
```

---

**For more information, see [README.md](../README.md)**
