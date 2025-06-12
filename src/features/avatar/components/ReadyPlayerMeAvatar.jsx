import { AvatarCreator } from "@readyplayerme/react-avatar-creator";
import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import React, { useEffect, useRef, useState } from "react";
import { useAvatarAnimations } from "../hooks/useAvatarAnimations.js";
import "./ReadyPlayerMeAvatar.css";

// Get RPM Client ID from environment variable
const RPM_CLIENT_ID = process.env.REACT_APP_RPM_CLIENT_ID || "684b2978d8c346fff8566d83";

const ReadyPlayerMeAvatar = ({
  canvasRef,
  onAvatarLoaded,
}) => {
  // Get avatar URL from localStorage or use null
  const savedAvatarUrl = localStorage.getItem("rpmAvatarUrl");
  const [avatarUrl, setAvatarUrl] = useState(savedAvatarUrl || null);
  const [showCreator, setShowCreator] = useState(!savedAvatarUrl);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(null);
  const avatarRef = useRef(null);
  const sceneRef = useRef(null);
  const shadowGeneratorRef = useRef(null);
  const [sceneReady, setSceneReady] = useState(false);
  const loadingRef = useRef(false); // Flag to prevent duplicate loads
  const animationsLoadedRef = useRef(false); // Flag to prevent duplicate animation loads

  // Animation system integration - se inicializa cuando la escena está lista
  const {
    isInitialized: animationsInitialized,
    loadAvatarAnimations,
  } = useAvatarAnimations(
    sceneReady ? sceneRef.current?.scene : null, 
    sceneReady ? shadowGeneratorRef.current : null
  );

  // Initialize Babylon.js scene
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);

    // Configure scene
    scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);

    // Create camera
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

    // Add lighting
    const light1 = new BABYLON.HemisphericLight(
      "light1",
      new BABYLON.Vector3(0, 1, 0),
      scene
    );
    light1.intensity = 0.7;

    const light2 = new BABYLON.DirectionalLight(
      "light2",
      new BABYLON.Vector3(0, -1, 1),
      scene
    );
    light2.intensity = 0.5;

    // Create shadow generator for animations
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light2, true);
    shadowGenerator.darkness = 0.4;
    shadowGenerator.bias = 0.001;
    shadowGenerator.usePercentageCloserFiltering = true;
    shadowGenerator.filteringQuality = 1;
    shadowGeneratorRef.current = shadowGenerator;

    // Run render loop
    engine.runRenderLoop(() => {
      scene.render();
    });

    // Handle browser resize
    window.addEventListener("resize", () => {
      engine.resize();
    });

    sceneRef.current = { scene, engine };
    
    // Marcar la escena como lista para las animaciones
    setSceneReady(true);

    // Note: Avatar loading is handled by the separate effect when sceneReady becomes true

    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", engine.resize);
      engine.dispose();
      scene.dispose();
    };
  }, [canvasRef]);

  // Load avatar when URL changes and scene is ready
  useEffect(() => {
    if (avatarUrl && sceneRef.current && sceneReady && !loadingRef.current) {
      loadAvatar(avatarUrl);
    }
  }, [avatarUrl, sceneReady]);

  // Effect to load animations when both avatar and animation system are ready
  useEffect(() => {
    if (avatarRef.current && animationsInitialized && avatarUrl && !animationsLoadedRef.current) {
      animationsLoadedRef.current = true;
      
      // Add a small delay to ensure the avatar is fully loaded and all meshes are in the scene
      setTimeout(() => {
        loadAvatarAnimations(avatarUrl).then((result) => {
          if (!result.success) {
            animationsLoadedRef.current = false; // Reset on failure to allow retry
          }
        });
      }, 200); // Small delay to ensure avatar is fully settled in scene
    }
  }, [avatarRef.current, animationsInitialized, avatarUrl, loadAvatarAnimations]);

  // Effect to handle avatar errors by showing the avatar creator
  useEffect(() => {
    if (avatarError) {
      // Clear the stored URL if it's causing errors
      if (localStorage.getItem("rpmAvatarUrl")) {
        localStorage.removeItem("rpmAvatarUrl");
      }

      // Show the avatar creator when there's an error
      setShowCreator(true);

      // Clear the error since we're handling it
      setAvatarError(null);
      setAvatarUrl(null);
    }
  }, [avatarError]);

  // Handle avatar creator completion
  const handleAvatarExported = (response) => {

    // Extract the URL from the response object
    // The response can be either a direct URL string (old API) or an object with data.url (new API)
    const urlValue =
      typeof response === "object" && response.data
        ? response.data.url
        : response;

    // Ensure the URL points to a GLB file
    const avatarUrl =
      typeof urlValue === "string" && urlValue.endsWith(".glb")
        ? urlValue
        : `${urlValue}.glb`;

    // Add cache-busting parameter to force reload of the model
    const cacheBustedUrl = avatarUrl.includes("?")
      ? `${avatarUrl}&t=${Date.now()}`
      : `${avatarUrl}?t=${Date.now()}`;

    // Save to localStorage and update state
    localStorage.setItem("rpmAvatarUrl", cacheBustedUrl);

    // Set loading state before changing URL to ensure visual feedback
    setIsLoading(true);

    // Clear current avatar reference to force complete reload
    if (avatarRef.current) {
      avatarRef.current = null;
    }

    // Update the avatar URL with a slight delay to ensure clean scene transition
    setTimeout(() => {
      setAvatarUrl(cacheBustedUrl);
      setShowCreator(false);
    }, 100);
  };

  // Load Ready Player Me avatar
  const loadAvatar = async (url) => {
    if (!sceneRef.current || !sceneRef.current.scene || loadingRef.current) return;

    loadingRef.current = true;
    animationsLoadedRef.current = false; // Reset animations flag for new avatar
    setIsLoading(true);
    setAvatarError(null);

    try {
      const { scene } = sceneRef.current;

      // More thorough cleanup of existing avatar and all its children
      if (avatarRef.current) {
        // Dispose all meshes associated with the previous avatar
        if (Array.isArray(avatarRef.current.getChildMeshes)) {
          const childMeshes = avatarRef.current.getChildMeshes();
          childMeshes.forEach((mesh) => {
            if (mesh.material) {
              mesh.material.dispose();
            }
            mesh.dispose();
          });
        }
        // Dispose the root mesh
        avatarRef.current.dispose();
        avatarRef.current = null;
      }

      // Clear any other meshes in the scene that might be from previous loads or animations
      const sceneMeshes = scene.meshes.slice(); // Create a copy to avoid modification during iteration
      
      let disposedCount = 0;
      sceneMeshes.forEach((mesh) => {
        // Only dispose meshes that aren't part of the scene infrastructure
        // Also clean up any animation meshes that might be lingering
        const shouldKeep = mesh.name === "camera" || 
                          mesh.name.includes("light") || 
                          mesh.name.includes("__root__") ||
                          mesh.name === "ground" ||
                          mesh.name === "skybox" ||
                          mesh.name.includes("Sphere") || // Keep environment spheres
                          mesh.name.includes("Base") ||   // Keep base/ground elements
                          mesh.name.includes("TV");       // Keep TV elements
        
        // Also check if mesh is positioned very far away (likely animation mesh)
        const isFarAway = mesh.position && (
          Math.abs(mesh.position.x) > 50000 || 
          Math.abs(mesh.position.y) > 50000 || 
          Math.abs(mesh.position.z) > 50000
        );
        
        if (!shouldKeep || isFarAway) {
          console.log("Disposing mesh:", mesh.name, isFarAway ? "(far away)" : "");
          
          try {
            // Dispose child meshes first
            const childMeshes = mesh.getChildMeshes();
            childMeshes.forEach(childMesh => {
              if (childMesh.material) {
                childMesh.material.dispose();
              }
              childMesh.dispose();
            });
            
            // Dispose the mesh itself
            if (mesh.material) {
              mesh.material.dispose();
            }
            mesh.dispose();
            disposedCount++;
          } catch (error) {
            // Silently handle disposal errors
          }
        }
      });

      // Ensure we have a full URL
      const fullUrl = url.startsWith("http")
        ? url
        : `https://models.readyplayer.me/${url}`;

      // Load avatar using ImportMesh for better error handling
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
          avatarMesh.name = "_Character_"; // Set the name to match reference code pattern
          avatarMesh.scaling = new BABYLON.Vector3(1, 1, 1);
          avatarMesh.position = new BABYLON.Vector3(0, 0, 0);

          avatarRef.current = avatarMesh;

          // Notify parent that avatar is loaded
          if (onAvatarLoaded) {
            onAvatarLoaded(avatarMesh);
          }

          setIsLoading(false);
          loadingRef.current = false;
        },
        (progressEvent) => {
          // Progress update (silent)
          const loadProgress = progressEvent.lengthComputable
            ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
            : 0;
        },
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
  };

  // Reset camera to default position
  const resetCamera = () => {
    if (sceneRef.current && sceneRef.current.scene) {
      const camera = sceneRef.current.scene.getCameraByName("camera");
      if (camera && camera instanceof BABYLON.ArcRotateCamera) {
        camera.alpha = -Math.PI / 2;
        camera.beta = Math.PI / 2.5;
        camera.radius = 3;
        camera.target = new BABYLON.Vector3(0, 1, 0);
      }
    }
  };

  return (
    <div className="ready-player-me-avatar">
      {isLoading && <div className="avatar-loading">Loading avatar...</div>}

      {!avatarUrl && !showCreator && !isLoading && (
        <div className="no-avatar-message">
          <p>No avatar created yet</p>
          <button
            className="customize-avatar-button"
            onClick={() => setShowCreator(true)}
          >
            Create Avatar
          </button>
        </div>
      )}

      {avatarUrl && !showCreator && (
        <button
          className="customize-avatar-button"
          onClick={() => setShowCreator(true)}
        >
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
            className="avatar-creator"
            onAvatarExported={handleAvatarExported}
            onUserSet={() => {}}
            onError={(error) => {
              // Even if there's an error with the creator, keep it open
              // so the user can try again instead of going back to an error state
              setShowCreator(true);
            }}
            // Pass the current avatar URL to load it for editing
            avatarId={
              avatarUrl &&
              avatarUrl.split("/").pop().split(".")[0].split("?")[0]
            }
            // Allow editing full body avatar
            bodyType="fullbody"
            // Ensure the latest version of the avatar is loaded (avoid caching)
            clearCache={true}
          />
        </div>
      )}
    </div>
  );
};

export default ReadyPlayerMeAvatar;
