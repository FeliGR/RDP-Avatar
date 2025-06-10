import * as BABYLON from 'babylonjs';
import { IMorphTargetController } from '../../domain/interfaces/index.js';

/**
 * Babylon.js implementation of Morph Target Controller
 */
export class BabylonMorphTargetController extends IMorphTargetController {
  constructor(scene) {
    super();
    this.scene = scene;
    this.automaticAnimations = new Map(); // Store intervals by character
  }

  animateMorphTarget(character, morphName, targetValue, duration = 1000) {
    const morphTarget = character.getMorphTarget(morphName);
    if (!morphTarget) {
      return;
    }

    if (duration === 0) {
      // Immediate change
      morphTarget.influence = targetValue;
      return;
    }

    // Animate over time
    const initialValue = morphTarget.influence;
    const numSteps = Math.max(1, duration / 16); // ~60fps
    let currentStep = 0;

    const animationCallback = () => {
      currentStep++;
      const t = currentStep / numSteps;
      morphTarget.influence = BABYLON.Scalar.Lerp(initialValue, targetValue, t);
      
      if (currentStep >= numSteps) {
        this.scene.unregisterBeforeRender(animationCallback);
      }
    };

    this.scene.registerBeforeRender(animationCallback);
  }

  startAutomaticFacialAnimations(character) {
    // Clear existing animations
    this.stopAutomaticFacialAnimations(character);

    const intervals = [];

    // Eye blinking animation
    intervals.push(setInterval(() => this._animateEyes(character), 3000 + Math.random() * 2000));
    
    // Subtle eyebrow movements
    intervals.push(setInterval(() => this._animateBrows(character), 5000 + Math.random() * 3000));
    
    // Occasional smile variations
    intervals.push(setInterval(() => this._animateSmile(character), 8000 + Math.random() * 5000));
    
    // Mouth left/right movements
    intervals.push(setInterval(() => this._animateMouthLeftRight(character), 6000 + Math.random() * 4000));
    
    // Nose movements
    intervals.push(setInterval(() => this._animateNose(character), 10000 + Math.random() * 5000));
    
    // Jaw forward adjustments
    intervals.push(setInterval(() => this._animateJawForward(character), 12000 + Math.random() * 8000));
    
    // Cheek puff variations
    intervals.push(setInterval(() => this._animateCheeks(character), 15000 + Math.random() * 10000));

    this.automaticAnimations.set(character.id, intervals);
  }

  stopAutomaticFacialAnimations(character) {
    const intervals = this.automaticAnimations.get(character.id);
    if (intervals) {
      intervals.forEach(interval => clearInterval(interval));
      this.automaticAnimations.delete(character.id);
    }
  }

  // Private animation methods
  _animateEyes(character) {
    const leftEye = character.getMorphTarget('leftEye');
    const rightEye = character.getMorphTarget('rightEye');
    
    if (leftEye && rightEye) {
      this._performBlink(leftEye, rightEye);
    }
  }

  async _performBlink(leftEye, rightEye) {
    // Close eyes
    leftEye.influence = 1;
    rightEye.influence = 1;
    
    await this._wait(100);
    
    // Open eyes
    leftEye.influence = 0;
    rightEye.influence = 0;
  }

  _animateBrows(character) {
    const browUp = character.getMorphTarget('browUp');
    const browDown = character.getMorphTarget('browDown');
    
    if (Math.random() < 0.5 && browUp) {
      browUp.influence = 0.2 + Math.random() * 0.3;
      setTimeout(() => { browUp.influence = 0; }, 1000);
    } else if (browDown) {
      browDown.influence = 0.1 + Math.random() * 0.2;
      setTimeout(() => { browDown.influence = 0; }, 1000);
    }
  }

  _animateSmile(character) {
    const smile = character.getMorphTarget('smile');
    if (smile && Math.random() < 0.3) {
      smile.influence = 0.1 + Math.random() * 0.2;
      setTimeout(() => { smile.influence = 0; }, 2000);
    }
  }

  _animateMouthLeftRight(character) {
    const mouthLeft = character.getMorphTarget('mouthLeft');
    const mouthRight = character.getMorphTarget('mouthRight');
    
    if (Math.random() < 0.4) {
      if (Math.random() < 0.5 && mouthLeft) {
        mouthLeft.influence = 0.1 + Math.random() * 0.15;
        setTimeout(() => { mouthLeft.influence = 0; }, 800);
      } else if (mouthRight) {
        mouthRight.influence = 0.1 + Math.random() * 0.15;
        setTimeout(() => { mouthRight.influence = 0; }, 800);
      }
    }
  }

  _animateNose(character) {
    const noseSneer = character.getMorphTarget('noseSneer');
    if (noseSneer && Math.random() < 0.2) {
      noseSneer.influence = 0.05 + Math.random() * 0.1;
      setTimeout(() => { noseSneer.influence = 0; }, 1500);
    }
  }

  _animateJawForward(character) {
    const jawForward = character.getMorphTarget('jawForward');
    if (jawForward && Math.random() < 0.3) {
      const currentInfluence = jawForward.influence;
      const variation = 0.1 + Math.random() * 0.2;
      jawForward.influence = Math.min(1, currentInfluence + variation);
      setTimeout(() => { 
        jawForward.influence = 0.4; // Reset to default
      }, 2000);
    }
  }

  _animateCheeks(character) {
    const cheekPuff = character.getMorphTarget('cheekPuff');
    if (cheekPuff && Math.random() < 0.15) {
      cheekPuff.influence = 0.05 + Math.random() * 0.1;
      setTimeout(() => { cheekPuff.influence = 0; }, 1000);
    }
  }

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
