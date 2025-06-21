import * as BABYLON from "babylonjs";
import "babylonjs-loaders";
import { Character } from "../../domain/entities/Character.js";
import { IAnimationRepository } from "../../domain/interfaces/index.js";

export class BabylonAnimationRepository extends IAnimationRepository {
  constructor(scene) {
    super();
    this.scene = scene;
    this.animationsGLB = [];
    this.animationMeshesToCleanup = [];
  }

  async loadAnimations(animationPaths) {
    const animationPromises = animationPaths.map((path) => this._importAnimation(path));
    const animations = await Promise.all(animationPromises);
    return animations.filter((anim) => anim !== null);
  }

  async loadCharacterModel(modelPath) {
    try {
      const existingMeshes = this.scene.meshes.filter(
        (mesh) =>
          mesh.name.includes("Wolf3D") ||
          mesh.name.includes("_Character_") ||
          mesh.name.includes("Armature"),
      );
      if (existingMeshes.length > 0) {
        const character = new Character({
          id: `character_${Date.now()}`,
          name: "ExistingAvatar",
          meshes: existingMeshes,
          animationGroups: [],
        });
        existingMeshes.forEach((mesh) => {
          if (mesh.name !== "_Character_") {
            mesh.isPickable = false;
          }
        });
        const rootMesh =
          existingMeshes.find(
            (mesh) => mesh.name.includes("Wolf3D") || mesh.name.includes("Armature"),
          ) || existingMeshes[0];
        if (rootMesh && rootMesh.name !== "_Character_") {
          rootMesh.name = "_Character_";
        }
        return character;
      }
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        null,
        this._getBasePath(modelPath),
        this._getFileName(modelPath),
        this.scene,
      );
      if (!result.meshes || result.meshes.length === 0) {
        throw new Error("No meshes found in model");
      }
      const character = new Character({
        id: `character_${Date.now()}`,
        name: this._getFileName(modelPath).replace(".glb", ""),
        meshes: result.meshes,
        animationGroups: result.animationGroups || [],
      });
      result.meshes.forEach((mesh) => {
        if (mesh.name !== "_Character_") {
          mesh.isPickable = false;
        }
      });
      if (result.meshes[0] && result.meshes[0].name !== "_Character_") {
        result.meshes[0].name = "_Character_";
      }
      return character;
    } catch (error) {
      throw new Error(`Failed to load character model: ${error.message}`);
    }
  }

  async _importAnimation(animationPath) {
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        null,
        this._getBasePath(animationPath),
        this._getFileName(animationPath),
        this.scene,
      );
      if (!result.animationGroups || result.animationGroups.length === 0) {
        return null;
      }
      const animationGroup = result.animationGroups[0];
      if (result.meshes && result.meshes.length > 0) {
        const animationMeshes = result.meshes.filter((mesh) => mesh);
        this._storeAnimationMeshesForCleanup(animationMeshes);
        animationMeshes.forEach((mesh) => {
          if (mesh) {
            mesh.isVisible = false;
            mesh.visibility = 0;
            mesh.isPickable = false;
            mesh.position = new BABYLON.Vector3(50000, 50000, 50000);
            const childMeshes = mesh.getChildMeshes();
            childMeshes.forEach((childMesh) => {
              childMesh.isVisible = false;
              childMesh.visibility = 0;
              childMesh.isPickable = false;
            });
          }
        });
      }
      return animationGroup;
    } catch (error) {
      return null;
    }
  }

  _getBasePath(fullPath) {
    const lastSlash = fullPath.lastIndexOf("/");
    return lastSlash > -1 ? fullPath.substring(0, lastSlash + 1) : "./";
  }

  _getFileName(fullPath) {
    const lastSlash = fullPath.lastIndexOf("/");
    return lastSlash > -1 ? fullPath.substring(lastSlash + 1) : fullPath;
  }

  _storeAnimationMeshesForCleanup(meshes) {
    meshes.forEach((mesh) => {
      if (mesh._isOfficeEnvironment) {
      }
    });
    this.animationMeshesToCleanup.push(...meshes);
  }

  dispose(character) {
    if (character && character.meshes) {
      character.meshes.forEach((mesh) => {
        if (mesh.material) {
          mesh.material.dispose();
        }
        mesh.dispose();
      });
    }
    if (character && character.animationGroups) {
      character.animationGroups.forEach((group) => {
        group.dispose();
      });
    }
  }

  cleanupAnimationMeshes() {
    this.animationMeshesToCleanup.forEach((mesh) => {
      if (mesh && !mesh.isDisposed()) {
        if (mesh._isOfficeEnvironment) {
          return;
        }
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
    this.animationMeshesToCleanup = [];
    this._forceRemoveDuplicateAvatars();
  }

  _forceRemoveDuplicateAvatars() {
    const scene = this.scene;
    const meshesToRemove = [];
    const characterMeshes = [];
    scene.meshes.forEach((mesh) => {
      if (
        mesh &&
        mesh.name &&
        (mesh.name.includes("Wolf3D") ||
          mesh.name.includes("Character") ||
          mesh.name.includes("Armature") ||
          mesh.name === "_Character_")
      ) {
        characterMeshes.push(mesh);
      }
    });
    characterMeshes.forEach((mesh) => {
      const pos = mesh.position;
      const isFarAway = Math.abs(pos.x) > 5000 || Math.abs(pos.y) > 5000 || Math.abs(pos.z) > 5000;
      const isHidden = !mesh.isVisible || mesh.visibility === 0;
      const isScaledDown = mesh.scaling.x < 0.01;
      if (isFarAway || isHidden || isScaledDown) {
        meshesToRemove.push(mesh);
      }
    });
    meshesToRemove.forEach((mesh) => {
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
    });
  }
}
