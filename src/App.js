import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AvatarViewer } from "./features/avatar";
import { DialogBox } from "./features/dialog";
import { PersonalityControls } from "./features/personality";
import { VoiceControls } from "./features/voice";
import { AppProviders } from "./app/providers";
import { LanguageSwitcher } from "./shared/components";
import ChatPanelHeader from "./features/dialog/components/ChatPanelHeader";
import "./styles/index.css";

const App = () => {
  const { t } = useTranslation();
  const [showUI, setShowUI] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [triggerAvatarCustomization, setTriggerAvatarCustomization] = useState(false);
  const [triggerZoomEffect, setTriggerZoomEffect] = useState(false);
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
      document.body.classList.add("creator-open");
    } else {
      document.body.classList.remove("creator-open");
    }
    return () => {
      document.body.classList.remove("creator-open");
    };
  }, [showCreator]);

  const handleStart = () => {
    const orbElement = document.querySelector(".start-orb");
    if (orbElement) {
      orbElement.classList.add("clicked");
    }

    const welcomeContentElement = document.querySelector(".welcome-content");
    if (welcomeContentElement) {
      welcomeContentElement.classList.add("starting");
    }

    const particlesElement = document.querySelector(".floating-particles");
    if (particlesElement) {
      particlesElement.classList.add("burst");

      const particles = particlesElement.querySelectorAll(".particle");
      particles.forEach((particle, index) => {
        const burstX = (Math.random() - 0.5) * 100;
        const burstY = (Math.random() - 0.5) * 100;
        particle.style.setProperty("--burst-x", `${burstX}px`);
        particle.style.setProperty("--burst-y", `${burstY}px`);
      });
    }

    setIsStarted(true);
    setShowUI(true);
    setTriggerZoomEffect(true);

    if (logoRef.current) {
      logoRef.current.classList.add("fade-out");
    }

    setTimeout(() => {
      setTriggerZoomEffect(false);
    }, 3000);
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
        {!showCreator && <LanguageSwitcher />}
        <div className={`avatar-background ${avatarLoaded ? "loaded" : ""}`}>
          {avatarLoaded && (
            <AvatarViewer
              fullscreen={true}
              triggerAvatarCustomization={triggerAvatarCustomization}
              showCreator={showCreator}
              setShowCreator={setShowCreator}
              triggerZoomEffect={triggerZoomEffect}
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
                  <span className="title-word">{t('app.title').split(' ')[0]}</span>
                  <span className="title-word highlight">{t('app.title').split(' ')[1]}</span>
                  <span className="title-word">{t('app.title').split(' ')[2]}</span>
                </h1>
                <p className="subtitle">{t('app.subtitle')}</p>
                <div className="feature-tags">
                  <span className="tag">{t('app.featureTags.realTimeChat')}</span>
                  <span className="tag">{t('app.featureTags.3dAvatar')}</span>
                  <span className="tag">{t('app.featureTags.smartResponses')}</span>
                </div>
              </div>
              <div className="interaction-zone" onClick={handleStart}>
                <div className="start-orb">
                  <div className="orb-inner">
                    <div className="orb-core"></div>
                  </div>
                </div>
                <p className="interaction-text">
                  <span className="primary-text">{t('app.touchToBegin')}</span>
                  <span className="secondary-text">{t('app.yourAiCompanionAwaits')}</span>
                </p>
              </div>
              <div className="system-status">
                <div className="status-item">
                  <div className="status-dot active"></div>
                  <span>{t('app.systemStatus.aiCore')}</span>
                </div>
                <div className="status-item">
                  <div className="status-dot active"></div>
                  <span>{t('app.systemStatus.avatarEngine')}</span>
                </div>
                <div className="status-item">
                  <div className="status-dot active"></div>
                  <span>{t('app.systemStatus.readyToChat')}</span>
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
        {showUI && !showCreator && (
          <>
            <div className="control-buttons">
              <button
                className={`control-btn ${activePanel === "chat" ? "active" : ""}`}
                onClick={() => togglePanel("chat")}
                title={t('navigation.openChat')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
              </button>
              <button
                className={`control-btn ${activePanel === "personality" ? "active" : ""}`}
                onClick={() => togglePanel("personality")}
                title={t('navigation.personalityProfile')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </button>
              <button
                className={`control-btn ${activePanel === "voice" ? "active" : ""}`}
                onClick={() => togglePanel("voice")}
                title={t('navigation.voiceConfiguration')}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </button>
              <button
                className="control-btn"
                onClick={handleCustomizeAvatar}
                title={t('navigation.customizeAvatar')}
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
            <div
              className={`modal-backdrop ${activePanel === "personality" ? "active" : ""}`}
              onClick={() => setActivePanel(null)}
            ></div>
            <div
              className={`modal-backdrop ${activePanel === "voice" ? "active" : ""}`}
              onClick={() => setActivePanel(null)}
            ></div>
            <div className={`side-panel chat-panel ${activePanel === "chat" ? "active" : ""}`}>
              <ChatPanelHeader onClose={() => setActivePanel(null)} />
              <div className="panel-content">
                <DialogBox isVisible={activePanel === "chat"} />
              </div>
            </div>
            <div
              className={`side-panel personality-panel ${activePanel === "personality" ? "active" : ""}`}
            >
              <div className="panel-header">
                <h3>{t('personality.personalityProfile')}</h3>
                <button className="close-panel-btn" onClick={() => setActivePanel(null)}>
                  ×
                </button>
              </div>
              <div className="panel-content">
                <PersonalityControls />
              </div>
            </div>
            <div className={`side-panel voice-panel ${activePanel === "voice" ? "active" : ""}`}>
              <div className="panel-header">
                <h3>{t('voice.voiceConfiguration')}</h3>
                <button className="close-panel-btn" onClick={() => setActivePanel(null)}>
                  ×
                </button>
              </div>
              <div className="panel-content">
                <VoiceControls />
              </div>
            </div>
          </>
        )}
      </div>
    </AppProviders>
  );
};

export default App;
