import * as BABYLON from "babylonjs";
import "babylonjs-loaders";

// Initialize Babylon Scene
export const initScene = (canvas) => {
  const engine = new BABYLON.Engine(canvas, true);
  const scene = new BABYLON.Scene(engine);

  // Configure scene
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // Transparent background for AR

  // Create camera
  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    -Math.PI / 2,
    Math.PI / 2.5,
    3,
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  camera.attachControl(canvas, true);
  camera.lowerRadiusLimit = 2;
  camera.upperRadiusLimit = 10;

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

  // Start the render loop
  engine.runRenderLoop(() => {
    scene.render();
  });

  // Handle browser resize
  window.addEventListener("resize", () => {
    engine.resize();
  });

  return { scene, engine };
};

// Reset camera to default position
export const resetCameraPosition = (scene) => {
  const camera = scene.getCameraByName("camera");
  if (camera && camera instanceof BABYLON.ArcRotateCamera) {
    camera.alpha = -Math.PI / 2;
    camera.beta = Math.PI / 2.5;
    camera.radius = 3;
    camera.target = new BABYLON.Vector3(0, 1, 0);
  }
};

// Animation states for avatar
export const AVATAR_STATES = {
  IDLE: 'idle',
  SPEAKING: 'speaking',
  LISTENING: 'listening',
  THINKING: 'thinking',
  BLINKING: 'blinking'
};

// Sentiment types for expressions
export const SENTIMENTS = {
  NEUTRAL: 'neutral',
  HAPPY: 'happy',
  SAD: 'sad',
  SURPRISED: 'surprised',
  CONFUSED: 'confused',
  ANGRY: 'angry'
};

// Store animation references
let currentAnimations = {
  idle: null,
  speaking: null,
  listening: null,
  blinking: null
};

// Current avatar state
let currentState = AVATAR_STATES.IDLE;
let currentSentiment = SENTIMENTS.NEUTRAL;

// Load avatar model
export const loadAvatarModel = async (
  scene,
  modelPath = "/models/avatar.glb"
) => {
  try {
    // Since the external model is failing to load, let's create a placeholder avatar
    // using built-in BabylonJS shapes

    // Create a simple avatar using a sphere for head and cylinders for body
    const avatar = new BABYLON.Mesh("avatar", scene);

    // Create head (sphere)
    const head = BABYLON.MeshBuilder.CreateSphere(
      "head",
      {
        diameter: 0.8,
        segments: 32,
      },
      scene
    );
    head.position.y = 1.4;
    head.parent = avatar;

    // Create material for the head
    const headMaterial = new BABYLON.StandardMaterial("headMaterial", scene);
    headMaterial.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.5); // Skin tone
    head.material = headMaterial;

    // Create body (cylinder)
    const body = BABYLON.MeshBuilder.CreateCylinder(
      "body",
      {
        height: 1.5,
        diameter: 0.7,
        tessellation: 24,
      },
      scene
    );
    body.position.y = 0.35;
    body.parent = avatar;

    // Create material for the body
    const bodyMaterial = new BABYLON.StandardMaterial("bodyMaterial", scene);
    bodyMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8); // Blue color
    body.material = bodyMaterial;

    // Create arms
    const leftArm = BABYLON.MeshBuilder.CreateCylinder(
      "leftArm",
      {
        height: 1.0,
        diameter: 0.25,
        tessellation: 24,
      },
      scene
    );
    leftArm.position = new BABYLON.Vector3(-0.5, 0.7, 0);
    leftArm.rotation.z = Math.PI / 4; // Rotate arm outward
    leftArm.parent = avatar;
    leftArm.material = bodyMaterial;

    const rightArm = BABYLON.MeshBuilder.CreateCylinder(
      "rightArm",
      {
        height: 1.0,
        diameter: 0.25,
        tessellation: 24,
      },
      scene
    );
    rightArm.position = new BABYLON.Vector3(0.5, 0.7, 0);
    rightArm.rotation.z = -Math.PI / 4; // Rotate arm outward
    rightArm.parent = avatar;
    rightArm.material = bodyMaterial;

    // Create facial features for expressions
    const leftEye = BABYLON.MeshBuilder.CreateSphere(
      "leftEye",
      {
        diameter: 0.12,
        segments: 16,
      },
      scene
    );
    leftEye.position = new BABYLON.Vector3(-0.2, 1.45, 0.3);
    leftEye.parent = avatar;

    const rightEye = BABYLON.MeshBuilder.CreateSphere(
      "rightEye",
      {
        diameter: 0.12,
        segments: 16,
      },
      scene
    );
    rightEye.position = new BABYLON.Vector3(0.2, 1.45, 0.3);
    rightEye.parent = avatar;

    const eyeMaterial = new BABYLON.StandardMaterial("eyeMaterial", scene);
    eyeMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    leftEye.material = eyeMaterial;
    rightEye.material = eyeMaterial;

    // Add mouth for speaking animations
    const mouth = BABYLON.MeshBuilder.CreateDisc(
      "mouth",
      {
        radius: 0.15,
        tessellation: 24,
        arc: 0.5
      },
      scene
    );
    mouth.position = new BABYLON.Vector3(0, 1.2, 0.38);
    mouth.rotation.x = Math.PI / 2;
    mouth.parent = avatar;

    const mouthMaterial = new BABYLON.StandardMaterial("mouthMaterial", scene);
    mouthMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.3);
    mouth.material = mouthMaterial;

    // Initialize the animations
    setupAvatarAnimations(avatar, scene);

    // Start idle animations
    startIdleAnimations(avatar, scene);

    return avatar;
  } catch (error) {
    console.error("Failed to create placeholder avatar:", error);
    throw error;
  }
};

