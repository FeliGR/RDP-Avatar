import React, { useEffect, useRef, Suspense, lazy } from "react";
import "./App.css";
import { AppProviders } from "./app/providers";

// Lazy load heavy components
const AvatarViewer = lazy(() => import("./features/avatar").then(module => ({ default: module.AvatarViewer })));
const DialogBox = lazy(() => import("./features/dialog").then(module => ({ default: module.DialogBox })));
const PersonalityControls = lazy(() => import("./features/personality").then(module => ({ default: module.PersonalityControls })));

// Loading component for better UX
const LoadingSpinner = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '200px',
    color: 'var(--primary-color)',
    fontSize: '14px'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '3px solid #f3f3f3',
        borderTop: '3px solid var(--primary-color)', 
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 10px'
      }}></div>
      Loading...
    </div>
  </div>
);

function AppContent() {
  const headerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!headerRef.current) return;

      const rect = headerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      headerRef.current.style.setProperty("--mouse-x", `${x}px`);
      headerRef.current.style.setProperty("--mouse-y", `${y}px`);
    };

    const header = headerRef.current;
    if (header) {
      header.addEventListener("mousemove", handleMouseMove);
      return () => {
        header.removeEventListener("mousemove", handleMouseMove);
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
            <h1>
              Persona <span className="text-highlight">Dynamics </span>AI
            </h1>
          </div>
          <p className="app-description">
            Experience next-generation digital identity with AI-powered avatar personalization. Our
            advanced platform enables seamless voice and text interactions while dynamically
            adapting to your unique personality traits.
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
              <Suspense fallback={<LoadingSpinner />}>
                <AvatarViewer />
              </Suspense>
            </div>
          </div>
        </div>

        <div className="interaction-section">
          <div className="app-card">
            <div className="app-card-header">
              <h2>Personality Profile</h2>
            </div>
            <div className="app-card-content">
              <Suspense fallback={<LoadingSpinner />}>
                <PersonalityControls />
              </Suspense>
            </div>
          </div>

          <div className="app-card">
            <div className="app-card-header">
              <h2>Conversation</h2>
            </div>
            <div className="app-card-content">
              <Suspense fallback={<LoadingSpinner />}>
                <DialogBox />
              </Suspense>
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
