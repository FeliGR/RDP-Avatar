import { AvatarCreator } from "@readyplayerme/react-avatar-creator";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAvatarAnimations } from "../hooks/useAvatarAnimations.js";
import { useAIResponseAnimations } from "../hooks/useAIResponseAnimations.js";
import { useAvatarAnimation } from "../context/AvatarAnimationContext.js";
import { useBabylonJS } from "../hooks/useBabylonJS.js";
import "./ReadyPlayerMeAvatar.css";

const RPM_CLIENT_ID =
  (window.ENV && window.ENV.REACT_APP_RPM_CLIENT_ID) ||
  process.env.REACT_APP_RPM_CLIENT_ID ||
  "684b2978d8c346fff8566d83";

const ReadyPlayerMeAvatar = ({
  canvasRef,
  onAvatarLoaded,
  fullscreen = false,
  personalityTraits,
  triggerAvatarCustomization = false,
}) => {
  const { BABYLON, isLoading: babylonLoading, error: babylonError } = useBabylonJS();

  const savedAvatarUrl = localStorage.getItem("rpmAvatarUrl");
  const [avatarUrl, setAvatarUrl] = useState(savedAvatarUrl || null);
  const [showCreator, setShowCreator] = useState(!savedAvatarUrl);
  const [isLoading, setIsLoading] = useState(!!savedAvatarUrl);
  const [avatarError, setAvatarError] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarFullyReady, setAvatarFullyReady] = useState(false);
  const avatarRef = useRef(null);
  const sceneRef = useRef(null);
  const shadowGeneratorRef = useRef(null);
  const [sceneReady, setSceneReady] = useState(false);
  const loadingRef = useRef(false);
  const animationsLoadedRef = useRef(false);

  const { registerAnimationService, registerAIResponseCallback } = useAvatarAnimation();

  const {
    isInitialized: animationsInitialized,
    loadAvatarAnimations,
    startSpecificIdleAnimation,
    animationService,
  } = useAvatarAnimations(
    sceneReady ? sceneRef.current?.scene : null,
    sceneReady ? shadowGeneratorRef.current : null
  );

  const { triggerAIResponseAnimation } = useAIResponseAnimations(
    animationService,
    startSpecificIdleAnimation
  );

  useEffect(() => {
    if (animationService) {
      registerAnimationService(animationService);
    }
  }, [animationService, registerAnimationService]);

  useEffect(() => {
    // Don't initialize scene until Babylon.js is loaded
    if (!BABYLON || !canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);

    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      -Math.PI / 2,
      Math.PI / 2.5,
      3,
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.lowerRadiusLimit = 1.5;
    camera.upperRadiusLimit = 8;

    const light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light1.intensity = 0.7;

    const light2 = new BABYLON.DirectionalLight("light2", new BABYLON.Vector3(0, -1, 1), scene);
    light2.intensity = 0.5;

    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light2, true);
    shadowGenerator.darkness = 0.4;
    shadowGenerator.bias = 0.001;
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.filteringQuality = 1;
    shadowGeneratorRef.current = shadowGenerator;

    engine.runRenderLoop(() => {
      scene.render();
    });

    window.addEventListener("resize", () => {
      engine.resize();
    });

    sceneRef.current = { scene, engine };

    setSceneReady(true);

    return () => {
      window.removeEventListener("resize", engine.resize);
      engine.dispose();
      scene.dispose();
    };
  }, [canvasRef, BABYLON]);

  const loadAvatar = useCallback(
    async (url) => {
      if (!BABYLON || !sceneRef.current || !sceneRef.current.scene || loadingRef.current) return;

      loadingRef.current = true;
      animationsLoadedRef.current = false;
      setAvatarLoaded(false);
      setAvatarFullyReady(false);
      setIsLoading(true);
      setAvatarError(null);

      try {
        const { scene } = sceneRef.current;

        if (avatarRef.current) {
          if (Array.isArray(avatarRef.current.getChildMeshes)) {
            const childMeshes = avatarRef.current.getChildMeshes();
            childMeshes.forEach((mesh) => {
              if (mesh.material) {
                mesh.material.dispose();
              }
              mesh.dispose();
            });
          }

          avatarRef.current.dispose();
          avatarRef.current = null;
        }

        const sceneMeshes = scene.meshes.slice();

        sceneMeshes.forEach((mesh) => {
          const shouldKeep =
            mesh.name === "camera" ||
            mesh.name.includes("light") ||
            mesh.name.includes("__root__") ||
            mesh.name === "ground" ||
            mesh.name === "skybox" ||
            mesh.name.includes("Sphere") ||
            mesh.name.includes("Base") ||
            mesh.name.includes("TV");

          const isFarAway =
            mesh.position &&
            (Math.abs(mesh.position.x) > 50000 ||
              Math.abs(mesh.position.y) > 50000 ||
              Math.abs(mesh.position.z) > 50000);

          if (!shouldKeep || isFarAway) {
            console.log("Disposing mesh:", mesh.name, isFarAway ? "(far away)" : "");

            try {
              const childMeshes = mesh.getChildMeshes();
              childMeshes.forEach((childMesh) => {
                if (childMesh.material) {
                  childMesh.material.dispose();
                }
                childMesh.dispose();
              });

              if (mesh.material) {
                mesh.material.dispose();
              }
              mesh.dispose();
            } catch (error) {}
          }
        });

        const fullUrl = url.startsWith("http") ? url : `https://models.readyplayer.me/${url}`;

        BABYLON.SceneLoader.ImportMesh(
          "",
          fullUrl,
          "",
          scene,
          (meshes, particleSystems, skeletons, animationGroups) => {
            if (meshes.length === 0) {
              setAvatarError("Avatar loaded but no meshes were found");
              setIsLoading(false);
              loadingRef.current = false;
              return;
            }

            const avatarMesh = meshes[0];
            avatarMesh.name = "_Character_";
            avatarMesh.scaling = new BABYLON.Vector3(1, 1, 1);
            avatarMesh.position = new BABYLON.Vector3(0, 0, 0);

            avatarMesh.setEnabled(false);

            avatarRef.current = avatarMesh;
            setAvatarLoaded(true);

            if (onAvatarLoaded) {
              onAvatarLoaded(avatarMesh);
            }

            loadingRef.current = false;
          },
          null,
          (scene, message, exception) => {
            setAvatarError(`Failed to load avatar: ${message}`);
            setIsLoading(false);
            loadingRef.current = false;
          }
        );
      } catch (error) {
        setAvatarError(`Failed to load avatar: ${error.message}`);
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    [onAvatarLoaded, BABYLON]
  );

  useEffect(() => {
    if (avatarUrl && sceneRef.current && sceneReady && !loadingRef.current) {
      loadAvatar(avatarUrl);
    }
  }, [avatarUrl, sceneReady, loadAvatar]);

  useEffect(() => {
    if (
      avatarRef.current &&
      avatarLoaded &&
      animationsInitialized &&
      avatarUrl &&
      !animationsLoadedRef.current
    ) {
      animationsLoadedRef.current = true;

      setTimeout(() => {
        loadAvatarAnimations(avatarUrl).then((result) => {
          if (!result.success) {
            animationsLoadedRef.current = false;
            setIsLoading(false);

            if (avatarRef.current) {
              avatarRef.current.setEnabled(false);
            }
          } else {
            if (triggerAIResponseAnimation && animationService && animationService.isReady()) {
              registerAIResponseCallback(() => {
                triggerAIResponseAnimation("all");
              });
            }

            // Enhanced avatar entrance animation - faster timing
            setTimeout(() => {
              setIsLoading(false);
              setAvatarFullyReady(true);

              if (avatarRef.current) {
                // Start avatar invisible for smooth entrance
                avatarRef.current.setEnabled(true);

                // Apply initial invisible state
                const childMeshes = avatarRef.current.getChildMeshes();
                childMeshes.forEach((mesh) => {
                  if (mesh.material) {
                    // Store original alpha values
                    if (!mesh.material.originalAlpha) {
                      mesh.material.originalAlpha = mesh.material.alpha || 1;
                    }
                    mesh.material.alpha = 0;
                  }
                });

                // Animated entrance with gradual fade-in and scale - faster animation
                let progress = 0;
                const animationDuration = 1500; // Reduced from 2.5s to 1.5s
                const startTime = Date.now();

                const animateEntrance = () => {
                  const elapsed = Date.now() - startTime;
                  progress = Math.min(elapsed / animationDuration, 1);

                  // Smooth easing function for dramatic effect
                  const easeOutCubic = 1 - Math.pow(1 - progress, 3);
                  const easeInOutQuart =
                    progress < 0.5
                      ? 8 * progress * progress * progress * progress
                      : 1 - Math.pow(-2 * progress + 2, 4) / 2;

                  // Apply alpha fade-in
                  childMeshes.forEach((mesh) => {
                    if (mesh.material && mesh.material.originalAlpha) {
                      mesh.material.alpha = mesh.material.originalAlpha * easeOutCubic;
                    }
                  });

                  // Apply scale and position transformation
                  if (avatarRef.current) {
                    const scale = 0.8 + 0.2 * easeInOutQuart; // Scale from 0.8 to 1
                    const yOffset = (1 - easeInOutQuart) * -0.3; // Float down from above

                    avatarRef.current.scaling = new BABYLON.Vector3(scale, scale, scale);
                    avatarRef.current.position.y = yOffset;
                  }

                  if (progress < 1) {
                    requestAnimationFrame(animateEntrance);
                  } else {
                    // Animation complete - final state
                    if (avatarRef.current) {
                      avatarRef.current.scaling = new BABYLON.Vector3(1, 1, 1);
                      avatarRef.current.position.y = 0;
                    }
                    childMeshes.forEach((mesh) => {
                      if (mesh.material && mesh.material.originalAlpha) {
                        mesh.material.alpha = mesh.material.originalAlpha;
                      }
                    });
                  }
                };

                // Start the entrance animation with reduced delay
                setTimeout(() => {
                  animateEntrance();
                }, 200); // Reduced from 500ms to 200ms
              }
            }, 400); // Reduced from 1000ms to 400ms
          }
        });
      }, 100); // Reduced from 200ms to 100ms
    }
  }, [
    avatarLoaded,
    animationsInitialized,
    avatarUrl,
    loadAvatarAnimations,
    triggerAIResponseAnimation,
    animationService,
    registerAIResponseCallback,
    BABYLON?.Vector3, // Added to satisfy exhaustive-deps
  ]);

  useEffect(() => {
    if (avatarError) {
      if (localStorage.getItem("rpmAvatarUrl")) {
        localStorage.removeItem("rpmAvatarUrl");
      }

      setShowCreator(true);

      setAvatarError(null);
      setAvatarUrl(null);
    }
  }, [avatarError]);

  // Handle triggerAvatarCustomization prop from App component
  useEffect(() => {
    if (triggerAvatarCustomization && BABYLON) {
      setShowCreator(true);
    }
  }, [triggerAvatarCustomization, BABYLON]);

  const handleAvatarExported = (response) => {
    const urlValue = typeof response === "object" && response.data ? response.data.url : response;

    const avatarUrl =
      typeof urlValue === "string" && urlValue.endsWith(".glb") ? urlValue : `${urlValue}.glb`;

    const cacheBustedUrl = avatarUrl.includes("?")
      ? `${avatarUrl}&t=${Date.now()}`
      : `${avatarUrl}?t=${Date.now()}`;

    localStorage.setItem("rpmAvatarUrl", cacheBustedUrl);

    setIsLoading(true);
    setAvatarFullyReady(false);

    if (avatarRef.current) {
      avatarRef.current = null;
    }

    setTimeout(() => {
      setAvatarUrl(cacheBustedUrl);
      setShowCreator(false);
    }, 100);
  };

  return (
    <div className="ready-player-me-avatar">
      {/* Show loading state while Babylon.js is loading - hidden in fullscreen */}
      {babylonLoading && !fullscreen && <div className="avatar-loading">Loading 3D engine...</div>}

      {/* Show error if Babylon.js failed to load - hidden in fullscreen */}
      {babylonError && !fullscreen && (
        <div className="avatar-error">Failed to load 3D engine: {babylonError.message}</div>
      )}

      {/* Show normal loading states only after Babylon.js is loaded - hidden in fullscreen */}
      {BABYLON &&
        (isLoading || (avatarUrl && !avatarFullyReady)) &&
        !showCreator &&
        !fullscreen && <div className="avatar-loading">Loading avatar...</div>}

      {BABYLON && !avatarUrl && !showCreator && !isLoading && !fullscreen && (
        <div className="no-avatar-message">
          <p>No avatar created yet</p>
          <button className="customize-avatar-button" onClick={() => setShowCreator(true)}>
            Create Avatar
          </button>
        </div>
      )}

      {BABYLON && avatarUrl && !showCreator && !fullscreen && (
        <button className="customize-avatar-button" onClick={() => setShowCreator(true)}>
          Customize Avatar
        </button>
      )}

      {/* Close button rendered outside the container, at the top level */}
      {BABYLON && showCreator && (
        <button
          className="creator-close-button"
          onClick={() => setShowCreator(false)}
          aria-label="Close avatar creator"
        >
          Close Editor
        </button>
      )}

      {/* Avatar creator container without the close button inside */}
      {BABYLON && showCreator && (
        <div className="avatar-creator-container">
          <AvatarCreator
            clientId={RPM_CLIENT_ID}
            subdomain="ar-avatar-39283x"
            style={{ width: "100%", height: "100%" }}
            onAvatarExported={handleAvatarExported}
            onError={() => setShowCreator(true)}
            avatarId={avatarUrl && avatarUrl.split("/").pop().split(".")[0].split("?")[0]}
            bodyType="fullbody"
            clearCache={true}
          />
        </div>
      )}
    </div>
  );
};

export default ReadyPlayerMeAvatar;