// Setup all animations for the avatar
const setupAvatarAnimations = (avatar, scene) => {
  // Get avatar parts
  const head = avatar.getChildMeshes().find(mesh => mesh.name === "head");
  const leftEye = avatar.getChildMeshes().find(mesh => mesh.name === "leftEye");
  const rightEye = avatar.getChildMeshes().find(mesh => mesh.name === "rightEye");
  const mouth = avatar.getChildMeshes().find(mesh => mesh.name === "mouth");
  
  if (!head || !leftEye || !rightEye || !mouth) {
    console.error("Missing avatar parts for animation");
    return;
  }
  
  // Create the main animation groups
  setupIdleAnimation(avatar, head, scene);
  setupSpeakingAnimation(avatar, head, mouth, scene);
  setupListeningAnimation(avatar, head, scene);
  setupBlinkingAnimation(leftEye, rightEye, scene);
};

// Idle animation setup - subtle breathing effect
const setupIdleAnimation = (avatar, head, scene) => {
  // Subtle up and down movement of the whole avatar (breathing)
  const idleAnim = new BABYLON.Animation(
    "idleAnim",
    "position.y",
    30,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );

  const keyFrames = [];
  // Start position
  keyFrames.push({ frame: 0, value: avatar.position.y });
  // Breathe in
  keyFrames.push({ frame: 30, value: avatar.position.y + 0.01 });
  // Breathe out
  keyFrames.push({ frame: 60, value: avatar.position.y });

  idleAnim.setKeys(keyFrames);

  // Add animation to avatar
  avatar.animations.push(idleAnim);
  
  // Create animation group
  const idleAnimGroup = new BABYLON.AnimationGroup("idleAnimGroup", scene);
  idleAnimGroup.addTargetedAnimation(idleAnim, avatar);
  
  // Save animation reference
  currentAnimations.idle = idleAnimGroup;
};

