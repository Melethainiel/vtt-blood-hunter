/**
 * Midi-QOL integration for Blood Curses
 */

import { BloodHunterUtils } from '../utils.js';
import { BloodHunterIntegrations } from '../integrations.js';
import { MODULE_ID } from '../blood-hunter.js';
import { getAvailableCurses } from './curse-detection.js';
import { promptBloodCurse } from './curse-dialogs.js';

/**
 * Register midi-qol hooks for Blood Curse reactions
 */
export function registerMidiQOLHooks() {
  // Hook for reaction-based curses
  Hooks.on('midi-qol.preAttackRoll', async(workflow) => {
    await checkReactionCurses(workflow, 'preAttack');
  });

  Hooks.on('midi-qol.preCheckHits', async(workflow) => {
    await checkReactionCurses(workflow, 'preHit');
  });

  Hooks.on('midi-qol.preDamageRoll', async(workflow) => {
    await checkReactionCurses(workflow, 'preDamage');
  });
}

/**
 * Check if reaction curses should be prompted
 * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
 * @param {string} timing - The timing of the check
 */
async function checkReactionCurses(workflow, timing) {
  // Get all Blood Hunters in the scene
  const bloodHunters = canvas.tokens.placeables.filter(t =>
    t.actor && BloodHunterUtils.isBloodHunter(t.actor)
  );

  for (const token of bloodHunters) {
    const actor = token.actor;

    // Get available Blood Curses
    const curses = getAvailableCurses(actor, timing);

    if (curses.length > 0 && shouldPromptReaction(workflow, timing)) {
      await promptBloodCurse(actor, curses, workflow);
    }
  }
}

/**
 * Check if reaction should be prompted
 * @param {MidiQOL.Workflow} workflow - The workflow
 * @param {string} timing - The timing
 * @returns {boolean} True if should prompt
 */
function shouldPromptReaction(workflow, timing) {
  // Check distance, conditions, etc.
  // For now, always return true if in combat
  return game.combat?.started || false;
}

/**
 * Initialize Midi-QOL integration
 */
export function initMidiQOL() {
  if (BloodHunterIntegrations.isMidiQOLActive()) {
    registerMidiQOLHooks();
    console.log(`${MODULE_ID} | Midi-QOL Blood Curse integration initialized`);
  }
}
