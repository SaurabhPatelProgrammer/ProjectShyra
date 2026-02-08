# SHYRA Nervous System

**Production-ready Node.js backend for SHYRA AI Assistant**

A robust, scalable backend that acts as the **nervous system** for SHYRA, orchestrating communication between devices (ESP32, cameras), mobile apps, and the Python AI Brain.

## 🎯 Overview

This backend serves as the central communication hub that:
- ✅ Authenticates devices and users via JWT
- ✅ Accepts events from multiple sources (ESP32, Mobile App, Cameras)
- ✅ Forwards events to Python AI Brain for processing
- ✅ Routes AI responses back to appropriate devices/users
- ✅ Provides real-time bidirectional communication via Socket.IO
- ✅ Maintains session state and event history

## 🏗️ Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   ESP32     │────▶│   Node.js   │────▶│   Python    │
│   Device    │◀────│   Backend   │◀────│   AI Brain  │
└─────────────┘     │  (Nervous   │     └─────────────┘
                    │   System)   │
┌─────────────┐     │             │
│  Mobile App │────▶│             │
│             │◀────│             │
└─────────────┘     │             │
                    └─────────────┘
┌─────────────┐            ▲
│   Camera    │────────────┘
└─────────────┘
```

## 📁 Project Structure

```
server/
├── index.js                    # Server entry point
├── app.js                      # Express app configuration
├── package.json                # Dependencies
├── .env.example               # Environment template
├── config/
│   └── index.js               # Centralized configuration
├── routes/
│   ├── device.routes.js       # Device endpoints
│   ├── user.routes.js         # User endpoints
│   └── event.routes.js        # Event endpoints
├── controllers/
│   ├── device.controller.js   # Device handlers
│   ├── user.controller.js     # User handlers
│   └── event.controller.js    # Event handlers
├── services/
│   ├── auth.service.js        # Authentication logic
│   ├── session.service.js     # Session management
│   ├── brain.service.js       # Brain API communication
│   └── event.service.js       # Event processing
├── sockets/
│   ├── socket.manager.js      # Socket.IO manager
│   └── socket.events.js       # Event type definitions
├── middlewares/
│   ├── auth.middleware.js     # JWT authentication
│   ├── validation.middleware.js # Request validation
│   └── error.middleware.js    # Error handling
└── docs/
    ├── API_EXAMPLES.md        # API usage examples
    └── DEPLOYMENT.md          # Deployment guide
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Python Brain running at `http://localhost:8000` (optional for testing)

### Installation

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set:
   - `JWT_SECRET` - Strong secret key for JWT
   - `BRAIN_API_URL` - Python Brain URL (default: http://localhost:8000)
   - `PORT` - Server port (default: 3000)

4. **Start the server**
   
   **Development mode (with auto-reload):**
   ```bash
   npm run dev
   ```
   
   **Production mode:**
   ```bash
   npm start
   ```

The server will start at `http://localhost:3000`

## 🔌 API Endpoints

### Health Check
```http
GET /health
```
Returns server status and uptime.

### User Authentication

**Register User**
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepass123",
  "name": "John Doe"
}
```

**Login User**
```http
POST /api/users/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepass123"
}
```

Response includes JWT token.

### Device Management

**Register Device**
```http
POST /api/devices/register
Content-Type: application/json

{
  "deviceId": "ESP32_001",
  "deviceType": "ESP32",
  "name": "SHYRA Robot 1",
  "metadata": {
    "location": "home",
    "version": "1.0"
  }
}
```

**Authenticate Device**
```http
POST /api/devices/auth
Content-Type: application/json

