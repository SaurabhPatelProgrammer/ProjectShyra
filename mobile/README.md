# SHYRA Mobile App

Production-ready Expo React Native mobile app for SHYRA AI assistant.

## Features

- 🔐 User authentication (login/register)
- 💬 Real-time chat with AI
- 🎤 Voice input capability
- 🤖 Robot control interface
- 🔌 Socket.IO real-time communication
- 📱 Clean, modern UI

## Prerequisites

- Node.js 18+
- Expo CLI
- iOS Simulator / Android Emulator / Physical device

## Setup

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Configure Backend URL

Edit `config/constants.js` and update the URLs:

```javascript
const API_URL = 'http://YOUR_IP:3000';  // Replace with your computer's IP
const SOCKET_URL = 'http://YOUR_IP:3000';
```

**Important:** Use your computer's local IP address (e.g., `192.168.1.100`), NOT `localhost`.

### 3. Start the App

```bash
npm start
```

This will open Expo Dev Tools. You can:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app on your phone

## Project Structure

```
mobile/
├── app/                    # Expo Router screens
│   ├── (tabs)/            # Tab navigation
│   │   ├── chat.jsx       # Chat screen
│   │   ├── control.jsx    # Robot control
│   │   └── profile.jsx    # User profile
│   ├── login.jsx          # Login screen
│   ├── register.jsx       # Register screen
│   ├── _layout.jsx        # Root layout
│   └── index.jsx          # Entry point
├── components/            # Reusable components
│   ├── chat/             # Chat components
│   ├── control/          # Control components
│   └── common/           # Common components
├── services/             # API & Socket.IO
│   ├── api.js           # REST API
│   ├── socket.js        # Socket.IO client
│   └── storage.js       # AsyncStorage
├── hooks/               # Custom hooks
│   ├── useSocket.js    # Socket.IO hook
│   └── useVoice.js     # Voice recording
├── context/            # React context
│   └── AuthContext.jsx # Auth state
└── config/            # Configuration
    └── constants.js   # App constants
```

## Usage

### 1. Register/Login

- Open the app
- Create a new account or login
- Credentials are stored securely

### 2. Chat with SHYRA

- Navigate to Chat tab
- Type messages or use voice input
- Receive real-time AI responses

### 3. Control Robot

- Navigate to Control tab
- Use directional buttons for movement
- Use action buttons for commands

## API Integration

The app connects to the Node.js backend:

- **REST API:** User auth, chat history
- **Socket.IO:** Real-time messaging, robot control

## Troubleshooting

### Cannot connect to server

- Ensure backend is running: `cd server && npm run dev`
- Check `config/constants.js` has correct IP address
- Ensure phone and computer are on same WiFi network

### Voice input not working

- Grant microphone permissions when prompted
- Check device settings for app permissions

### App crashes on startup

- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## Building for Production

### Android

```bash
eas build --platform android
```

### iOS

```bash
eas build --platform ios
```

## Tech Stack

- **Expo SDK 54**
- **React Native 0.81**
- **Expo Router** (file-based routing)
- **Socket.IO Client** (real-time)
- **AsyncStorage** (local storage)
- **Expo AV** (audio recording)
- **Axios** (HTTP client)

## License

MIT
