import * as BABYLON from "babylonjs";

/**
 * Office Environment Service
 * Creates and manages the office background environment by loading base.glb model
 */
export class OfficeEnvironmentService {
  constructor(scene, shadowGenerator = null) {
    this.scene = scene;
    this.shadowGenerator = shadowGenerator;
    this.hdrTexture = null;
    this.hdrSkybox = null;
    this.videoTexture = null;
    this.environmentMeshes = [];
    this.animationGroups = [];
    this.hdrRotation = 0;
  }

  /**
   * Initialize the complete office environment
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async initializeEnvironment() {
    console.log("OfficeEnvironmentService: Starting environment initialization...");
    
    try {
      // Setup HDR lighting first
      console.log("OfficeEnvironmentService: Setting up HDR lighting...");
      this.setupLighting();
      
      // Load the base model (office environment)
      console.log("OfficeEnvironmentService: Loading base model...");
      await this.importBaseModel("/assets/models/base.glb");
      
      // Apply reflections to all materials
      console.log("OfficeEnvironmentService: Applying reflections...");
      this.applyReflections();
      
      // Start sphere animations if they exist
      console.log("OfficeEnvironmentService: Starting sphere animations...");
      this.startSphereAnimations();
      
      console.log("OfficeEnvironmentService: Environment initialization complete!");
      return { success: true };
    } catch (error) {
      console.error("OfficeEnvironmentService: Initialization failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Setup HDR environment lighting (matching reference code)
   */
  setupLighting() {
    // Create HDR environment texture
    this.hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
      "/assets/env/environment_19.env", 
      this.scene
    );
    this.hdrTexture.rotationY = BABYLON.Tools.ToRadians(this.hdrRotation);
    
    // Create skybox
    this.hdrSkybox = BABYLON.MeshBuilder.CreateBox("skybox", { size: 1024 }, this.scene);
    const hdrSkyboxMaterial = new BABYLON.PBRMaterial("skybox", this.scene);
    hdrSkyboxMaterial.backFaceCulling = false;
    hdrSkyboxMaterial.reflectionTexture = this.hdrTexture.clone();
    hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    hdrSkyboxMaterial.microSurface = 0.5;
    hdrSkyboxMaterial.disableLighting = true;
    this.hdrSkybox.material = hdrSkyboxMaterial;
    this.hdrSkybox.infiniteDistance = true;

