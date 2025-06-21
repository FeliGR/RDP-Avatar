import { AvatarCreator } from "@readyplayerme/react-avatar-creator";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAvatarAnimations } from "../hooks/useAvatarAnimations.js";
import { useAIResponseAnimations } from "../hooks/useAIResponseAnimations.js";
import { useOfficeEnvironment } from "../hooks/useOfficeEnvironment.js";
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
  triggerAvatarCustomization = false,
  showCreator,
  setShowCreator,
  triggerZoomEffect = false,
}) => {
  const { BABYLON, isLoading: babylonLoading, error: babylonError } = useBabylonJS();
  const savedAvatarUrl = localStorage.getItem("rpmAvatarUrl");
  const [avatarUrl, setAvatarUrl] = useState(savedAvatarUrl || null);
  const [isLoading, setIsLoading] = useState(!!savedAvatarUrl);
  const [avatarError, setAvatarError] = useState(null);
  const [avatarLoaded, setAvatarLoaded] = useState(false);
  const [avatarFullyReady, setAvatarFullyReady] = useState(false);
  const avatarRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
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
  const {
    environmentInitialized,
    isInitializing: environmentInitializing,
    error: environmentError,
    startOfficeAnimations,
  } = useOfficeEnvironment(animationService);
  useEffect(() => {
    if (animationService) {
      registerAnimationService(animationService);
    }
  }, [animationService, registerAnimationService]);
  useEffect(() => {
    if (!BABYLON || !canvasRef.current) return;
    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.55, 0.71, 1.0, 1.0);
    const camera = new BABYLON.ArcRotateCamera(
      "camera",
      BABYLON.Tools.ToRadians(-90),
      BABYLON.Tools.ToRadians(65),
      6,
      new BABYLON.Vector3(0, 1.25, 0),
      scene
    );
    camera.attachControl(canvasRef.current, true);
    camera.allowUpsideDown = false;
    camera.panningSensibility = 0;
    camera.lowerRadiusLimit = 1.5;
    camera.upperRadiusLimit = 16;
    camera.lowerBetaLimit = 0.75;
    camera.upperBetaLimit = Math.PI / 2;
    camera.pinchDeltaPercentage = 0.0006;
    camera.wheelPrecision = 60;
    camera.useBouncingBehavior = false;
    camera.alpha = 1.57;
    camera.beta = 1.42;
    camera.radius = 15;
    
    
    cameraRef.current = camera;
    const hemiLight = new BABYLON.HemisphericLight(
      "hemiLight",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    hemiLight.intensity = 0.15;
    const dirLight = new BABYLON.DirectionalLight(
      "dirLight",
      new BABYLON.Vector3(-2, -7, -5),
      scene
    );
    dirLight.intensity = 1.75;
    dirLight.position = new BABYLON.Vector3(0, 30, 10);
    dirLight.shadowMinZ = -100;
    dirLight.shadowMaxZ = 100;
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight, true);
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

  
  useEffect(() => {
    if (triggerZoomEffect && BABYLON && cameraRef.current && sceneRef.current) {
      const camera = cameraRef.current;
      const scene = sceneRef.current.scene;

      const startRadius = camera.radius;
      const targetRadius = 6;
      const duration = 2500;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 2);

        camera.radius = startRadius + (targetRadius - startRadius) * easeOut;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [triggerZoomEffect, BABYLON]);

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
          const isAvatarMesh =
            mesh.name === "_Character_" ||
            mesh.name.includes("Armature") ||
            mesh.name.includes("Character") ||
            mesh.name.includes("Wolf3D") ||
            mesh.name.includes("Body") ||
            mesh.name.includes("Head") ||
            mesh.name.includes("Hair") ||
            mesh.name.includes("Outfit") ||
            mesh.name.includes("Top") ||
            mesh.name.includes("Bottom") ||
            mesh.name.includes("Shoes") ||
            mesh.name.includes("Accessory");
          const isOfficeMesh =
            mesh.name.includes("Base") ||
            mesh.name.includes("Chair") ||
            mesh.name.includes("TV") ||
            mesh.name.includes("Lamp") ||
            mesh.name.includes("Table") ||
            mesh.name.includes("Sphere") ||
            mesh.name.includes("Vinils") ||
            mesh.name.includes("cloud") ||
            mesh.name === "skybox" ||
            mesh.name === "__root__" ||
            mesh._isOfficeEnvironment;
          const shouldKeep = !isAvatarMesh || isOfficeMesh;
          const isFarAway =
            mesh.position &&
            (Math.abs(mesh.position.x) > 50000 ||
              Math.abs(mesh.position.y) > 50000 ||
              Math.abs(mesh.position.z) > 50000);
          if (!shouldKeep || isFarAway) {
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
            avatarMesh.rotation = new BABYLON.Vector3(0, 0, 0);
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
            setTimeout(() => {
              setIsLoading(false);
              setAvatarFullyReady(true);
              if (avatarRef.current) {
                avatarRef.current.setEnabled(true);
                setTimeout(() => {
                  if (startOfficeAnimations) {
                    startOfficeAnimations();
                  }
                  if (
                    animationService?.sceneManager?.officeEnvironment?.checkEnvironmentIntegrity
                  ) {
                    animationService.sceneManager.officeEnvironment.checkEnvironmentIntegrity();
                  }
                }, 500);
              }
            }, 100);
          }
        });
      }, 100);
    }
  }, [
    avatarLoaded,
    animationsInitialized,
    avatarUrl,
    loadAvatarAnimations,
    triggerAIResponseAnimation,
    animationService,
    registerAIResponseCallback,
    BABYLON?.Vector3,
    startOfficeAnimations,
  ]);
  useEffect(() => {
    if (avatarError) {
      if (localStorage.getItem("rpmAvatarUrl")) {
        localStorage.removeItem("rpmAvatarUrl");
      }
      if (setShowCreator) {
        setShowCreator(true);
      }
      setAvatarError(null);
      setAvatarUrl(null);
    }
  }, [avatarError, setShowCreator]);
  useEffect(() => {
    if (triggerAvatarCustomization && BABYLON && setShowCreator) {
      setShowCreator(true);
    }
  }, [triggerAvatarCustomization, BABYLON, setShowCreator]);
  useEffect(() => {
    if (setShowCreator && showCreator === undefined) {
      setShowCreator(!savedAvatarUrl);
    }
  }, [savedAvatarUrl, showCreator, setShowCreator]);
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
      if (setShowCreator) {
        setShowCreator(false);
      }
    }, 100);
  };
  return (
    <div className="ready-player-me-avatar">
      {babylonLoading && !fullscreen && <div className="avatar-loading">Loading 3D engine...</div>}
      {babylonError && !fullscreen && (
        <div className="avatar-error">Failed to load 3D engine: {babylonError.message}</div>
      )}
      {BABYLON && !fullscreen && (
        <div className="office-environment-status">
          {environmentInitializing && (
            <div className="environment-loading">Loading office environment...</div>
          )}
          {environmentError && (
            <div className="environment-error">Office environment: {environmentError}</div>
          )}
          {environmentInitialized && (
            <div className="environment-ready">✅ Office environment ready</div>
          )}
        </div>
      )}
      {BABYLON &&
        (isLoading || (avatarUrl && !avatarFullyReady)) &&
        !showCreator &&
        !fullscreen && <div className="avatar-loading">Loading avatar...</div>}
      {BABYLON && !avatarUrl && !showCreator && !isLoading && !fullscreen && (
        <div className="no-avatar-message">
          <p>No avatar created yet</p>
          <button
            className="customize-avatar-button"
            onClick={() => setShowCreator && setShowCreator(true)}
          >
            Create Avatar
          </button>
        </div>
      )}
      {BABYLON && avatarUrl && !showCreator && !fullscreen && (
        <button
          className="customize-avatar-button"
          onClick={() => setShowCreator && setShowCreator(true)}
        >
          Customize Avatar
        </button>
      )}
      {BABYLON && showCreator && (
        <button
          className="creator-close-button"
          onClick={() => setShowCreator && setShowCreator(false)}
          aria-label="Close avatar creator"
        >
          Close Editor
        </button>
      )}
      {BABYLON && showCreator && (
        <div className="avatar-creator-container">
          <AvatarCreator
            clientId={RPM_CLIENT_ID}
            subdomain="ar-avatar-39283x"
            style={{ width: "100%", height: "100%" }}
            onAvatarExported={handleAvatarExported}
            onError={() => setShowCreator && setShowCreator(true)}
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