{
  "deviceId": "ESP32_001"
}
```

Response includes JWT token.

### Event Processing

**Send Event (Async)**
```http
POST /api/events
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "voice_command",
  "source": "ESP32_001",
  "data": {
    "command": "turn on lights",
    "timestamp": "2026-02-08T10:00:00Z"
  }
}
```

**Send Event (Sync - Wait for response)**
```http
POST /api/events/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "voice_command",
  "source": "ESP32_001",
  "data": {
    "command": "what's the weather?"
  }
}
```

**Get Event Status**
```http
GET /api/events/status/:eventId
Authorization: Bearer <token>
```

**Get Event History**
```http
GET /api/events/history?limit=20
Authorization: Bearer <token>
```

## 🔌 Socket.IO Real-Time Communication

### Connect to Socket.IO

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

socket.on('connect', () => {
  console.log('Connected to SHYRA!');
});

socket.on('auth:success', (data) => {
  console.log('Session ID:', data.sessionId);
});
```

### Send Event via Socket

```javascript
socket.emit('event:send', {
  type: 'sensor_data',
  source: 'ESP32_001',
  eventData: {
    temperature: 25.5,
    humidity: 60
  }
});

socket.on('event:received', (data) => {
  console.log('Event accepted:', data.eventId);
});

socket.on('event:completed', (data) => {
  console.log('AI Response:', data.response);
});
```

### Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `auth:success` | Server → Client | Authentication successful |
| `event:send` | Client → Server | Submit event |
| `event:received` | Server → Client | Event accepted |
| `event:processing` | Server → Client | Event being processed |
| `event:completed` | Server → Client | Event processed successfully |
| `event:failed` | Server → Client | Event processing failed |
| `brain:response` | Server → Client | AI response from Brain |
| `ping` / `pong` | Bidirectional | Connection health check |

## 🧠 Integration with Python Brain

The backend expects the Python Brain to be running at the URL specified in `BRAIN_API_URL` (default: `http://localhost:8000`).

**Required Brain Endpoint:**
```http
POST /api/process
Content-Type: application/json

{
  "event_type": "voice_command",
  "source": "ESP32_001",
  "data": { ... },
  "timestamp": "2026-02-08T10:00:00Z",
  "session_id": "abc-123"
}
```

The Brain should return:
```json
{
  "response": {
    "action": "...",
    "text": "...",
    "emotion": "..."
  }
}
```

## 🔐 Security

- **JWT Authentication**: All API endpoints (except registration/login) require valid JWT token
- **Device Authentication**: Devices must register and authenticate before sending events
- **CORS**: Configurable CORS policy (default: allow all for development)
- **Helmet**: Security headers enabled
- **Input Validation**: Request validation middleware

## 📊 Monitoring

**Get Event Statistics**
```http
GET /api/events/stats
Authorization: Bearer <token>
```

**Get Active Sessions**
```http
GET /api/events/sessions
Authorization: Bearer <token>
```

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `HOST` | Server host | 0.0.0.0 |
| `JWT_SECRET` | JWT signing secret | (must set in production) |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `BRAIN_API_URL` | Python Brain URL | http://localhost:8000 |
| `BRAIN_API_TIMEOUT` | Brain request timeout (ms) | 30000 |
| `CORS_ORIGIN` | CORS allowed origins | * |

## 🐛 Troubleshooting

**Brain not reachable**
- Ensure Python Brain is running at the configured URL
- Check `BRAIN_API_URL` in `.env`
- The server will continue running but events will fail to process

**Authentication errors**
- Ensure JWT token is included in Authorization header: `Bearer <token>`
- Check token hasn't expired (default: 24 hours)
- Verify `JWT_SECRET` is consistent

**Socket.IO connection issues**
- Ensure client is passing JWT token in `auth.token` during connection
- Check CORS configuration
- Verify firewall/network settings

## 📝 Development

**Run in development mode with auto-reload:**
```bash
npm run dev
```

**Check logs:** Console output shows detailed request/response logs in development mode.

## 🚀 Production Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment guide including:
- PM2 process management
- Nginx reverse proxy
- SSL/TLS configuration
- Redis session storage
- Monitoring and logging

## 📄 License

MIT

## 🤝 Contributing

This is a private project for SHYRA AI Assistant.

---

**Built with ❤️ for SHYRA - Your Personal AI Assistant**
