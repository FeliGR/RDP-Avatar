# Persona Dynamics AI

An interactive 3D AI companion with customizable personality and voice.

## Features

- **3D Avatar**: Create and customize avatars using Ready Player Me
- **AI Chat**: Real-time conversations with personality-driven responses  
- **Personality System**: Adjust Big Five personality traits (openness, conscientiousness, extraversion, agreeableness, emotional sensitivity)
- **Voice Configuration**: Multilingual TTS with customizable voice parameters
- **Multilingual**: English and Spanish support

## Quick Start

```bash
git clone https://github.com/FeliGR/ar-avatar.git
cd ar-avatar
npm install
npm start
```

## Configuration

Create a `.env` file:

```env
REACT_APP_PERSONA_ENGINE_URL=http://localhost:5001
REACT_APP_DIALOG_ORCHESTRATOR_URL=http://localhost:5002
REACT_APP_RPM_CLIENT_ID=your_rpm_client_id
```

### Ready Player Me Setup

1. Get your App ID from [Ready Player Me Developers](https://readyplayer.me/developers)
2. Add it to your `.env` file as `REACT_APP_RPM_CLIENT_ID`

## Docker

```bash
docker-compose up -d
```

## Tech Stack

- React 19.1.0
- Babylon.js 8.x
- Ready Player Me
- Socket.io
- i18next
