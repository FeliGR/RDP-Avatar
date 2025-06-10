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
        console.log('Loading animations from paths:', animationPaths);
        const animations = await this.animationRepository.loadAnimations(animationPaths);
        console.log('Loaded animations:', animations.length, animations.map(a => a?.name));
        
        // Associate animations with character using the proven cloning approach
        animations.forEach((animGroup, index) => {
          if (animGroup) {
            console.log('Adding animation group:', animGroup.name);
            
            // Use the proven cloning approach from the reference code
            const clonedGroup = this._cloneAnimationToCharacter(animGroup, character);
            
            if (clonedGroup) {
              character.addAnimationGroup(clonedGroup);
              console.log('Successfully added cloned animation:', clonedGroup.name);
            } else {
              console.warn('Failed to clone animation:', animGroup.name);
            }
          }
        });
        
        console.log('Character now has', character.animationGroups.length, 'animation groups');
        
        // Schedule cleanup of animation meshes after cloning is complete
        setTimeout(() => {
          console.log('Starting cleanup of animation meshes...');
          this.animationRepository.cleanupAnimationMeshes();
        }, 1000); // Increased delay to ensure all cloning is complete
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

  _setupMorphTargets(character) {
    // Find head mesh and setup morph targets based on your original code
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

      // Set initial jaw forward position (from your original code)
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
   * Re-target animation to character meshes
   * This is needed because animations loaded from external GLB files
   * need to be associated with the character's actual meshes
   */
  _retargetAnimations(animationGroup, character) {
    console.log('Re-targeting animation:', animationGroup.name);
    
    // Find the character's skeleton - Ready Player Me avatars usually have one main skeleton
    const skeletonMesh = character.meshes.find(mesh => 
      mesh.skeleton && mesh.skeleton.bones.length > 0
    );

    if (!skeletonMesh || !skeletonMesh.skeleton) {
      console.warn('No skeleton found for animation retargeting');
      return;
    }

    const characterSkeleton = skeletonMesh.skeleton;
    console.log('Target character skeleton:', skeletonMesh.name, 'with', characterSkeleton.bones.length, 'bones');

    // Log character skeleton bone names for debugging
    console.log('Character skeleton bones:', characterSkeleton.bones.map(b => b.name).slice(0, 10), '... (showing first 10)');

    // Create a bone name mapping for faster lookup
    const characterBoneMap = new Map();
    characterSkeleton.bones.forEach(bone => {
      characterBoneMap.set(bone.name.toLowerCase(), bone);
    });

    let successfulMappings = 0;
    
    // Re-target each animation in the group
    animationGroup.targetedAnimations.forEach((targetedAnimation, index) => {
      const animation = targetedAnimation.animation;
      const originalTarget = targetedAnimation.target;
      const originalTargetName = originalTarget?.name || 'unknown';
      
      console.log(`Re-targeting animation ${index}: ${animation.name} from ${originalTargetName}`);
      
      let matchingBone = null;
      
      // Strategy 1: Direct name match
      matchingBone = characterSkeleton.bones.find(bone => 
        bone.name === originalTargetName
      );
      
      // Strategy 2: Try common name mappings
      if (!matchingBone) {
        const boneNameMappings = this._getBoneNameMappings();
        const mappedName = boneNameMappings[originalTargetName];
        if (mappedName) {
          matchingBone = characterBoneMap.get(mappedName.toLowerCase());
        }
      }
      
      // Strategy 3: Try case-insensitive partial matching
      if (!matchingBone) {
        const targetLower = originalTargetName.toLowerCase();
        
        // Remove common prefixes
        const cleanTargetName = targetLower
          .replace('mixamorig:', '')
          .replace('mixamorig1:', '')
          .replace('_', '')
          .replace(' ', '');
        
        matchingBone = characterSkeleton.bones.find(bone => {
          const boneLower = bone.name.toLowerCase()
            .replace('_', '')
            .replace(' ', '');
          return boneLower === cleanTargetName || 
                 boneLower.includes(cleanTargetName) ||
                 cleanTargetName.includes(boneLower);
        });
      }
      
      // Strategy 4: Semantic matching for common bone patterns
      if (!matchingBone) {
        matchingBone = this._findSemanticBoneMatch(originalTargetName, characterSkeleton.bones);
      }
      
      if (matchingBone) {
        console.log(`✓ Mapped ${originalTargetName} → ${matchingBone.name}`);
        targetedAnimation.target = matchingBone;
        successfulMappings++;
      } else {
        console.log(`⚠ No bone match for ${originalTargetName}, keeping original target`);
        // Keep the original target instead of falling back to mesh
        // This allows the animation to potentially work if targets are compatible
      }
    });

    console.log(`Animation ${animationGroup.name} retargeted: ${successfulMappings}/${animationGroup.targetedAnimations.length} successful mappings`);
    
    return animationGroup;
  }
  
  /**
   * Clone animation to character using the proven approach from reference code
   * This method follows the pattern from the working BabylonJS implementation
   */
  _cloneAnimationToCharacter(originalGroup, character) {
    console.log('Cloning animation to character:', originalGroup.name);
    
    // Find the main character mesh
    const characterMesh = character.meshes.find(mesh => 
      mesh.name === '_Character_' || mesh.name.includes('Character') || mesh.skeleton
    ) || character.meshes[0];

    if (!characterMesh) {
      console.warn('No character mesh found for animation cloning');
      return null;
    }

    // Get all transform nodes from the character (this is key from the reference code)
    const modelTransformNodes = characterMesh.getChildTransformNodes ? 
      characterMesh.getChildTransformNodes() : [];
    
    console.log('Character transform nodes found:', modelTransformNodes.length);
    console.log('Transform node names:', modelTransformNodes.map(n => n.name).slice(0, 10));

    try {
      // Clone the animation group with target mapping (following reference code pattern)
      const clonedGroup = originalGroup.clone(
        originalGroup.name.replace('M_Standing_', '').replace('M_Talking_', '').replace('M_', ''), 
        (oldTarget) => {
          const oldTargetName = oldTarget?.name || 'unknown';
          console.log('Mapping animation target:', oldTargetName);
          
          // Find matching transform node by name (primary strategy)
          const matchingNode = modelTransformNodes.find((node) => 
            node.name === oldTargetName
          );
          
          if (matchingNode) {
            console.log(`✓ Mapped to transform node: ${oldTargetName} → ${matchingNode.name}`);
            return matchingNode;
          }
          
          // If no exact match, try to find by skeleton bones (secondary strategy)
          if (characterMesh.skeleton) {
            const matchingBone = this._findBestBoneMatch(oldTargetName, characterMesh.skeleton.bones);
            if (matchingBone) {
              console.log(`✓ Mapped to skeleton bone: ${oldTargetName} → ${matchingBone.name}`);
              return matchingBone;
            }
          }
          
          // Fallback to character mesh
          console.log(`⚠ No specific match for ${oldTargetName}, using character mesh as fallback`);
          return characterMesh;
        }
      );

      if (clonedGroup && clonedGroup.targetedAnimations.length > 0) {
        console.log(`Successfully cloned animation with ${clonedGroup.targetedAnimations.length} targeted animations`);
        
        // Log the mapped targets for debugging
        clonedGroup.targetedAnimations.forEach((ta, index) => {
          console.log(`Cloned animation ${index}:`, {
            animationName: ta.animation?.name,
            targetName: ta.target?.name,
            targetType: ta.target?.constructor?.name
          });
        });
        
        return clonedGroup;
      } else {
        console.warn('Cloned animation group is empty or invalid');
        return null;
      }
      
    } catch (error) {
      console.error('Error cloning animation to character:', error);
      return null;
    }
  }
  
  /**
   * Find the best bone match using all available strategies
   */
  _findBestBoneMatch(targetName, characterBones) {
    // Strategy 1: Direct name match
    let match = characterBones.find(bone => bone.name === targetName);
    if (match) return match;
    
    // Strategy 2: Mapping table
    const mappings = this._getBoneNameMappings();
    const mappedName = mappings[targetName];
    if (mappedName) {
      match = characterBones.find(bone => bone.name === mappedName);
      if (match) return match;
    }
    
    // Strategy 3: Semantic matching
    match = this._findSemanticBoneMatch(targetName, characterBones);
    if (match) return match;
    
    // Strategy 4: Fuzzy matching
    const targetLower = targetName.toLowerCase()
      .replace('mixamorig:', '')
      .replace('character1_', '')
      .replace('_', '')
      .replace(' ', '');
    
    match = characterBones.find(bone => {
      const boneLower = bone.name.toLowerCase()
        .replace('_', '')
        .replace(' ', '');
      return boneLower.includes(targetLower) || targetLower.includes(boneLower);
    });
    
    return match;
  }

  /**
   * Clean up any remaining animation meshes that might be causing duplication
   */
  _cleanupAnimationMeshes() {
    const scene = this.sceneManager?.scene;
    if (!scene) return;
    
    console.log('Cleaning up animation meshes...');
    
    // Find and properly dispose animation meshes
    const meshesToCheck = scene.meshes.slice();
    let cleaned = 0;
    
    meshesToCheck.forEach(mesh => {
      // Look for animation meshes that are positioned far away (our hidden ones)
      if (mesh.position.x > 5000 || mesh.position.y > 5000 || mesh.position.z > 5000) {
        console.log('Removing hidden animation mesh:', mesh.name);
        
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
        cleaned++;
      }
    });
    
    console.log(`Cleaned up ${cleaned} animation meshes`);
  }
  
  /**
   * Find semantic bone matches based on common bone naming patterns
   */
  _findSemanticBoneMatch(targetName, characterBones) {
    const targetLower = targetName.toLowerCase();
    
    // Define semantic bone groups
    const semanticGroups = {
      spine: ['spine', 'torso', 'chest'],
      hip: ['hip', 'pelvis', 'root'],
      neck: ['neck', 'cervical'],
      head: ['head', 'skull'],
      shoulder: ['shoulder', 'clavicle', 'collar'],
      upperarm: ['upperarm', 'arm', 'humerus'],
      lowerarm: ['lowerarm', 'forearm', 'radius', 'ulna'],
      hand: ['hand', 'wrist'],
      upperleg: ['upperleg', 'thigh', 'femur'],
      lowerleg: ['lowerleg', 'shin', 'calf', 'tibia'],
      foot: ['foot', 'ankle']
    };
    
    // Find which semantic group the target belongs to
    let targetGroup = null;
    let isLeft = targetLower.includes('left') || targetLower.includes('l_') || targetLower.includes('_l');
    let isRight = targetLower.includes('right') || targetLower.includes('r_') || targetLower.includes('_r');
    
    for (const [group, keywords] of Object.entries(semanticGroups)) {
      if (keywords.some(keyword => targetLower.includes(keyword))) {
        targetGroup = group;
        break;
      }
    }
    
    if (!targetGroup) return null;
    
    // Find matching bone in character skeleton
    return characterBones.find(bone => {
      const boneLower = bone.name.toLowerCase();
      const boneIsLeft = boneLower.includes('left') || boneLower.includes('l_') || boneLower.includes('_l');
      const boneIsRight = boneLower.includes('right') || boneLower.includes('r_') || boneLower.includes('_r');
      
      // Check if side matches
      if (isLeft && !boneIsLeft) return false;
      if (isRight && !boneIsRight) return false;
      if (!isLeft && !isRight && (boneIsLeft || boneIsRight)) return false;
      
      // Check if semantic group matches
      const groupKeywords = semanticGroups[targetGroup];
      return groupKeywords.some(keyword => boneLower.includes(keyword));
    });
  }

  /**
   * Common bone name mappings between different skeleton formats
   */
  _getBoneNameMappings() {
    return {
      // Common Mixamo to Ready Player Me mappings
      'mixamorig:Hips': 'Hips',
      'mixamorig:Spine': 'Spine',
      'mixamorig:Spine1': 'Spine1',
      'mixamorig:Spine2': 'Spine2',
      'mixamorig:Neck': 'Neck',
      'mixamorig:Head': 'Head',
      'mixamorig:LeftShoulder': 'LeftShoulder',
      'mixamorig:LeftArm': 'LeftUpperArm',
      'mixamorig:LeftForeArm': 'LeftLowerArm',
      'mixamorig:LeftHand': 'LeftHand',
      'mixamorig:RightShoulder': 'RightShoulder',
      'mixamorig:RightArm': 'RightUpperArm',
      'mixamorig:RightForeArm': 'RightLowerArm',
      'mixamorig:RightHand': 'RightHand',
      'mixamorig:LeftUpLeg': 'LeftUpperLeg',
      'mixamorig:LeftLeg': 'LeftLowerLeg',
      'mixamorig:LeftFoot': 'LeftFoot',
      'mixamorig:RightUpLeg': 'RightUpperLeg',
      'mixamorig:RightLeg': 'RightLowerLeg',
      'mixamorig:RightFoot': 'RightFoot',
      
      // Alternative common mappings
      'Hips': 'Hips',
      'Spine': 'Spine',
      'Chest': 'Spine2',
      'Neck': 'Neck',
      'Head': 'Head',
      
      // Left side
      'L_Shoulder': 'LeftShoulder',
      'L_UpperArm': 'LeftUpperArm',
      'L_LowerArm': 'LeftLowerArm',
      'L_Hand': 'LeftHand',
      'L_UpperLeg': 'LeftUpperLeg',
      'L_LowerLeg': 'LeftLowerLeg',
      'L_Foot': 'LeftFoot',
      'LeftArm': 'LeftUpperArm',
      'LeftForeArm': 'LeftLowerArm',
      'LeftUpLeg': 'LeftUpperLeg',
      'LeftLeg': 'LeftLowerLeg',
      
      // Right side
      'R_Shoulder': 'RightShoulder',
      'R_UpperArm': 'RightUpperArm',
      'R_LowerArm': 'RightLowerArm',
      'R_Hand': 'RightHand',
      'R_UpperLeg': 'RightUpperLeg',
      'R_LowerLeg': 'RightLowerLeg',
      'R_Foot': 'RightFoot',
      'RightArm': 'RightUpperArm',
      'RightForeArm': 'RightLowerArm',
      'RightUpLeg': 'RightUpperLeg',
      'RightLeg': 'RightLowerLeg',
      
      // Character controller specific mappings
      'Character1_Hips': 'Hips',
      'Character1_Spine': 'Spine',
      'Character1_Spine1': 'Spine1',
      'Character1_Spine2': 'Spine2',
      'Character1_Neck': 'Neck',
      'Character1_Head': 'Head',
      
      // Fingers and detailed bones (if present)
      'LeftHandThumb1': 'LeftHandThumb1',
      'LeftHandThumb2': 'LeftHandThumb2',
      'LeftHandThumb3': 'LeftHandThumb3',
      'LeftHandIndex1': 'LeftHandIndex1',
      'LeftHandIndex2': 'LeftHandIndex2',
      'LeftHandIndex3': 'LeftHandIndex3',
      'LeftHandMiddle1': 'LeftHandMiddle1',
      'LeftHandMiddle2': 'LeftHandMiddle2',
      'LeftHandMiddle3': 'LeftHandMiddle3',
      'LeftHandRing1': 'LeftHandRing1',
      'LeftHandRing2': 'LeftHandRing2',
      'LeftHandRing3': 'LeftHandRing3',
      'LeftHandPinky1': 'LeftHandPinky1',
      'LeftHandPinky2': 'LeftHandPinky2',
      'LeftHandPinky3': 'LeftHandPinky3',
      
      // Right hand fingers
      'RightHandThumb1': 'RightHandThumb1',
      'RightHandThumb2': 'RightHandThumb2',
      'RightHandThumb3': 'RightHandThumb3',
      'RightHandIndex1': 'RightHandIndex1',
      'RightHandIndex2': 'RightHandIndex2',
      'RightHandIndex3': 'RightHandIndex3',
      'RightHandMiddle1': 'RightHandMiddle1',
      'RightHandMiddle2': 'RightHandMiddle2',
      'RightHandMiddle3': 'RightHandMiddle3',
      'RightHandRing1': 'RightHandRing1',
      'RightHandRing2': 'RightHandRing2',
      'RightHandRing3': 'RightHandRing3',
      'RightHandPinky1': 'RightHandPinky1',
      'RightHandPinky2': 'RightHandPinky2',
      'RightHandPinky3': 'RightHandPinky3'
    };
  }

  async dispose(character) {
    if (character) {
      await this.animationRepository.dispose(character);
      return { success: true };
    }
    return { success: false, error: 'No character to dispose' };
  }
}