    this.environmentMeshes.push(this.hdrSkybox);
  }

  /**
   * Import base model (exact copy of reference code importBaseModel function)
   */
  async importBaseModel(modelPath) {
    console.log("OfficeEnvironmentService: Starting base model import from", modelPath);
    
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", modelPath, this.scene);
      console.log("OfficeEnvironmentService: Base model loaded successfully:", result);
      console.log("OfficeEnvironmentService: Loaded meshes count:", result.meshes.length);
      console.log("OfficeEnvironmentService: Loaded mesh names:", result.meshes.map(m => m.name));
      
      const sphere1 = this.scene.getMeshByName("Sphere_1");
      const sphere2 = this.scene.getMeshByName("Sphere_2");
      const tvMaterial = this.scene.getMaterialByName("TV");
      const cloudsAnim = this.scene.getAnimationGroupByName("clouds_anim");
      const lightingTextureCache = {};

      console.log("OfficeEnvironmentService: Found sphere1:", !!sphere1);
      console.log("OfficeEnvironmentService: Found sphere2:", !!sphere2);
      console.log("OfficeEnvironmentService: Found TV material:", !!tvMaterial);
      console.log("OfficeEnvironmentService: Found clouds animation:", !!cloudsAnim);

      // Add ShadowCaster to Spheres
      if (sphere1 && this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(sphere1);
      }
      if (sphere2 && this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(sphere2);
      }

      // Start Clouds Animations
      if (cloudsAnim) {
        cloudsAnim.speedRatio = 0.2;
        cloudsAnim.play(true);
        this.animationGroups.push(cloudsAnim);
      }

      // Collect all animation groups for later use
      if (result.animationGroups) {
        result.animationGroups.forEach(group => {
          if (group !== cloudsAnim) { // Don't add clouds animation twice
            this.animationGroups.push(group);
          }
        });
      }

      // Setup Video Texture
      if (tvMaterial) {
        this.videoTexture = new BABYLON.VideoTexture(
          "vidtex",
          "/assets/videos/video.mp4",
          this.scene,
          true,
          true
        );
        
        tvMaterial.albedoTexture = this.videoTexture;
        tvMaterial.emissiveTexture = this.videoTexture;
        tvMaterial.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        tvMaterial.roughness = 0.2;
        this.videoTexture.video.pause();
      }

      result.meshes.forEach((mesh) => {
        const meshName = mesh.name;
        const { material } = mesh;

        if (!mesh || !material) return;

        mesh.isPickable = false;
        
        // Mark office environment meshes with a special flag to prevent disposal
        mesh._isOfficeEnvironment = true;
        console.log("OfficeEnvironmentService: Marked mesh as office environment:", meshName);
        
        // Add disposal monitoring
        const originalDispose = mesh.dispose;
        mesh.dispose = function() {
          console.warn("OfficeEnvironmentService: Office environment mesh being disposed:", meshName);
          console.trace("Disposal stack trace:");
          return originalDispose.call(this);
        };
        
        // Log mesh properties for debugging
        console.log(`OfficeEnvironmentService: Mesh ${meshName} - position:`, mesh.position?.toString(), 
                   "visible:", mesh.isVisible, "enabled:", mesh.isEnabled());

        if (!meshName.includes("Sphere")) {
          mesh.freezeWorldMatrix();
          mesh.doNotSyncBoundingInfo = true;
        }

        if (meshName.includes("Base") || meshName.includes("Table")) {
          const lightmapPath = "/assets/textures/" + (mesh.parent?.name || meshName) + "_lighting.jpg";

          let lightmap = lightingTextureCache[lightmapPath];
          if (!lightmap) {
            try {
              lightmap = new BABYLON.Texture(lightmapPath, this.scene);
              lightingTextureCache[lightmapPath] = lightmap;
            } catch (error) {
              console.warn(`Lightmap not found: ${lightmapPath}`);
            }
          }

          if (lightmap) {
            material.lightmapTexture = lightmap;
            material.useLightmapAsShadowmap = true;
            material.lightmapTexture.uAng = Math.PI;
            material.lightmapTexture.level = 1.6;
            material.lightmapTexture.coordinatesIndex = 1;
          }

          if (meshName.includes("Base_primitive0")) {
            material.albedoColor = new BABYLON.Color3(0.99, 0.99, 0.99);
            material.metallic = 0.6;
            material.roughness = 0.6;
            material.specular = new BABYLON.Color3(0, 0, 0);
            material.specularColor = new BABYLON.Color3(0, 0, 0);
            mesh.receiveShadows = true;
          }
          if (meshName.includes("Base_primitive1")) {
            material.roughness = 0.3;
            mesh.receiveShadows = true;
          }
        }

        if (meshName.includes("TV")) {
          material.lightmapTexture = null;
        }
      });

      // Store environment meshes for later cleanup
      this.environmentMeshes.push(...result.meshes);
      
      // Immediately check integrity
      setTimeout(() => {
        this.checkEnvironmentIntegrity();
      }, 1000);

      return result;
    } catch (error) {
      console.error("Failed to load base model:", error);
      throw error;
    }
  }

  /**
   * Start sphere animations (from reference code timeline functionality)
   */
  startSphereAnimations() {
    // Find move animation from loaded model
    const moveAnim = this.scene.getAnimationGroupByName("move_anim");
    if (moveAnim) {
      moveAnim.speedRatio = 0.5;
      moveAnim.play(false);
      
      moveAnim.onAnimationEndObservable.add(() => {
        const rotateAnim = this.scene.getAnimationGroupByName("rotate_anim");
        if (rotateAnim) {
          rotateAnim.speedRatio = 0.35;
          rotateAnim.play(true);
        }
      });
    } else {
      // Fallback: create simple floating animations for spheres
      const sphere1 = this.scene.getMeshByName("Sphere_1");
      const sphere2 = this.scene.getMeshByName("Sphere_2");
      
      if (sphere1) {
        this.createFloatingAnimation(sphere1, "sphere1Movement");
      }
      if (sphere2) {
        this.createFloatingAnimation(sphere2, "sphere2Movement");
      }
    }
  }



  /**
   * Create floating animation for individual objects (fallback if GLB animations not available)
   */
  createFloatingAnimation(mesh, name) {
    const animationFloat = new BABYLON.Animation(
      name,
      "position.y",
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const keys = [];
    const baseY = mesh.position.y;
    keys.push({ frame: 0, value: baseY });
    keys.push({ frame: 30, value: baseY + 0.5 });
    keys.push({ frame: 60, value: baseY });

    animationFloat.setKeys(keys);
    mesh.animations = [animationFloat];
    
    this.scene.beginAnimation(mesh, 0, 60, true);
  }

  /**
   * Apply reflections to all materials (from reference code)
   */
  applyReflections() {
    this.scene.materials.forEach((material) => {
      if (material.name !== "skybox" && this.hdrTexture) {
        material.reflectionTexture = this.hdrTexture;
        material.reflectionTexture.level = 0.9;
        material.environmentIntensity = 0.9;
        material.disableLighting = false;
      }
    });
  }

  /**
   * Play video on TV
   */
  playVideo() {
    if (this.videoTexture && this.videoTexture.video) {
      this.videoTexture.video.play();
    }
  }

  /**
   * Pause video on TV
   */
  pauseVideo() {
    if (this.videoTexture && this.videoTexture.video) {
      this.videoTexture.video.pause();
    }
  }



  /**
   * Dispose of all environment resources
   */
  dispose() {
    // Dispose video texture
    if (this.videoTexture) {
      this.videoTexture.dispose();
      this.videoTexture = null;
    }

    // Dispose environment meshes
    this.environmentMeshes.forEach(mesh => {
      if (mesh && !mesh.isDisposed()) {
        if (mesh.material) {
          mesh.material.dispose();
        }
        mesh.dispose();
      }
    });

    // Dispose animation groups
    this.animationGroups.forEach(group => {
      if (group) {
        group.dispose();
      }
    });

    // Clear arrays
    this.environmentMeshes = [];
    this.animationGroups = [];

    // Dispose HDR texture and skybox
    if (this.hdrSkybox) {
      if (this.hdrSkybox.material) {
        this.hdrSkybox.material.dispose();
      }
      this.hdrSkybox.dispose();
      this.hdrSkybox = null;
    }

    if (this.hdrTexture) {
      this.hdrTexture.dispose();
      this.hdrTexture = null;
    }
  }

  /**
   * Check if office environment is still present in the scene
   */
  checkEnvironmentIntegrity() {
    const presentMeshes = this.environmentMeshes.filter(mesh => 
      mesh && !mesh.isDisposed() && mesh.isEnabled()
    );
    
    const visibleMeshes = this.environmentMeshes.filter(mesh => 
      mesh && !mesh.isDisposed() && mesh.isEnabled() && mesh.isVisible
    );
    
    console.log("OfficeEnvironmentService: Environment integrity check:");
    console.log(`- Total environment meshes: ${this.environmentMeshes.length}`);
    console.log(`- Present meshes: ${presentMeshes.length}`);
    console.log(`- Visible meshes: ${visibleMeshes.length}`);
    console.log(`- Missing meshes: ${this.environmentMeshes.length - presentMeshes.length}`);
    
    // Log details of missing meshes
    const missingMeshes = this.environmentMeshes.filter(mesh => 
      !mesh || mesh.isDisposed() || !mesh.isEnabled()
    );
    
    if (missingMeshes.length > 0) {
      console.log("OfficeEnvironmentService: Missing/disposed meshes:", 
        missingMeshes.map(m => m ? (m.isDisposed() ? `${m.name} (disposed)` : `${m.name} (disabled)`) : 'null'));
    }
    
    // Log invisible meshes
    const invisibleMeshes = presentMeshes.filter(mesh => !mesh.isVisible);
    if (invisibleMeshes.length > 0) {
      console.log("OfficeEnvironmentService: Invisible meshes:", 
        invisibleMeshes.map(m => m.name));
    }
    
    if (presentMeshes.length === 0) {
      console.warn("OfficeEnvironmentService: All environment meshes are missing!");
      return false;
    }
    
    return presentMeshes.length > 0;
  }
}
