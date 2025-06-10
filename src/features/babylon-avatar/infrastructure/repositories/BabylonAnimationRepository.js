import * as BABYLON from 'babylonjs';
import 'babylonjs-loaders';
import { Character } from '../../domain/entities/Character.js';
import { IAnimationRepository } from '../../domain/interfaces/index.js';

/**
 * Babylon.js implementation of Animation Repository
 */
export class BabylonAnimationRepository extends IAnimationRepository {
  constructor(scene) {
    super();
    this.scene = scene;
    this.animationsGLB = [];
    this.animationMeshesToCleanup = [];
  }

  async loadAnimations(animationPaths) {
    const animationPromises = animationPaths.map(path => 
      this._importAnimation(path)
    );

    const animations = await Promise.all(animationPromises);
    return animations.filter(anim => anim !== null);
  }

  async loadCharacterModel(modelPath) {
    try {
      // First, check if there's already a character mesh in the scene
      // This prevents duplicate loading when the avatar is already loaded by ReadyPlayerMeAvatar
      const existingMeshes = this.scene.meshes.filter(mesh => 
        mesh.name.includes('Wolf3D') || 
        mesh.name.includes('_Character_') ||
        mesh.name.includes('Armature')
      );

      if (existingMeshes.length > 0) {
        // Create character entity from existing meshes
        const character = new Character({
          id: `character_${Date.now()}`,
          name: 'ExistingAvatar',
          meshes: existingMeshes,
          animationGroups: []
        });

        // Setup mesh properties
        existingMeshes.forEach(mesh => {
          if (mesh.name !== '_Character_') {
            mesh.isPickable = false;
          }
        });
        
        // Ensure the root mesh is named _Character_
        const rootMesh = existingMeshes.find(mesh => 
          mesh.name.includes('Wolf3D') || mesh.name.includes('Armature')
        ) || existingMeshes[0];
        
        if (rootMesh && rootMesh.name !== '_Character_') {
          rootMesh.name = '_Character_';
        }

        return character;
      }

      // If no existing character found, load as fallback
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        null, 
        this._getBasePath(modelPath), 
        this._getFileName(modelPath), 
        this.scene
      );

      if (!result.meshes || result.meshes.length === 0) {
        throw new Error('No meshes found in model');
      }

      const character = new Character({
        id: `character_${Date.now()}`,
        name: this._getFileName(modelPath).replace('.glb', ''),
        meshes: result.meshes,
        animationGroups: result.animationGroups || []
      });

      // Setup mesh properties and ensure main mesh is named correctly
      result.meshes.forEach(mesh => {
        if (mesh.name !== '_Character_') {
          mesh.isPickable = false;
        }
      });
      
      // Ensure the root mesh is named _Character_
      if (result.meshes[0] && result.meshes[0].name !== '_Character_') {
        result.meshes[0].name = '_Character_';
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
        this.scene
      );

      if (!result.animationGroups || result.animationGroups.length === 0) {
        return null;
      }

      const animationGroup = result.animationGroups[0];

      // Store loaded meshes for cleanup and hide them
      if (result.meshes && result.meshes.length > 0) {
        const animationMeshes = result.meshes.filter(mesh => mesh);
        this._storeAnimationMeshesForCleanup(animationMeshes);
        
        // Make meshes invisible but keep them functional for cloning
        animationMeshes.forEach(mesh => {
          if (mesh) {
            // Make invisible but keep enabled for transform node access
            mesh.isVisible = false;
            mesh.visibility = 0;
            mesh.isPickable = false;
            
            // Move far away but don't scale down (preserves transform structure)
            mesh.position = new BABYLON.Vector3(50000, 50000, 50000);
            
            // Hide child meshes but keep structure
            const childMeshes = mesh.getChildMeshes();
            childMeshes.forEach(childMesh => {
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
    const lastSlash = fullPath.lastIndexOf('/');
    return lastSlash > -1 ? fullPath.substring(0, lastSlash + 1) : './';
  }

  _getFileName(fullPath) {
    const lastSlash = fullPath.lastIndexOf('/');
    return lastSlash > -1 ? fullPath.substring(lastSlash + 1) : fullPath;
  }

  /**
   * Store animation meshes for controlled cleanup after cloning
   */
  _storeAnimationMeshesForCleanup(meshes) {
    this.animationMeshesToCleanup.push(...meshes);
  }

  dispose(character) {
    if (character && character.meshes) {
      character.meshes.forEach(mesh => {
        if (mesh.material) {
          mesh.material.dispose();
        }
        mesh.dispose();
      });
    }

    if (character && character.animationGroups) {
      character.animationGroups.forEach(group => {
        group.dispose();
      });
    }
  }

  /**
   * Clean up animation meshes after cloning is complete
   */
  cleanupAnimationMeshes() {
    // First, dispose stored animation meshes
    this.animationMeshesToCleanup.forEach(mesh => {
      if (mesh && !mesh.isDisposed()) {
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
        } catch (error) {
          // Silently handle disposal errors
        }
      }
    });
    
    // Clear the cleanup list
    this.animationMeshesToCleanup = [];
    
    // Then scan for any remaining duplicates
    this._forceRemoveDuplicateAvatars();
  }

  /**
   * Force removal of any duplicate avatar meshes that might still be visible
   */
  _forceRemoveDuplicateAvatars() {
    const scene = this.scene;
    const meshesToRemove = [];
    const characterMeshes = [];
    
    // First, identify all potential character meshes
    scene.meshes.forEach(mesh => {
      if (mesh && mesh.name && (
        mesh.name.includes('Wolf3D') ||
        mesh.name.includes('Character') ||
        mesh.name.includes('Armature') ||
        mesh.name === '_Character_'
      )) {
        characterMeshes.push(mesh);
      }
    });
    
    // Remove any meshes that are positioned far away or hidden (likely animation meshes)
    characterMeshes.forEach(mesh => {
      const pos = mesh.position;
      const isFarAway = Math.abs(pos.x) > 5000 || Math.abs(pos.y) > 5000 || Math.abs(pos.z) > 5000;
      const isHidden = !mesh.isVisible || mesh.visibility === 0;
      const isScaledDown = mesh.scaling.x < 0.01;
      
      if (isFarAway || isHidden || isScaledDown) {
        meshesToRemove.push(mesh);
      }
    });
    
    meshesToRemove.forEach(mesh => {
      try {
        // Dispose child meshes
        const childMeshes = mesh.getChildMeshes();
        childMeshes.forEach(childMesh => {
          if (childMesh.material) {
            childMesh.material.dispose();
          }
          childMesh.dispose();
        });
        
        // Dispose the mesh
        if (mesh.material) {
          mesh.material.dispose();
        }
        mesh.dispose();
      } catch (error) {
        // Silently handle disposal errors
      }
    });
  }
}
