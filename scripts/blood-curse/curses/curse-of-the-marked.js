/**
 * Blood Curse of the Marked implementation
 */

import { BloodHunterUtils } from '../../utils.js';

/**
 * Execute Blood Curse of the Marked
 * @param {Actor} actor - The Blood Hunter actor
 * @param {MidiQOL.Workflow} workflow - The workflow
 * @param {boolean} amplify - Whether amplified
 */
export async function executeCurseOfTheMarked(actor, workflow, amplify) {
  const hemocraftDie = BloodHunterUtils.getHemocraftDie(actor, 'blood-maledict');
  const bonusDice = amplify ? '2' : '1';
  const bonusRoll = await new Roll(`${bonusDice}${hemocraftDie.substring(1)}`).evaluate();

  if (workflow.damageRoll) {
    // Add bonus damage
    workflow.damageRoll._total += bonusRoll.total;

    await bonusRoll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: `Blood Curse of the Marked${amplify ? ' (Amplified)' : ''}`
    });
  }
}
