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
      console.warn(`Morph target '${morphName}' not found`);
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
    const eyeInterval = setInterval(() => {
      this._animateEyes(character);
    }, 800);
    intervals.push(eyeInterval);

    // Brow movement
    const browInterval = setInterval(() => {
      this._animateBrows(character);
    }, 1200);
    intervals.push(browInterval);

    // Subtle smile
    const smileInterval = setInterval(() => {
      this._animateSmile(character);
    }, 2000);
    intervals.push(smileInterval);

    // Mouth movement
    const mouthInterval = setInterval(() => {
      this._animateMouthLeftRight(character);
    }, 1500);
    intervals.push(mouthInterval);

    // Nose movement
    const noseInterval = setInterval(() => {
      this._animateNose(character);
    }, 1000);
    intervals.push(noseInterval);

    // Jaw movement
    const jawInterval = setInterval(() => {
      this._animateJawForward(character);
    }, 2000);
    intervals.push(jawInterval);

    // Cheek movement
    const cheekInterval = setInterval(() => {
      this._animateCheeks(character);
    }, 1200);
    intervals.push(cheekInterval);

    // Store intervals for cleanup
    this.automaticAnimations.set(character.id, intervals);
  }

  stopAutomaticFacialAnimations(character) {
    const intervals = this.automaticAnimations.get(character.id);
    if (intervals) {
      intervals.forEach(interval => clearInterval(interval));
      this.automaticAnimations.delete(character.id);
    }
  }

  // Private animation methods based on your original code
  _animateEyes(character) {
    const leftEye = character.getMorphTarget('leftEye');
    const rightEye = character.getMorphTarget('rightEye');
    
    if (!leftEye || !rightEye) return;

    const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    
    const randomNumber = getRandomNumber(1, 2);
    if (randomNumber === 1) {
      // Single or double blink
      this._performBlink(leftEye, rightEye);
      
      const randomNumber2 = getRandomNumber(1, 2);
      if (randomNumber2 === 1) {
        setTimeout(() => {
          this._performBlink(leftEye, rightEye);
        }, 100);
      }
    }
  }

  async _performBlink(leftEye, rightEye) {
    leftEye.influence = 1;
    rightEye.influence = 1;
    
    await this._wait(100);
    
    leftEye.influence = 0;
    rightEye.influence = 0;
  }

  _animateBrows(character) {
    const random = Math.random() * 0.8;
    ['browUp', 'browDown', 'browInnerUp'].forEach(morphName => {
      this.animateMorphTarget(character, morphName, random, 250);
    });
  }

  _animateSmile(character) {
    const random = Math.random() * 0.18 + 0.02;
    this.animateMorphTarget(character, 'smile', random, 500);
    this.animateMorphTarget(character, 'smileRight', random, 500);
  }

  _animateMouthLeftRight(character) {
    const random = Math.random() * 0.7;
    const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const isLeft = getRandomNumber(0, 1) === 1;
    
    const morphName = isLeft ? 'mouthLeft' : 'mouthRight';
    this.animateMorphTarget(character, morphName, random, 1500);
  }

  _animateNose(character) {
    const random = Math.random() * 0.7;
    this.animateMorphTarget(character, 'noseSneer', random, 1000);
    this.animateMorphTarget(character, 'noseSneerRight', random, 1000);
  }

  _animateJawForward(character) {
    const random = Math.random() * 0.5;
    this.animateMorphTarget(character, 'jawForward', random, 1000);
  }

  _animateCheeks(character) {
    const random = Math.random() * 1;
    this.animateMorphTarget(character, 'cheekPuff', random, 1000);
    this.animateMorphTarget(character, 'cheekPuffRight', random, 1000);
  }

  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
