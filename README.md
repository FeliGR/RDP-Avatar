# RPM-Avatar

An interactive 3D AI companion with customizable personality and voice.

## Features

- **3D Avatar**: Create and customize avatars using Ready Player Me
- **AI Chat**: Real-time conversations with personality-driven responses
- **Personality System**: Adjust Big Five personality traits (openness, conscientiousness, extraversion, agreeableness, emotional sensitivity)
- **Voice Configuration**: Multilingual TTS with customizable voice parameters
- **Multilingual**: English and Spanish support

## Quick Start

```bash
git clone https://github.com/FeliGR/RPM-Avatar.git
cd RPM-Avatar
npm install
npm start
```

## Required backend services

This UI depends on three backend services. Make sure they’re running (locally or via Docker) before using the app:

- Audio Engine (TTS/STT): https://github.com/FeliGR/Audio-Engine
- Dialog Orchestrator (chat flow): https://github.com/FeliGR/Dialog-Orchestrator
- Persona Engine (personality/profile): https://github.com/FeliGR/Persona-Engine

Configure their URLs via the `.env` variables below.

## Configuration

Create a `.env` file:

```env
REACT_APP_PERSONA_ENGINE_URL=http://localhost:5001
REACT_APP_DIALOG_ORCHESTRATOR_URL=http://localhost:5002
REACT_APP_AUDIO_ENGINE_URL=http://localhost:5003
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

<img width="2560" height="1320" alt="image" src="https://github.com/user-attachments/assets/c1ffce4a-f246-4a3e-b1cc-e6b3ab71aba0" />
<img width="2560" height="1320" alt="image" src="https://github.com/user-attachments/assets/ab808de6-92c5-49c7-b97f-ec943c116d29" />
<img width="2560" height="1320" alt="image" src="https://github.com/user-attachments/assets/a5c3f56a-7e71-421d-8c15-12dc3b0f8a5f" />
<img width="2560" height="1320" alt="image" src="https://github.com/user-attachments/assets/04f55e5a-39ba-491e-a49f-4c29732a2918" />