// Speaking animation - mouth and subtle head movements
const setupSpeakingAnimation = (avatar, head, mouth, scene) => {
  // Mouth opening and closing animation
  const mouthAnim = new BABYLON.Animation(
    "mouthAnim",
    "scaling.y",
    15,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  
  const mouthKeys = [];
  // Closed
  mouthKeys.push({ frame: 0, value: 1.0 });
  // Open
  mouthKeys.push({ frame: 5, value: 0.3 });
  // Slightly closed 
  mouthKeys.push({ frame: 10, value: 0.6 });
  // Open again
  mouthKeys.push({ frame: 15, value: 0.4 });
  // Closed
  mouthKeys.push({ frame: 20, value: 1.0 });
  
  mouthAnim.setKeys(mouthKeys);
  
  // Head subtle nodding during speaking
  const headAnim = new BABYLON.Animation(
    "speakingHeadAnim",
    "rotation.x",
    15,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  
  const headKeys = [];
  // Normal position
  headKeys.push({ frame: 0, value: 0 });
  // Slight nod down
  headKeys.push({ frame: 10, value: 0.05 });
  // Back to normal
  headKeys.push({ frame: 20, value: 0 });
  
  headAnim.setKeys(headKeys);
  
  // Create animation group
  const speakingAnimGroup = new BABYLON.AnimationGroup("speakingAnimGroup", scene);
  speakingAnimGroup.addTargetedAnimation(mouthAnim, mouth);
  speakingAnimGroup.addTargetedAnimation(headAnim, head);
  
  // Save animation reference
  currentAnimations.speaking = speakingAnimGroup;
};

// Listening animation - head tilting
const setupListeningAnimation = (avatar, head, scene) => {
  // Head tilt animation (as if listening attentively)
  const listeningAnim = new BABYLON.Animation(
    "listeningAnim",
    "rotation.z",
    15,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  
  const keyFrames = [];
  // Normal position
  keyFrames.push({ frame: 0, value: 0 });
  // Tilt head slightly to one side
  keyFrames.push({ frame: 15, value: 0.1 });
  // Back to normal
  keyFrames.push({ frame: 30, value: 0 });
  // Tilt to other side slightly
  keyFrames.push({ frame: 45, value: -0.08 });
  // Back to normal
  keyFrames.push({ frame: 60, value: 0 });
  
  listeningAnim.setKeys(keyFrames);
  
  // Create animation group
  const listeningAnimGroup = new BABYLON.AnimationGroup("listeningAnimGroup", scene);
  listeningAnimGroup.addTargetedAnimation(listeningAnim, head);
  
  // Save animation reference
  currentAnimations.listening = listeningAnimGroup;
};

// Blinking animation for eyes
const setupBlinkingAnimation = (leftEye, rightEye, scene) => {
  // Blinking animation (scaling eyes vertically)
  const leftBlinkAnim = new BABYLON.Animation(
    "leftBlinkAnim",
    "scaling.y",
    10,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  
  const rightBlinkAnim = new BABYLON.Animation(
    "rightBlinkAnim",
    "scaling.y",
    10,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
  );
  
  const blinkKeys = [];
  // Eyes open
  blinkKeys.push({ frame: 0, value: 1.0 });
  // Eyes closed
  blinkKeys.push({ frame: 5, value: 0.1 });
  // Eyes open
  blinkKeys.push({ frame: 10, value: 1.0 });
  
  leftBlinkAnim.setKeys(blinkKeys);
  rightBlinkAnim.setKeys(blinkKeys);
  
  // Create animation group
  const blinkAnimGroup = new BABYLON.AnimationGroup("blinkAnimGroup", scene);
  blinkAnimGroup.addTargetedAnimation(leftBlinkAnim, leftEye);
  blinkAnimGroup.addTargetedAnimation(rightBlinkAnim, rightEye);
  
  // Save animation reference
  currentAnimations.blinking = blinkAnimGroup;
};

// Start idle animations that run continuously
const startIdleAnimations = (avatar, scene) => {
  // Start breathing
  if (currentAnimations.idle) {
    currentAnimations.idle.play(true);
  }
  
  // Setup random blinking
  setupRandomBlinking(scene);
};

// Random blinking at intervals
let blinkTimerId = null;
const setupRandomBlinking = (scene) => {
  const triggerRandomBlink = () => {
    if (currentAnimations.blinking) {
      currentAnimations.blinking.play(false);
      
      // Schedule next blink in 2-6 seconds
      const nextBlinkTime = 2000 + Math.random() * 4000;
      blinkTimerId = setTimeout(triggerRandomBlink, nextBlinkTime);
    }
  };
  
  // Start the first blink
  triggerRandomBlink();
};

// Change the avatar state and play appropriate animations
export const setAvatarState = (avatar, state, sentiment = SENTIMENTS.NEUTRAL) => {
  if (!avatar || !Object.values(AVATAR_STATES).includes(state)) {
    return;
  }
  
  // Stop speaking and listening animations before changing state
  if (currentAnimations.speaking) {
    currentAnimations.speaking.stop();
  }
  
  if (currentAnimations.listening) {
    currentAnimations.listening.stop();
  }
  
  // Set new state
  currentState = state;
  currentSentiment = sentiment;
  
  // Start appropriate animation based on state
  switch (state) {
    case AVATAR_STATES.SPEAKING:
      if (currentAnimations.speaking) {
        currentAnimations.speaking.play(true);
        applyExpressionForSentiment(avatar, sentiment);
      }
      break;
      
    case AVATAR_STATES.LISTENING:
      if (currentAnimations.listening) {
        currentAnimations.listening.play(true);
        // Reset to neutral expression when listening
        applyExpressionForSentiment(avatar, SENTIMENTS.NEUTRAL);
      }
      break;
      
    case AVATAR_STATES.IDLE:
    default:
      // Just keep idle animations running
      applyExpressionForSentiment(avatar, sentiment);
      break;
  }
};

// Apply facial expression based on sentiment
const applyExpressionForSentiment = (avatar, sentiment) => {
  const head = avatar.getChildMeshes().find(mesh => mesh.name === "head");
  const mouth = avatar.getChildMeshes().find(mesh => mesh.name === "mouth");
  
  if (!head || !mouth) return;
  
  // Reset all expressions first
  mouth.scaling.x = 1.0;
  mouth.position.y = 1.2;
  
  // Apply sentiment-specific expressions
  switch (sentiment) {
    case SENTIMENTS.HAPPY:
      // Wider, upturned mouth
      mouth.scaling.x = 1.3;
      mouth.position.y = 1.22;
      break;
      
    case SENTIMENTS.SAD:
      // Narrower, downturned mouth
      mouth.scaling.x = 0.8;
      mouth.position.y = 1.18;
      break;
      
    case SENTIMENTS.SURPRISED:
      // Wide open mouth
      mouth.scaling.y = 0.3;
      break;
      
    case SENTIMENTS.CONFUSED:
      // Asymmetric face
      mouth.rotation.z = 0.2;
      break;
      
    case SENTIMENTS.ANGRY:
      // Compressed mouth
      mouth.scaling.x = 0.7;
      mouth.scaling.y = 1.2;
      break;
      
    case SENTIMENTS.NEUTRAL:
    default:
      // Already reset
      break;
  }
};

// Detect sentiment from message
export const detectSentiment = (message) => {
  const text = message.toLowerCase();
  
  // Simple keyword-based sentiment detection
  if (/\b(happy|great|excellent|amazing|good|love|like|thanks)\b/.test(text)) {
    return SENTIMENTS.HAPPY;
  } else if (/\b(sad|sorry|bad|unfortunately|regret)\b/.test(text)) {
    return SENTIMENTS.SAD;
  } else if (/\b(wow|what|really|oh|omg|whoa)\b/.test(text)) {
    return SENTIMENTS.SURPRISED;
  } else if (/\b(how|why|confused|understand|not sure|unsure)\b/.test(text)) {
    return SENTIMENTS.CONFUSED;
  } else if (/\b(angry|upset|annoyed|frustrat|hate)\b/.test(text)) {
    return SENTIMENTS.ANGRY;
  }
  
  return SENTIMENTS.NEUTRAL;
};

// Clean up animation timers
export const cleanupAnimations = () => {
  if (blinkTimerId) {
    clearTimeout(blinkTimerId);
    blinkTimerId = null;
  }
  
  // Stop all animation groups
  Object.values(currentAnimations).forEach(anim => {
    if (anim) {
      anim.stop();
    }
  });
};

// Update avatar based on personality traits
export const updateAvatarBasedOnPersonality = (avatar, personalityTraits) => {
  if (!avatar) return;

  // Example: Adjust avatar scale based on extraversion
  const extraversion = personalityTraits.extraversion || 3;
  const avatarScale = 0.8 + extraversion / 10; // Scale between 0.8 and 1.3

  // Apply animations or modifications based on personality traits
  avatar.scaling = new BABYLON.Vector3(avatarScale, avatarScale, avatarScale);

  // Adjust head color based on openness
  const openness = personalityTraits.openness || 3;
  const head = avatar.getChildMeshes().find((mesh) => mesh.name === "head");
  if (head && head.material) {
    const headMaterial = head.material;
    const intensity = 0.5 + openness / 10;
    headMaterial.diffuseColor = new BABYLON.Color3(
      0.9,
      0.7 * intensity,
      0.5 * intensity
    );
  }

  // Adjust body color based on agreeableness
  const agreeableness = personalityTraits.agreeableness || 3;
  const body = avatar.getChildMeshes().find((mesh) => mesh.name === "body");
  if (body && body.material) {
    const bodyMaterial = body.material;
    // More agreeable = more colorful (more saturation)
    const blueIntensity = 0.4 + agreeableness / 10;
    bodyMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.4, blueIntensity);

    // Apply the same material to arms
    const leftArm = avatar
      .getChildMeshes()
      .find((mesh) => mesh.name === "leftArm");
    const rightArm = avatar
      .getChildMeshes()
      .find((mesh) => mesh.name === "rightArm");
    if (leftArm) leftArm.material = bodyMaterial;
    if (rightArm) rightArm.material = bodyMaterial;
  }
};

// Update a single personality trait without affecting avatar styling
export const updateSingleTrait = (avatar, trait, value) => {
  // This function intentionally does nothing with the avatar's appearance
  // It just receives the trait and value but doesn't modify the avatar
  console.log(`Trait ${trait} updated to ${value} - no visual changes applied`);
  return;
};

// Placeholder for animation functions
export const startAnimation = (avatar, animationName) => {
  // Implementation depends on the specific avatar model and animations
  console.log(`Starting animation: ${animationName}`);
};

// Clean up Babylon resources
export const disposeScene = (engine, scene) => {
  // Clean up animations before disposing scene
  cleanupAnimations();
  scene.dispose();
  engine.dispose();
};
