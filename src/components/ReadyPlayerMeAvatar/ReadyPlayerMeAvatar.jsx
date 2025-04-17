import * as BABYLON from "babylonjs";
import "babylonjs-loaders"; // Important for loading GLB files
import React, { useEffect, useRef, useState } from "react";
import { AVATAR_STATES, SENTIMENTS } from "../../features/babylon/avatarScene";
import "./ReadyPlayerMeAvatar.css";

// Use a public demo avatar as fallback
const DEFAULT_AVATAR_URL = "https://models.readyplayer.me/65a682d88673952a1d7a863a.glb";

const ReadyPlayerMeAvatar = ({ 
  canvasRef,
  onAvatarLoaded,
  avatarState,
  sentiment,
  personalityTraits
}) => {
  const [avatarUrl, setAvatarUrl] = useState(localStorage.getItem("rpmAvatarUrl") || DEFAULT_AVATAR_URL);
  const [showCreator, setShowCreator] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const avatarRef = useRef(null);
  const sceneRef = useRef(null);
  const animationsRef = useRef({});
  const iframeRef = useRef(null);

  // Initialize the iframe API for Ready Player Me
  useEffect(() => {
    if (showCreator) {
      // Set up message listener for iframe communication
      const handleMessage = (event) => {
        if (event.data.type === 'v1.frame.ready') {
          console.log('Ready Player Me iframe is ready');
        } else if (event.data.type === 'v1.avatar.exported') {
          console.log('Avatar exported:', event.data.data.url);
          handleAvatarCreated(event.data.data.url);
        } else if (event.data.type === 'v1.frame.error') {
          console.error('Error creating avatar:', event.data.data);
        }
      };

      window.addEventListener('message', handleMessage);
      
      return () => {
        window.removeEventListener('message', handleMessage);
      };
    }
  }, [showCreator]);

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
    
    // Run render loop
    engine.runRenderLoop(() => {
      scene.render();
    });
    
    // Handle browser resize
    window.addEventListener("resize", () => {
      engine.resize();
    });
    
    sceneRef.current = { scene, engine };
    
    // Load avatar on scene initialization
    loadAvatar(avatarUrl);
    
    // Cleanup on unmount
    return () => {
      window.removeEventListener("resize", engine.resize);
      engine.dispose();
      scene.dispose();
    };
  }, [canvasRef]);

  // Load Ready Player Me avatar
  const loadAvatar = async (url) => {
    if (!sceneRef.current || !sceneRef.current.scene) return;
    
    setIsLoading(true);
    
    try {
      const { scene } = sceneRef.current;
      
      // Clear existing avatar
      if (avatarRef.current) {
        avatarRef.current.dispose();
        avatarRef.current = null;
      }
      
      // Load the avatar from URL
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        "",
        url,
        "",
        scene
      );
      
      const avatarMesh = result.meshes[0];
      avatarMesh.scaling = new BABYLON.Vector3(1, 1, 1);
      avatarMesh.position = new BABYLON.Vector3(0, 0, 0);
      
      // Store animations
      const skeleton = result.skeletons[0];
      if (skeleton) {
        // Store animations for later use
        setupAnimations(skeleton, scene);
      }
      
      avatarRef.current = avatarMesh;
      
      // Notify parent that avatar is loaded
      if (onAvatarLoaded) {
        onAvatarLoaded(avatarMesh);
      }
      
      // Start idle animation
      playAnimation(AVATAR_STATES.IDLE);
      
    } catch (error) {
      console.error("Error loading Ready Player Me avatar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Setup animations from the avatar's skeleton
  const setupAnimations = (skeleton, scene) => {
    const animations = {
      [AVATAR_STATES.IDLE]: createIdleAnimation(skeleton, scene),
      [AVATAR_STATES.SPEAKING]: createSpeakingAnimation(skeleton, scene),
      [AVATAR_STATES.LISTENING]: createListeningAnimation(skeleton, scene),
      [AVATAR_STATES.THINKING]: createThinkingAnimation(skeleton, scene)
    };
    
    animationsRef.current = animations;
  };

  // Create idle animation
  const createIdleAnimation = (skeleton, scene) => {
    const idleAnim = new BABYLON.Animation(
      "idleAnim",
      "position.y",
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );
    
    const keyFrames = [];
    keyFrames.push({ frame: 0, value: 0 });
    keyFrames.push({ frame: 30, value: 0.01 });
    keyFrames.push({ frame: 60, value: 0 });
    
    idleAnim.setKeys(keyFrames);
    
    const idleGroup = new BABYLON.AnimationGroup("idleGroup", scene);
    
    const headBone = findBone(skeleton, "Head");
    if (headBone) {
      const headAnim = new BABYLON.Animation(
        "headIdleAnim",
        "rotationQuaternion",
        30,
        BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );
      
      const baseRotation = headBone.rotationQuaternion.clone();
      const q1 = BABYLON.Quaternion.RotationAxis(
        BABYLON.Axis.Y,
        0.02
      ).multiply(baseRotation);
      const q2 = BABYLON.Quaternion.RotationAxis(
        BABYLON.Axis.Y,
        -0.02
      ).multiply(baseRotation);
      
      const headFrames = [];
      headFrames.push({ frame: 0, value: baseRotation });
      headFrames.push({ frame: 30, value: q1 });
      headFrames.push({ frame: 60, value: q2 });
      headFrames.push({ frame: 90, value: baseRotation });
      
      headAnim.setKeys(headFrames);
      idleGroup.addTargetedAnimation(headAnim, headBone);
    }
    
    return idleGroup;
  };

  // Create speaking animation
  const createSpeakingAnimation = (skeleton, scene) => {
    const speakGroup = new BABYLON.AnimationGroup("speakGroup", scene);
    
    const jawBone = findBone(skeleton, "Jaw");
    if (jawBone) {
      const jawAnim = new BABYLON.Animation(
        "jawAnim",
        "rotationQuaternion",
        15,
        BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );
      
      const baseRotation = jawBone.rotationQuaternion.clone();
      const openJaw = BABYLON.Quaternion.RotationAxis(
        BABYLON.Axis.X,
        -0.2
      ).multiply(baseRotation);
      
      const jawFrames = [];
      jawFrames.push({ frame: 0, value: baseRotation });
      jawFrames.push({ frame: 5, value: openJaw });
      jawFrames.push({ frame: 10, value: baseRotation });
      jawFrames.push({ frame: 15, value: openJaw });
      jawFrames.push({ frame: 20, value: baseRotation });
      
      jawAnim.setKeys(jawFrames);
      speakGroup.addTargetedAnimation(jawAnim, jawBone);
    }
    
    const headBone = findBone(skeleton, "Head");
    if (headBone) {
      const headAnim = new BABYLON.Animation(
        "speakingHeadAnim",
        "rotationQuaternion",
        30,
        BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );
      
      const baseRotation = headBone.rotationQuaternion.clone();
      const nodDown = BABYLON.Quaternion.RotationAxis(
        BABYLON.Axis.X,
        0.05
      ).multiply(baseRotation);
      
      const headFrames = [];
      headFrames.push({ frame: 0, value: baseRotation });
      headFrames.push({ frame: 15, value: nodDown });
      headFrames.push({ frame: 30, value: baseRotation });
      
      headAnim.setKeys(headFrames);
      speakGroup.addTargetedAnimation(headAnim, headBone);
    }
    
    return speakGroup;
  };

  // Create listening animation
  const createListeningAnimation = (skeleton, scene) => {
    const listenGroup = new BABYLON.AnimationGroup("listenGroup", scene);
    
    const headBone = findBone(skeleton, "Head");
    if (headBone) {
      const headAnim = new BABYLON.Animation(
        "listeningHeadAnim",
        "rotationQuaternion",
        30,
        BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );
      
      const baseRotation = headBone.rotationQuaternion.clone();
      const tiltLeft = BABYLON.Quaternion.RotationAxis(
        BABYLON.Axis.Z,
        0.1
      ).multiply(baseRotation);
      const tiltRight = BABYLON.Quaternion.RotationAxis(
        BABYLON.Axis.Z,
        -0.08
      ).multiply(baseRotation);
      
      const headFrames = [];
      headFrames.push({ frame: 0, value: baseRotation });
      headFrames.push({ frame: 20, value: tiltLeft });
      headFrames.push({ frame: 40, value: baseRotation });
      headFrames.push({ frame: 60, value: tiltRight });
      headFrames.push({ frame: 80, value: baseRotation });
      
      headAnim.setKeys(headFrames);
      listenGroup.addTargetedAnimation(headAnim, headBone);
    }
    
    return listenGroup;
  };

  // Create thinking animation
  const createThinkingAnimation = (skeleton, scene) => {
    const thinkGroup = new BABYLON.AnimationGroup("thinkGroup", scene);
    
    const headBone = findBone(skeleton, "Head");
    if (headBone) {
      const headAnim = new BABYLON.Animation(
        "thinkingHeadAnim",
        "rotationQuaternion",
        30,
        BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
        BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
      );
      
      const baseRotation = headBone.rotationQuaternion.clone();
      const lookUp = BABYLON.Quaternion.RotationAxis(
        BABYLON.Axis.X,
        -0.1
      ).multiply(baseRotation);
      const lookDown = BABYLON.Quaternion.RotationAxis(
        BABYLON.Axis.X,
        0.1
      ).multiply(baseRotation);
      
      const headFrames = [];
      headFrames.push({ frame: 0, value: baseRotation });
      headFrames.push({ frame: 20, value: lookUp });
      headFrames.push({ frame: 40, value: lookDown });
      headFrames.push({ frame: 60, value: baseRotation });
      
      headAnim.setKeys(headFrames);
      thinkGroup.addTargetedAnimation(headAnim, headBone);
    }
    
    return thinkGroup;
  };

  // Find bone by name in skeleton
  const findBone = (skeleton, boneName) => {
    return skeleton.bones.find(
      bone => bone.name.toLowerCase().includes(boneName.toLowerCase())
    );
  };

  // Play animation based on state
  const playAnimation = (state, sentimentValue = SENTIMENTS.NEUTRAL) => {
    Object.values(animationsRef.current).forEach(anim => {
      if (anim && anim.isPlaying) {
        anim.stop();
      }
    });
    
    const animation = animationsRef.current[state];
    if (animation) {
      animation.play(true);
    }
    
    if (avatarRef.current && sceneRef.current) {
      const skeleton = sceneRef.current.scene.skeletons[0];
      if (skeleton) {
        applyFacialExpression(skeleton, sentimentValue);
      }
    }
  };

  // Apply facial expressions based on sentiment
  const applyFacialExpression = (skeleton, sentiment) => {
    const browBone = findBone(skeleton, "Brow");
    const mouthBone = findBone(skeleton, "Mouth");
    const jawBone = findBone(skeleton, "Jaw");
    
    if (!browBone && !mouthBone && !jawBone) {
      return;
    }
    
    if (browBone) {
      browBone.rotation = new BABYLON.Vector3(0, 0, 0);
    }
    
    if (mouthBone) {
      mouthBone.rotation = new BABYLON.Vector3(0, 0, 0);
    }
    
    if (jawBone) {
      jawBone.rotation = new BABYLON.Vector3(0, 0, 0);
    }
    
    switch (sentiment) {
      case SENTIMENTS.HAPPY:
        if (browBone) {
          browBone.rotation = new BABYLON.Vector3(0, 0, 0.1);
        }
        if (mouthBone) {
          mouthBone.rotation = new BABYLON.Vector3(0, 0, 0.2);
        }
        break;
        
      case SENTIMENTS.SAD:
        if (browBone) {
          browBone.rotation = new BABYLON.Vector3(0, 0, -0.1);
        }
        if (mouthBone) {
          mouthBone.rotation = new BABYLON.Vector3(0, 0, -0.2);
        }
        break;
        
      case SENTIMENTS.SURPRISED:
        if (browBone) {
          browBone.rotation = new BABYLON.Vector3(0, 0, 0.3);
        }
        if (jawBone) {
          jawBone.rotation = new BABYLON.Vector3(-0.2, 0, 0);
        }
        break;
        
      case SENTIMENTS.CONFUSED:
        if (browBone) {
          browBone.rotation = new BABYLON.Vector3(0, 0.1, 0.1);
        }
        break;
        
      case SENTIMENTS.ANGRY:
        if (browBone) {
          browBone.rotation = new BABYLON.Vector3(0.1, 0, -0.2);
        }
        if (mouthBone) {
          mouthBone.rotation = new BABYLON.Vector3(0.1, 0, -0.1);
        }
        break;
        
      case SENTIMENTS.NEUTRAL:
      default:
        break;
    }
  };

  // Handle state and sentiment changes
  useEffect(() => {
    if (avatarRef.current && sceneRef.current) {
      playAnimation(avatarState, sentiment);
    }
  }, [avatarState, sentiment]);

  // Handle avatar creator completion
  const handleAvatarCreated = (url) => {
    localStorage.setItem("rpmAvatarUrl", url);
    setAvatarUrl(url);
    setShowCreator(false);
    loadAvatar(url);
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
      {isLoading && (
        <div className="avatar-loading">Loading avatar...</div>
      )}
      
      {!showCreator && (
        <button 
          className="customize-avatar-button"
          onClick={() => setShowCreator(true)}
        >
          Customize Avatar
        </button>
      )}
      
      {showCreator && (
        <div className="avatar-creator-overlay">
          <button 
            className="close-creator-button"
            onClick={() => setShowCreator(false)}
          >
            Cancel
          </button>
          
          <iframe
            ref={iframeRef}
            className="avatar-creator"
            src="https://demo.readyplayer.me/avatar?frameApi"
            allow="camera *"
            title="Ready Player Me Avatar Creator"
          />
        </div>
      )}
    </div>
  );
};

export default ReadyPlayerMeAvatar;