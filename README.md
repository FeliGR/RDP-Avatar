# AR Avatar | Your Digital Identity in 3D

<p align="center">
  <img src="public/images/ar-avatar-logo.svg" alt="AR Avatar Logo" width="300">
</p>

<p align="center">
  <i>Create, customize, and animate your 3D digital identity with ease</i>
</p>

<div align="center">
  
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Babylon.js](https://img.shields.io/badge/Babylon.js-5.x-orange?style=for-the-badge&logo=babylon.js)](https://www.babylonjs.com/)
[![Ready Player Me](https://img.shields.io/badge/Ready_Player_Me-API-blueviolet?style=for-the-badge)](https://readyplayer.me/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)

</div>

## Overview

AR Avatar is a cutting-edge 3D avatar creation and visualization platform that leverages Ready Player Me's powerful avatar system and Babylon.js for realistic rendering. Create, customize, and animate your virtual identity in a seamless interactive experience.

## Features

- **Personalized Avatars** - Create your digital twin with extensive customization options
- **Rich Animations** - Express yourself with varied expression and idle animations
- **Interactive Dialog** - Engage in conversations with AI-driven responses
- **Personality Controls** - Adjust your avatar's personality traits and behaviors
- **Voice Integration** - Give your avatar a voice with advanced speech capabilities
- **Mobile Friendly** - Works on desktop and mobile devices

## Prerequisites

- Node.js (v14 or higher)
- Docker and Docker Compose (for containerized deployment)

## Setup & Installation

### Quick Start

```bash
# Clone the repository
git clone https://github.com/FeliGR/ar-avatar.git
cd ar-avatar

# Create environment file
cp .env.example .env

# Install dependencies
npm install

# Start development server
npm start
```

Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d
```

## Configuration

### Environment Variables

Edit the `.env` file with your configuration:

```env
# API Endpoints
REACT_APP_PERSONA_ENGINE_URL=http://localhost:5001
REACT_APP_DIALOG_ORCHESTRATOR_URL=http://localhost:5002

# Ready Player Me
REACT_APP_RPM_CLIENT_ID=your_rpm_client_id_here
```

### Ready Player Me Setup

1. Sign up at [Ready Player Me Developers](https://readyplayer.me/developers)
2. Create a new application and obtain your App ID
3. Set your App ID in the `.env` file

## Project Structure

```
src/
├── app/               # App configuration and providers
├── components/        # Reusable UI components
├── features/          # Feature modules
│   ├── avatar/        # Avatar creation and management
│   ├── babylon-avatar/ # 3D rendering with Babylon.js
│   ├── dialog/        # Conversation system
│   ├── personality/   # Avatar personality controls
│   └── voice/         # Voice services
├── services/          # API and external services
└── shared/            # Common utilities, styles and components
```

## Animations

Find avatar animations in the `public/animations/` directory:

- `feminine/` & `masculine/` - Gender-specific animations
  - `expression/` - Facial expressions and emotes  
  - `idle/` - Default standing and waiting animations

## License

[MIT License](LICENSE) - Feel free to use and modify according to your needs.

---
