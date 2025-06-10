/**
 * Load Character Use Case
 * Handles the business logic for loading character models and animations
 */
export class LoadCharacterUseCase {
  constructor({
    animationRepository,
    sceneManager
  }) {
    this.animationRepository = animationRepository;
    this.sceneManager = sceneManager;
  }

  async execute(modelPath, animationPaths = []) {
    try {
      // Load base character model
      const character = await this.animationRepository.loadCharacterModel(modelPath);
      
      if (!character) {
        throw new Error('Failed to load character model');
      }

      // Load animations if provided
      if (animationPaths.length > 0) {
        const animations = await this.animationRepository.loadAnimations(animationPaths);
        
        // Associate animations with character using the cloning approach
        animations.forEach((animGroup) => {
          if (animGroup) {
            const clonedGroup = this._cloneAnimationToCharacter(animGroup, character);
            
            if (clonedGroup) {
              character.addAnimationGroup(clonedGroup);
            }
          }
        });
        
        // Schedule cleanup of animation meshes after cloning is complete
        setTimeout(() => {
          this.animationRepository.cleanupAnimationMeshes();
        }, 1000);
      }

      // Setup shadow casting for character meshes
      character.meshes.forEach(mesh => {
        this.sceneManager.addShadowCaster(mesh);
      });

      // Setup morph targets if available
      this._setupMorphTargets(character);

      // Mark character as loaded
      character.markAsLoaded();

      return {
        success: true,
        character,
        message: `Character loaded with ${character.animationGroups.length} animations`
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        character: null
      };
    }
  }

  /**
   * Setup morph targets for facial animations
   * @private
   */
  _setupMorphTargets(character) {
    // Find head mesh and setup morph targets
    const headMesh = character.meshes.find(mesh => 
      mesh.name.includes('Wolf3D_Head') || mesh.name.includes('Head')
    );

    if (headMesh && headMesh.morphTargetManager) {
      const morphManager = headMesh.morphTargetManager;
      
      // Map common morph targets
      const morphTargetMap = {
        'leftEye': 50,
        'rightEye': 51,
        'jawOpen': 16,
        'mouthOpen': 34,
        'jawForward': 9,
        'browUp': 2,
        'browDown': 3,
        'browInnerUp': 4,
        'smile': 47,
        'smileRight': 48,
        'mouthLeft': 22,
        'mouthRight': 21,
        'noseSneer': 17,
        'noseSneerRight': 18,
        'cheekPuff': 32,
        'cheekPuffRight': 33
      };

      Object.entries(morphTargetMap).forEach(([name, index]) => {
        const morphTarget = morphManager.getTarget(index);
        if (morphTarget) {
          character.addMorphTarget(name, morphTarget);
        }
      });

      // Set initial jaw forward position
      const jawForward = character.getMorphTarget('jawForward');
      if (jawForward) {
        jawForward.influence = 0.4;
      }
    }

    // Setup teeth morph targets if available
    const teethMesh = character.meshes.find(mesh => 
      mesh.name.includes('Wolf3D_Teeth') || mesh.name.includes('Teeth')
    );

    if (teethMesh && teethMesh.morphTargetManager) {
      const teethMorphTarget = teethMesh.morphTargetManager.getTarget(34);
      if (teethMorphTarget) {
        character.addMorphTarget('teethMouthOpen', teethMorphTarget);
      }
    }
  }

  /**
   * Clone animation to character using transform node mapping
   * @private
   */
  _cloneAnimationToCharacter(originalGroup, character) {
    // Find the character mesh
    const characterMesh = character.meshes.find(mesh => 
      mesh.name === '_Character_'
    ) || character.meshes[0];

    if (!characterMesh) {
      return null;
    }

    // Get all transform nodes from the character
    const modelTransformNodes = characterMesh.getChildTransformNodes();

    try {
      // Clone animation with transform node mapping
      const clonedGroup = originalGroup.clone(
        "player_" + originalGroup.name,
        (oldTarget) => {
          const oldTargetName = oldTarget?.name || 'unknown';
          
          // Find matching transform node by exact name
          const matchingNode = modelTransformNodes.find((node) => 
            node.name === oldTargetName
          );
          
          return matchingNode || oldTarget;
        }
      );

      if (clonedGroup && clonedGroup.targetedAnimations.length > 0) {
        // Dispose the original animation
        originalGroup.dispose();
        return clonedGroup;
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  }
}
