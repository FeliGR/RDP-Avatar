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
    this.animationMeshesToCleanup = []; // Restored for controlled cleanup
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
        console.log('Character mesh loaded:', mesh.name, 'hasChildren:', mesh.getChildMeshes?.()?.length || 0);
        if (mesh.name !== '_Character_') {
          mesh.isPickable = false;
        }
      });
      
      // Ensure the root mesh is named _Character_ (following reference code)
      if (result.meshes[0] && result.meshes[0].name !== '_Character_') {
        console.log('Renaming root mesh from', result.meshes[0].name, 'to _Character_');
        result.meshes[0].name = '_Character_';
      }

      return character;

    } catch (error) {
      console.error('Error loading character model:', error);
      throw error;
    }
  }

  async _importAnimation(animationPath) {
    try {
      console.log('Importing animation from:', animationPath);
      
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        null, 
        this._getBasePath(animationPath), 
        this._getFileName(animationPath), 
        this.scene
      );

      if (!result.animationGroups || result.animationGroups.length === 0) {
        console.warn('No animation groups found in:', animationPath);
        return null;
      }

      const animationGroup = result.animationGroups[0];
      console.log('Found animation group:', animationGroup.name, 'with', animationGroup.targetedAnimations.length, 'targeted animations');

      // Log detailed animation information
      animationGroup.targetedAnimations.forEach((ta, index) => {
        console.log(`Animation ${index}:`, {
          name: ta.animation?.name,
          targetName: ta.target?.name,
          targetProperty: ta.animation?.targetProperty,
          from: ta.animation?.from,
          to: ta.animation?.to,
          dataType: ta.animation?.dataType
        });
      });

      // Store reference to original targeted animations before processing meshes
      const originalTargets = animationGroup.targetedAnimations.map(ta => ({
        animation: ta.animation,
        targetName: ta.target?.name || 'unknown'
      }));

      console.log('Original animation targets:', originalTargets.map(t => t.targetName));

      // Store mesh references for controlled disposal after cloning
      if (result.meshes && result.meshes.length > 0) {
        const animationMeshes = [...result.meshes];
        
        // Store meshes for later cleanup but keep them accessible for now
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
            
            console.log(`Animation mesh ${mesh.name} hidden but preserved for cloning`);
          }
        });
      }

      // Return the animation group (meshes have been disposed immediately)
      return animationGroup;
    } catch (error) {
      console.error(`Error loading animation ${animationPath}:`, error);
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
    console.log('Stored', meshes.length, 'animation meshes for later cleanup');
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
    console.log('Cleaning up', this.animationMeshesToCleanup.length, 'stored animation meshes...');
    
    // First, dispose stored animation meshes
    this.animationMeshesToCleanup.forEach(mesh => {
      if (mesh && !mesh.isDisposed()) {
        console.log('Disposing stored animation mesh:', mesh.name);
        
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
          console.warn('Error disposing stored mesh:', mesh.name, error);
        }
      }
    });
    
    // Clear the cleanup list
    this.animationMeshesToCleanup = [];
    
    // Then scan for any remaining duplicates
    this._forceRemoveDuplicateAvatars();
    
    console.log('Animation mesh cleanup complete');
  }

  /**
   * Force removal of any duplicate avatar meshes that might still be visible
   */
  _forceRemoveDuplicateAvatars() {
    console.log('Scanning scene for duplicate avatar meshes...');
    
    const scene = this.scene;
    const meshesToRemove = [];
    const characterMeshes = [];
    
    // First, identify all potential character meshes
    scene.meshes.forEach(mesh => {
      if (mesh && mesh.name && (
        mesh.name.includes('Wolf3D') ||  // Ready Player Me parts
        mesh.name.includes('Character') ||
        mesh.name.includes('Armature') ||
        mesh.name === '_Character_'
      )) {
        characterMeshes.push(mesh);
      }
    });
    
    console.log('Found', characterMeshes.length, 'potential character meshes');
    
    // If we have more than one set of character meshes, remove duplicates
    if (characterMeshes.length > 1) {
      // Keep only meshes at origin (0,0,0) and remove any that are positioned elsewhere
      characterMeshes.forEach(mesh => {
        const pos = mesh.position;
        const isAtOrigin = Math.abs(pos.x) < 10 && Math.abs(pos.y) < 10 && Math.abs(pos.z) < 10;
        const isVisible = mesh.isEnabled() && mesh.isVisible && mesh.visibility > 0;
        
        // Remove meshes that are:
        // - Far from origin (likely hidden animation meshes)
        // - Not visible
        // - Scaled down significantly
        if (!isAtOrigin || !isVisible || mesh.scaling.x < 0.01) {
          meshesToRemove.push(mesh);
        }
      });
    }
    
    console.log('Found', meshesToRemove.length, 'duplicate meshes to remove');
    
    meshesToRemove.forEach(mesh => {
      try {
        console.log('Force removing duplicate mesh:', mesh.name, 'at position:', mesh.position);
        
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
        console.warn('Error force removing mesh:', mesh.name, error);
      }
    });
    
    console.log('Duplicate removal complete');
  }
}
