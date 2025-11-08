/**
 * Blood Curse functionality for Blood Hunter
 * Main facade providing backward-compatible API
 */

import { CURSE_TYPES } from './curse-registry.js';
import * as Detection from './curse-detection.js';
import * as Resources from './maledict-resources.js';
import * as Dialogs from './curse-dialogs.js';
import * as MidiIntegration from './midi-integration.js';
import { MODULE_ID } from '../blood-hunter.js';

export class BloodCurse {
  // Constants
  static CURSE_TYPES = CURSE_TYPES;

  // Detection methods
  static getKnownCursesFromFeatures = Detection.getKnownCursesFromFeatures;
  static getKnownCursesByLevel = Detection.getKnownCursesByLevel;
  static getAvailableCurses = Detection.getAvailableCurses;

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

  // Midi-QOL methods
  static registerMidiQOLHooks = MidiIntegration.registerMidiQOLHooks;

  /**
   * Initialize Blood Curse system
   */
  static init() {
    console.log(`${MODULE_ID} | Blood Curse system initialized`);
    MidiIntegration.initMidiQOL();
  }

  /**
   * Check if reaction should be prompted
   * @param {MidiQOL.Workflow} workflow - The workflow
   * @param {string} timing - The timing
   * @returns {boolean} True if should prompt
   */
  static shouldPromptReaction(workflow, timing) {
    // Check distance, conditions, etc.
    // For now, always return true if in combat
    return game.combat?.started || false;
  }

  /**
   * Check if reaction curses should be prompted
   * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
   * @param {string} timing - The timing of the check
   */
  static async checkReactionCurses(workflow, timing) {
    // This is now handled by midi-integration module
    // Kept for backward compatibility
    console.warn(`${MODULE_ID} | checkReactionCurses is deprecated, use midi-integration module`);
  }

  /**
   * Execute a Blood Curse
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Item} curse - The curse item
   * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
   * @param {boolean} amplify - Whether to amplify
   */
  static async execute(actor, curse, workflow, amplify = false) {
    await Dialogs.executeCurse(actor, curse, workflow, amplify);
  }

  /**
   * Execute the actual curse effect
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Item} curse - The curse item
   * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
   * @param {boolean} amplify - Whether amplified
   */
  static async executeCurseEffect(actor, curse, workflow, amplify) {
    // This is now handled internally by curse-dialogs module
    // Kept for backward compatibility
    await Dialogs.executeCurse(actor, curse, workflow, amplify);
  }

  /**
   * Execute Blood Curse of the Marked (backward compatibility)
   * @deprecated Use curse implementation modules instead
   */
  static async executeCurseOfTheMarked(actor, workflow, amplify) {
    const { executeCurseOfTheMarked } = await import('./curses/curse-of-the-marked.js');
    return executeCurseOfTheMarked(actor, workflow, amplify);
  }

  /**
   * Execute Blood Curse of Binding (backward compatibility)
   * @deprecated Use curse implementation modules instead
   */
  static async executeCurseOfBinding(actor, workflow, amplify) {
    const { executeCurseOfBinding } = await import('./curses/curse-of-binding.js');
    return executeCurseOfBinding(actor, workflow, amplify);
  }

  /**
   * Execute Blood Curse of the Anxious (backward compatibility)
   * @deprecated Use curse implementation modules instead
   */
  static async executeCurseOfTheAnxious(actor, workflow, amplify) {
    const { executeCurseOfTheAnxious } = await import('./curses/curse-of-the-anxious.js');
    return executeCurseOfTheAnxious(actor, workflow, amplify);
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
