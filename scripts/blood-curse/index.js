/**
 * Blood Curse functionality for Blood Hunter
 * Main facade providing backward-compatible API
 */

import { CURSE_TYPES } from './curse-registry.js';
import * as Detection from './curse-detection.js';
import * as Resources from './maledict-resources.js';
import * as Dialogs from './curse-dialogs.js';
import * as Hooks from './hooks/index.js';
import { MODULE_ID } from '../blood-hunter.js';

export class BloodCurse {
  // Constants
  static CURSE_TYPES = CURSE_TYPES;

  // Detection methods
  static getKnownCursesFromFeatures = Detection.getKnownCursesFromFeatures;
  static getKnownCursesByLevel = Detection.getKnownCursesByLevel;
  static getAvailableCurses = Detection.getAvailableCurses;

  // Hook handlers
  static handleFallenPuppetTrigger = Hooks.handleFallenPuppetTrigger;

  // Resource management methods
  static getBloodMaledictFeature = Resources.getBloodMaledictFeature;
  static getBloodMaledictMaxUses = Resources.getBloodMaledictMaxUses;
  static updateBloodMaledictMaxUses = Resources.updateBloodMaledictMaxUses;
  static consumeBloodMaledictUse = Resources.consumeBloodMaledictUse;
  static hasUsesRemaining = Resources.hasUsesRemaining;
  static resetCurseUses = Resources.resetCurseUses;

  // Dialog methods
  static calculateAmplificationCost = Dialogs.calculateAmplificationCost;
  static promptBloodCurse = Dialogs.promptBloodCurse;
  static promptFallenPuppet = Dialogs.promptFallenPuppet;
  static createCurseChatMessage = Dialogs.createCurseChatMessage;

  /**
   * Initialize Blood Curse system
   */
  static init() {
    console.log(`${MODULE_ID} | Blood Curse system initialized`);
  }

  /**
   * Execute a Blood Curse
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Item} curse - The curse item
   * @param {object} context - The context (e.g., workflow, target, etc.)
   * @param {boolean} amplify - Whether to amplify
   */
  static async execute(actor, curse, context, amplify = false) {
    await Dialogs.executeCurse(actor, curse, context, amplify);
  }

  /**
   * Execute the actual curse effect
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Item} curse - The curse item
   * @param {object} context - The context (e.g., workflow, target, etc.)
   * @param {boolean} amplify - Whether amplified
   */
  static async executeCurseEffect(actor, curse, context, amplify) {
    // This is now handled internally by curse-dialogs module
    // Kept for backward compatibility
    await Dialogs.executeCurse(actor, curse, context, amplify);
  }

  /**
   * Execute Blood Curse of the Marked (backward compatibility)
   * @deprecated Use curse implementation modules instead
   */
  static async executeCurseOfTheMarked(actor, target, amplify) {
    const { executeCurseOfTheMarked } = await import('./curses/curse-of-the-marked.js');
    return executeCurseOfTheMarked(actor, target, amplify);
  }

  /**
   * Execute Blood Curse of Binding (backward compatibility)
   * @deprecated Use curse implementation modules instead
   */
  static async executeCurseOfBinding(actor, target, amplify) {
    const { executeCurseOfBinding } = await import('./curses/curse-of-binding.js');
    return executeCurseOfBinding(actor, target, amplify);
  }

  /**
   * Execute Blood Curse of the Anxious (backward compatibility)
   * @deprecated Use curse implementation modules instead
   */
  static async executeCurseOfTheAnxious(actor, target, amplify) {
    const { executeCurseOfTheAnxious } = await import('./curses/curse-of-the-anxious.js');
    return executeCurseOfTheAnxious(actor, target, amplify);
  }

  /**
   * Execute Blood Curse of the Fallen Puppet (backward compatibility)
   * @deprecated Use curse implementation modules instead
   */
  static async executeCurseOfTheFallenPuppet(actor, fallenCreature, fallenToken, amplify) {
    const { executeCurseOfTheFallenPuppet } = await import('./curses/curse-of-the-fallen-puppet.js');
    return executeCurseOfTheFallenPuppet(actor, fallenCreature, fallenToken, amplify);
  }
}
