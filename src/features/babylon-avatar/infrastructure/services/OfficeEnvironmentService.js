import * as BABYLON from "babylonjs";

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

  async initializeEnvironment() {
    try {
      this.setupLighting();
      await this.importBaseModel("/assets/models/base.glb");
      this.applyReflections();
      this.startSphereAnimations();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  setupLighting() {
    this.hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData(
      "/assets/env/environment_19.env",
      this.scene
    );
    this.hdrTexture.rotationY = BABYLON.Tools.ToRadians(this.hdrRotation);
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

  async importBaseModel(modelPath) {
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync(null, "", modelPath, this.scene);
      const sphere1 = this.scene.getMeshByName("Sphere_1");
      const sphere2 = this.scene.getMeshByName("Sphere_2");
      const tvMaterial = this.scene.getMaterialByName("TV");
      const cloudsAnim = this.scene.getAnimationGroupByName("clouds_anim");
      const lightingTextureCache = {};
      if (sphere1 && this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(sphere1);
      }
      if (sphere2 && this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(sphere2);
      }
      if (cloudsAnim) {
        cloudsAnim.speedRatio = 0.2;
        cloudsAnim.play(true);
        this.animationGroups.push(cloudsAnim);
      }
      if (result.animationGroups) {
        result.animationGroups.forEach((group) => {
          if (group !== cloudsAnim) {
            this.animationGroups.push(group);
          }
        });
      }
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
        mesh._isOfficeEnvironment = true;
        const originalDispose = mesh.dispose;
        mesh.dispose = function () {
          return originalDispose.call(this);
        };
        if (!meshName.includes("Sphere")) {
          mesh.freezeWorldMatrix();
          mesh.doNotSyncBoundingInfo = true;
        }
        if (meshName.includes("Base") || meshName.includes("Table")) {
          const lightmapPath =
            "/assets/textures/" + (mesh.parent?.name || meshName) + "_lighting.jpg";
          let lightmap = lightingTextureCache[lightmapPath];
          if (!lightmap) {
            try {
              lightmap = new BABYLON.Texture(lightmapPath, this.scene);
              lightingTextureCache[lightmapPath] = lightmap;
            } catch (error) {}
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
      this.environmentMeshes.push(...result.meshes);
      setTimeout(() => {
        this.checkEnvironmentIntegrity();
      }, 1000);
      return result;
    } catch (error) {
      throw error;
    }
  }

  startSphereAnimations() {
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

  playVideo() {
    if (this.videoTexture && this.videoTexture.video) {
      this.videoTexture.video.play();
    }
  }

  pauseVideo() {
    if (this.videoTexture && this.videoTexture.video) {
      this.videoTexture.video.pause();
    }
  }

  dispose() {
    if (this.videoTexture) {
      this.videoTexture.dispose();
      this.videoTexture = null;
    }
    this.environmentMeshes.forEach((mesh) => {
      if (mesh && !mesh.isDisposed()) {
        if (mesh.material) {
          mesh.material.dispose();
        }
        mesh.dispose();
      }
    });
    this.animationGroups.forEach((group) => {
      if (group) {
        group.dispose();
      }
    });
    this.environmentMeshes = [];
    this.animationGroups = [];
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

  checkEnvironmentIntegrity() {
    const presentMeshes = this.environmentMeshes.filter(
      (mesh) => mesh && !mesh.isDisposed() && mesh.isEnabled()
    );
    if (presentMeshes.length === 0) {
      return false;
    }
    return presentMeshes.length > 0;
  }
}
