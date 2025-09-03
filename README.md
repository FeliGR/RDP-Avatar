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

## Screenshots

<img width="2560" height="1318" alt="Avatar Chat 1" src="https://github.com/user-attachments/assets/e412c493-e0d7-4692-aec4-18a70b69c71a" />
<img width="2560" height="1318" alt="Avatar Chat 2" src="https://github.com/user-attachments/assets/80ba8535-b6fb-45f2-b188-28f8a60db8d0" />
<img width="2560" height="1318" alt="Avatar Personality Panel" src="https://github.com/user-attachments/assets/0e7447f2-e393-473f-a9f3-6599477c3002" />
<img width="2560" height="1318" alt="Voice Settings" src="https://github.com/user-attachments/assets/3bd7a2d8-ed8b-4fa1-b976-abbe6a28d48d" />

<table>
  <tr>
    <td>
      <a href="https://github.com/user-attachments/assets/e5316471-ab26-4e8b-9368-a24b53cfc5e9">
        <img src="https://github.com/user-attachments/assets/e5316471-ab26-4e8b-9368-a24b53cfc5e9" width="100%" alt="Screenshot 1" />
      </a>
    </td>
    <td>
      <a href="https://github.com/user-attachments/assets/6d5be6a3-65c3-419b-af40-4f58a60fe2f4">
        <img src="https://github.com/user-attachments/assets/6d5be6a3-65c3-419b-af40-4f58a60fe2f4" width="100%" alt="Screenshot 2" />
      </a>
    </td>
  </tr>
  <tr>
    <td>
      <a href="https://github.com/user-attachments/assets/46c77209-a1c7-4ebb-bf62-6b0db18742f7">
        <img src="https://github.com/user-attachments/assets/46c77209-a1c7-4ebb-bf62-6b0db18742f7" width="100%" alt="Screenshot 3" />
      </a>
    </td>
    <td>
      <a href="https://github.com/user-attachments/assets/09865849-5e65-456f-8b41-de7a32c5cbfb">
        <img src="https://github.com/user-attachments/assets/09865849-5e65-456f-8b41-de7a32c5cbfb" width="100%" alt="Screenshot 4" />
      </a>
    </td>
  </tr>
</table>
