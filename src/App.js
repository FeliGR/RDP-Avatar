import React from "react";
import "./App.css";
import AvatarViewer from "./features/avatar/AvatarViewer";
import DialogBox from "./features/dialog/DialogBox";
import { DialogProvider } from "./features/dialog/DialogContext";
import { PersonalityProvider } from "./features/personality/PersonalityContext";
import PersonalityControls from "./features/personality/PersonalityControls";

function AppContent() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Persona Dynamics AI</h1>
        <p className="app-description">
          Experience next-generation digital identity with AI-powered avatar personalization. Our advanced platform enables seamless voice and text interactions while dynamically adapting to your unique personality traits.
        </p>
      </header>

      <main className="app-content">
        <div className="avatar-section">
          <div className="app-card">
            <div className="app-card-header">
              <h2>Avatar</h2>
            </div>
            <div className="app-card-content">
              <AvatarViewer />
            </div>
          </div>
        </div>

        <div className="interaction-section">
          <div className="app-card">
            <div className="app-card-header">
              <h2>Personality Profile</h2>
            </div>
            <div className="app-card-content">
              <PersonalityControls />
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-header">
              <h2>Conversation</h2>
            </div>
            <div className="app-card-content">
              <DialogBox />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <PersonalityProvider>
      <DialogProvider>
        <AppContent />
      </DialogProvider>
    </PersonalityProvider>
  );
}

export default App;
