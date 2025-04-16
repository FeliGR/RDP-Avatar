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

    return avatar;
  } catch (error) {
    console.error("Failed to create placeholder avatar:", error);
    throw error;
  }
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
  scene.dispose();
  engine.dispose();
};
