/**
 * Blood Curse of Binding implementation
 */

import { BloodHunterUtils } from '../../utils.js';
import { MODULE_ID } from '../../blood-hunter.js';

/**
 * Execute Blood Curse of Binding
 * @param {Actor} actor - The Blood Hunter actor
 * @param {MidiQOL.Workflow} workflow - The workflow
 * @param {boolean} amplify - Whether amplified
 */
export async function executeCurseOfBinding(actor, workflow, amplify) {
  const target = workflow.targets?.first();
  if (!target) return;

  // Reduce movement to 0
  const effectData = {
    name: 'Blood Curse of Binding',
    icon: 'icons/magic/blood/strike-body-explode-red.webp',
    duration: {
      turns: 1
    },
    changes: [
      {
        key: 'system.attributes.movement.all',
        mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
        value: '0',
        priority: 99
      }
    ],
    flags: {
      [MODULE_ID]: {
        bloodCurse: true,
        curseType: 'binding',
        amplified: amplify
      }
    }
  };

  if (amplify) {
    // Add restrained condition requirement (Strength save)
    const dc = 8 + actor.system.attributes.prof + Math.max(
      BloodHunterUtils.getModifier(actor.system.abilities.int.value),
      BloodHunterUtils.getModifier(actor.system.abilities.wis.value)
    );

    ui.notifications.info(`Target must make DC ${dc} Strength save or be restrained`);
  }

  await target.actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
}
