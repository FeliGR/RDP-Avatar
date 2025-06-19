import React, { useState, useEffect, useRef } from "react";
import { AvatarViewer } from "./features/avatar";
import { DialogBox } from "./features/dialog";
import { PersonalityControls } from "./features/personality";
import { AppProviders } from "./app/providers";
import "./styles/index.css";

const App = () => {
  const [showUI, setShowUI] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [triggerAvatarCustomization, setTriggerAvatarCustomization] = useState(false);
  const [showCreator, setShowCreator] = useState(() => {
    return !localStorage.getItem("rpmAvatarUrl");
  });
  const logoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const avatarTimer = setTimeout(() => {
      setAvatarLoaded(true);
    }, 500);
    return () => {
      clearTimeout(avatarTimer);
    };
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current || isStarted || showCreator) {
        return;
      }
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      const xPercent = (clientX / innerWidth - 0.5) * 2;
      const yPercent = (clientY / innerHeight - 0.5) * 2;
      const particles = containerRef.current.querySelectorAll(".particle");
      particles.forEach((particle, index) => {
        const speed = ((index % 3) + 1) * 0.5;
        const x = xPercent * speed * 10;
        const y = yPercent * speed * 10;
        particle.style.transform = `translate(${x}px, ${y}px)`;
      });
      const nodes = containerRef.current.querySelectorAll(".neural-node");
      nodes.forEach((node, index) => {
        const speed = ((index % 2) + 1) * 0.3;
        const x = xPercent * speed * 5;
        const y = yPercent * speed * 5;
        node.style.transform = `translate(${x}px, ${y}px)`;
      });
      const logoElements = containerRef.current.querySelectorAll(".logo-ring, .logo-ring-2");
      logoElements.forEach((element, index) => {
        const speed = index === 0 ? 0.2 : 0.1;
        const x = xPercent * speed * 3;
        const y = yPercent * speed * 3;
        element.style.transform = `translate(${x}px, ${y}px) rotate(${element.style.transform?.includes("rotate") ? element.style.transform.match(/rotate\(([^)]+)\)/)?.[1] || "0deg" : "0deg"})`;
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isStarted, showCreator]);

  useEffect(() => {
    if (showCreator) {
      document.body.classList.add('creator-open');
    } else {
      document.body.classList.remove('creator-open');
    }
    return () => {
      document.body.classList.remove('creator-open');
    };
  }, [showCreator]);

  const handleStart = () => {
    setIsStarted(true);
    setShowUI(true);
    if (logoRef.current) {
      logoRef.current.classList.add("fade-out");
      setTimeout(() => {
        setActivePanel("chat");
      }, 500);
    }
  };

  const togglePanel = (panel) => {
    if (activePanel === panel) {
      setActivePanel(null);
    } else {
      setActivePanel(panel);
    }
  };

  const handleCustomizeAvatar = () => {
    setActivePanel(null);
    setTriggerAvatarCustomization(true);
    setTimeout(() => {
      setTriggerAvatarCustomization(false);
    }, 100);
  };

  return (
    <AppProviders>
      <div ref={containerRef} className="app-container">
        <div className={`avatar-background ${avatarLoaded ? "loaded" : ""}`}>
          {avatarLoaded && (
            <AvatarViewer 
              fullscreen={true} 
              triggerAvatarCustomization={triggerAvatarCustomization}
              showCreator={showCreator}
              setShowCreator={setShowCreator}
            />
          )}
        </div>
        {!isStarted && (
          <div ref={logoRef} className="welcome-experience">
            <div className="welcome-background">
              <div className="floating-particles">
                {[...Array(20)].map((_, i) => (
                  <div key={i} className={`particle particle-${i}`}></div>
                ))}
              </div>
              <div className="neural-network">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className={`neural-node node-${i}`}>
                    <div className="node-pulse"></div>
                  </div>
                ))}
                {[...Array(12)].map((_, i) => (
                  <div key={i} className={`neural-connection connection-${i}`}></div>
                ))}
              </div>
            </div>
            <div className="welcome-content">
              <div className="logo-animation">
                <div className="logo-circle">
                  <div className="logo-inner-circle"></div>
                  <div className="logo-ring"></div>
                  <div className="logo-ring-2"></div>
                </div>
                <div className="logo-glow"></div>
              </div>
              <div className="welcome-text">
                <h1 className="main-title">
                  <span className="title-word">Persona</span>
                  <span className="title-word highlight">Dynamics</span>
                  <span className="title-word">AI</span>
                </h1>
                <p className="subtitle">Experience the future of digital identity</p>
                <div className="feature-tags">
                  <span className="tag">Real-Time Chat</span>
                  <span className="tag">3D Avatar</span>
                  <span className="tag">Smart Responses</span>
                </div>
              </div>
              <div className="interaction-zone" onClick={handleStart}>
                <div className="start-orb">
                  <div className="orb-inner">
                    <div className="orb-core"></div>
                  </div>
                </div>
                <p className="interaction-text">
                  <span className="primary-text">Touch to Begin</span>
                  <span className="secondary-text">Your AI companion awaits</span>
                </p>
              </div>
              <div className="system-status">
                <div className="status-item">
                  <div className="status-dot active"></div>
                  <span>AI Core</span>
                </div>
                <div className="status-item">
                  <div className="status-dot active"></div>
                  <span>Avatar Engine</span>
                </div>
                <div className="status-item">
                  <div className="status-dot active"></div>
                  <span>Ready to Chat</span>
                </div>
              </div>
            </div>
            <div className="interactive-elements">
              <div className="data-streams">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`data-stream stream-${i}`}>
                    <div className="stream-line"></div>
                    <div className="stream-dots">
                      {[...Array(4)].map((_, j) => (
                        <div key={j} className="stream-dot"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {showUI && (
          <>
            <div className="control-buttons">
              <button
                className={`control-btn ${activePanel === "chat" ? "active" : ""}`}
                onClick={() => togglePanel("chat")}
                title="Open Chat"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
              </button>
              <button
                className={`control-btn ${activePanel === "personality" ? "active" : ""}`}
                onClick={() => togglePanel("personality")}
                title="Personality Profile"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </button>
              <button
                className="control-btn"
                onClick={handleCustomizeAvatar}
                title="Customize Avatar"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            </div>
            <div
              className={`modal-backdrop ${activePanel === "chat" ? "active" : ""}`}
              onClick={() => setActivePanel(null)}
            ></div>
            <div className={`side-panel chat-panel ${activePanel === "chat" ? "active" : ""}`}>
              <div className="panel-header">
                <h3>Chat with Alex</h3>
                <button
                  className="close-panel-btn"
                  onClick={() => setActivePanel(null)}
                  title="Close Chat"
                >
                  ×
                </button>
              </div>
              <div className="panel-content">
                <DialogBox />
              </div>
            </div>
            <div
              className={`side-panel personality-panel ${activePanel === "personality" ? "active" : ""}`}
            >
              <div className="panel-header">
                <h3>Personality Profile</h3>
                <button className="close-panel-btn" onClick={() => setActivePanel(null)}>
                  ×
                </button>
              </div>
              <div className="panel-content">
                <PersonalityControls />
              </div>
            </div>
          </>
        )}
      </div>
    </AppProviders>
  );
};

export default App;
