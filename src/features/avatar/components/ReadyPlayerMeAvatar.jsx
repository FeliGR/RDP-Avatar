import { AvatarCreator } from "@readyplayerme/react-avatar-creator";
import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useAvatarAnimations } from "../hooks/useAvatarAnimations.js";
import { useAIResponseAnimations } from "../hooks/useAIResponseAnimations.js";
import { useAvatarAnimation } from "../context/AvatarAnimationContext.js";
import "./ReadyPlayerMeAvatar.css";

const RPM_CLIENT_ID =
  (window.ENV && window.ENV.REACT_APP_RPM_CLIENT_ID) ||
  process.env.REACT_APP_RPM_CLIENT_ID ||
  "684b2978d8c346fff8566d83";

const ReadyPlayerMeAvatar = ({ canvasRef, onAvatarLoaded }) => {
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
    if (!canvasRef.current) return;

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
  }, [canvasRef]);

  const loadAvatar = useCallback(
    async (url) => {
      if (!sceneRef.current || !sceneRef.current.scene || loadingRef.current) return;

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
    [onAvatarLoaded]
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
              }
            }, 1000);
          }
        });
      }, 200);
    }
  }, [
    avatarLoaded,
    animationsInitialized,
    avatarUrl,
    loadAvatarAnimations,
    triggerAIResponseAnimation,
    animationService,
    registerAIResponseCallback,
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
      {(isLoading || (avatarUrl && !avatarFullyReady)) && !showCreator && (
        <div className="avatar-loading">Loading avatar...</div>
      )}

      {!avatarUrl && !showCreator && !isLoading && (
        <div className="no-avatar-message">
          <p>No avatar created yet</p>
          <button className="customize-avatar-button" onClick={() => setShowCreator(true)}>
            Create Avatar
          </button>
        </div>
      )}

      {avatarUrl && !showCreator && (
        <button className="customize-avatar-button" onClick={() => setShowCreator(true)}>
          Customize Avatar
        </button>
      )}

      {/* Close button rendered outside the container, at the top level */}
      {showCreator && (
        <button
          className="creator-close-button"
          onClick={() => setShowCreator(false)}
          aria-label="Close avatar creator"
        >
          Close Editor
        </button>
      )}

      {/* Avatar creator container without the close button inside */}
      {showCreator && (
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
