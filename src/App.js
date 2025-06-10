import React, { useEffect, useRef } from "react";
import "./App.css";
import { AppProviders } from "./app/providers";
import { AvatarViewer } from "./features/avatar";
import { DialogBox } from "./features/dialog";
import { PersonalityControls } from "./features/personality";

function AppContent() {
  const headerRef = useRef(null);
  
  useEffect(() => {
    // Add interactive effect to header
    const handleMouseMove = (e) => {
      if (!headerRef.current) return;
      
      const rect = headerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update CSS variables for parallax effect
      headerRef.current.style.setProperty('--mouse-x', `${x}px`);
      headerRef.current.style.setProperty('--mouse-y', `${y}px`);
    };
    
    const header = headerRef.current;
    if (header) {
      header.addEventListener('mousemove', handleMouseMove);
      return () => {
        header.removeEventListener('mousemove', handleMouseMove);
      };
    }
  }, []);

  return (
    <div className="app-container">
      <header ref={headerRef} className="app-header">
        <div className="header-background">
          <div className="header-grid"></div>
          <div className="header-glow"></div>
          <div className="header-particles">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="particle"></div>
            ))}
          </div>
        </div>
        <div className="header-content">
          <div className="logo-container">
            <div className="logo-circle"></div>
            <h1>Persona <span className="text-highlight">Dynamics </span>AI</h1>
          </div>
          <p className="app-description">
            Experience next-generation digital identity with AI-powered avatar
            personalization. Our advanced platform enables seamless voice and text
            interactions while dynamically adapting to your unique personality
            traits.
          </p>
          <div className="header-tech-line"></div>
        </div>
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
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;
