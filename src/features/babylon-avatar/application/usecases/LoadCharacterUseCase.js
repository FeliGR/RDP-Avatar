export class LoadCharacterUseCase {
  constructor({ animationRepository, sceneManager }) {
    this.animationRepository = animationRepository;
    this.sceneManager = sceneManager;
  }

  async execute(modelPath, animationPaths = []) {
    try {
      const character = await this.animationRepository.loadCharacterModel(modelPath);

      if (!character) {
        throw new Error("Failed to load character model");
      }

      if (animationPaths.length > 0) {
        const animations = await this.animationRepository.loadAnimations(animationPaths);

        animations.forEach((animGroup) => {
          if (animGroup) {
            const clonedGroup = this._cloneAnimationToCharacter(animGroup, character);

            if (clonedGroup) {
              character.addAnimationGroup(clonedGroup);
            }
          }
        });

        setTimeout(() => {
          this.animationRepository.cleanupAnimationMeshes();
        }, 1000);
      }

      character.meshes.forEach((mesh) => {
        this.sceneManager.addShadowCaster(mesh);
      });

      this._setupMorphTargets(character);

      character.markAsLoaded();

      return {
        success: true,
        character,
        message: `Character loaded with ${character.animationGroups.length} animations`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        character: null,
      };
    }
  }

  _setupMorphTargets(character) {
    const headMesh = character.meshes.find(
      (mesh) => mesh.name.includes("Wolf3D_Head") || mesh.name.includes("Head")
    );

    if (headMesh && headMesh.morphTargetManager) {
      const morphManager = headMesh.morphTargetManager;

      const morphTargetMap = {
        leftEye: 50,
        rightEye: 51,
        jawOpen: 16,
        mouthOpen: 34,
        jawForward: 9,
        browUp: 2,
        browDown: 3,
        browInnerUp: 4,
        smile: 47,
        smileRight: 48,
        mouthLeft: 22,
        mouthRight: 21,
        noseSneer: 17,
        noseSneerRight: 18,
        cheekPuff: 32,
        cheekPuffRight: 33,
      };

      Object.entries(morphTargetMap).forEach(([name, index]) => {
        const morphTarget = morphManager.getTarget(index);
        if (morphTarget) {
          character.addMorphTarget(name, morphTarget);
        }
      });

      const jawForward = character.getMorphTarget("jawForward");
      if (jawForward) {
        jawForward.influence = 0.4;
      }
    }

    const teethMesh = character.meshes.find(
      (mesh) => mesh.name.includes("Wolf3D_Teeth") || mesh.name.includes("Teeth")
    );

    if (teethMesh && teethMesh.morphTargetManager) {
      const teethMorphTarget = teethMesh.morphTargetManager.getTarget(34);
      if (teethMorphTarget) {
        character.addMorphTarget("teethMouthOpen", teethMorphTarget);
      }
    }
  }

  _cloneAnimationToCharacter(originalGroup, character) {
    const characterMesh =
      character.meshes.find((mesh) => mesh.name === "_Character_") || character.meshes[0];

    if (!characterMesh) {
      return null;
    }

    const modelTransformNodes = characterMesh.getChildTransformNodes();

    try {
      const clonedGroup = originalGroup.clone("player_" + originalGroup.name, (oldTarget) => {
        const oldTargetName = oldTarget?.name || "unknown";

        const matchingNode = modelTransformNodes.find((node) => node.name === oldTargetName);

        return matchingNode || oldTarget;
      });

      if (clonedGroup && clonedGroup.targetedAnimations.length > 0) {
        originalGroup.dispose();
        return clonedGroup;
      }

      return null;
    } catch (error) {
      return null;
    }
  }
}
