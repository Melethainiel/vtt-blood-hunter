/**
 * Blood Curse dialog UI components
 */

import { BloodHunterUtils } from '../utils.js';
import { MODULE_ID } from '../blood-hunter.js';
import { consumeBloodMaledictUse, hasUsesRemaining } from './maledict-resources.js';
import * as CurseImplementations from './curses/index.js';

/**
 * Calculate HP cost for amplifying a curse
 * Rolls the hemocraft die as per Blood Maledict rules
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {Promise<number>} HP cost (rolled hemocraft die)
 */
export async function calculateAmplificationCost(actor) {
  const hemocraftDie = BloodHunterUtils.getHemocraftDie(actor, 'blood-maledict');
  const roll = await new Roll(hemocraftDie).evaluate();

  // Show the roll in chat
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: game.i18n.localize('BLOODHUNTER.BloodCurse.AmplificationCost') || 'Blood Curse Amplification Cost'
  });

  return roll.total;
}

/**
 * Execute a Blood Curse
 * @param {Actor} actor - The Blood Hunter actor
 * @param {Item} curse - The curse item
 * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
 * @param {boolean} amplify - Whether to amplify
 */
export async function executeCurse(actor, curse, workflow, amplify = false) {
  // Calculate HP cost if amplified
  if (amplify) {
    const hpCost = await calculateAmplificationCost(actor);
    const currentHP = actor.system.attributes.hp.value;

    if (currentHP <= hpCost) {
      ui.notifications.warn('Insufficient HP to amplify Blood Curse');
      return;
    }

    await actor.update({
      'system.attributes.hp.value': currentHP - hpCost
    });

    ui.notifications.info(`Paid ${hpCost} HP to amplify Blood Curse`);
  }

  // Execute curse based on type
  await executeCurseEffect(actor, curse, workflow, amplify);

  // Mark curse as used this turn
  await curse.setFlag(MODULE_ID, 'usedThisTurn', true);

  // Create chat message
  await createCurseChatMessage(actor, curse, amplify);
}

/**
 * Execute the actual curse effect
 * @param {Actor} actor - The Blood Hunter actor
 * @param {Item} curse - The curse item
 * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
 * @param {boolean} amplify - Whether amplified
 */
async function executeCurseEffect(actor, curse, workflow, amplify) {
  const curseType = curse.flags[MODULE_ID]?.curseType;

  switch (curseType) {
    case 'marked':
      await CurseImplementations.executeCurseOfTheMarked(actor, workflow, amplify);
      break;
    case 'binding':
      await CurseImplementations.executeCurseOfBinding(actor, workflow, amplify);
      break;
    case 'anxious':
      await CurseImplementations.executeCurseOfTheAnxious(actor, workflow, amplify);
      break;
    case 'fallen_puppet':
      await CurseImplementations.executeCurseOfTheFallenPuppet(actor, workflow, amplify);
      break;
    default:
      console.warn(`${MODULE_ID} | Unknown curse type: ${curseType}`);
  }
}

/**
 * Create chat message for curse usage
 * @param {Actor} actor - The Blood Hunter actor
 * @param {Item} curse - The curse item
 * @param {boolean} amplify - Whether amplified
 */
export async function createCurseChatMessage(actor, curse, amplify) {
  const content = `
    <div class="bloodhunter-curse-message">
      <h3>${curse.name}${amplify ? ' (Amplified)' : ''}</h3>
      <p>${curse.system.description.value || ''}</p>
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: content,
    flags: {
      [MODULE_ID]: {
        bloodCurse: true,
        amplified: amplify
      }
    }
  });
}

/**
 * Prompt player to use a Blood Curse
 * @param {Actor} actor - The Blood Hunter actor
 * @param {Array} curses - Available curses
 * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
 */
export async function promptBloodCurse(actor, curses, workflow) {
  // Build curse options
  let curseOptions = '';
  for (const curse of curses) {
    curseOptions += `<option value="${curse.id}">${curse.name}</option>`;
  }

  // Create dialog
  const content = `
    <form class="bloodhunter-curse-prompt">
      <p>Use a Blood Curse?</p>
      <div class="form-group">
        <select name="curse" id="curse-select">
          <option value="">-- Select Curse --</option>
          ${curseOptions}
        </select>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" name="amplify" id="curse-amplify" />
          Amplify (costs HP)
        </label>
      </div>
    </form>
  `;

  // Show dialog with timeout
  return new Promise((resolve) => {
    const dialog = new Dialog({
      title: 'Blood Curse Reaction',
      content: content,
      buttons: {
        use: {
          icon: '<i class="fas fa-hand-sparkles"></i>',
          label: 'Use Curse',
          callback: async(html) => {
            const curseId = html.find('[name="curse"]').val();
            const amplify = html.find('[name="amplify"]').prop('checked');

            if (curseId) {
              const curse = actor.items.get(curseId);
              await executeCurse(actor, curse, workflow, amplify);
            }
            resolve(true);
          }
        },
        skip: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Skip',
          callback: () => resolve(false)
        }
      },
      default: 'skip',
      close: () => resolve(false)
    }, {
      width: 400
    });

    dialog.render(true);

    // Auto-close after 10 seconds
    setTimeout(() => {
      dialog.close();
    }, 10000);
  });
}

/**
 * Prompt Blood Hunter to use Fallen Puppet curse
 * @param {Actor} bloodHunter - The Blood Hunter actor
 * @param {Actor} fallenCreature - The creature that dropped to 0 HP
 * @param {Token} fallenToken - The specific token that dropped to 0 HP
 */
export async function promptFallenPuppet(bloodHunter, fallenCreature, fallenToken) {
  // Check if Blood Hunter has the Fallen Puppet curse
  const curse = bloodHunter.items.find(i =>
    i.flags?.[MODULE_ID]?.bloodCurse &&
    i.flags[MODULE_ID]?.curseType === 'fallen_puppet'
  );

  if (!curse) return;

  // Check if Blood Maledict uses are available
  if (!hasUsesRemaining(bloodHunter, curse)) {
    return;
  }

  // Create prompt dialog
  const content = `
    <form class="bloodhunter-fallen-puppet-prompt">
      <p><strong>${fallenCreature.name}</strong> has dropped to 0 hit points!</p>
      <p>Use <strong>${curse.name}</strong>?</p>
      <div class="form-group">
        <label>
          <input type="checkbox" name="amplify" id="fallen-puppet-amplify" />
          ${game.i18n.localize('BLOODHUNTER.BloodCurse.Amplify')} (${game.i18n.localize('BLOODHUNTER.BloodCurse.CostsHP')})
        </label>
      </div>
    </form>
  `;

  return new Promise((resolve) => {
    const dialog = new Dialog({
      title: curse.name,
      content: content,
      buttons: {
        use: {
          icon: '<i class="fas fa-hand-sparkles"></i>',
          label: game.i18n.localize('BLOODHUNTER.BloodCurse.Use'),
          callback: async(html) => {
            const amplify = html.find('[name="amplify"]').prop('checked');

            // Calculate HP cost if amplified
            if (amplify) {
              const hpCost = await calculateAmplificationCost(bloodHunter);
              const currentHP = bloodHunter.system.attributes.hp.value;

              if (currentHP <= hpCost) {
                ui.notifications.warn(game.i18n.localize('BLOODHUNTER.BloodCurse.InsufficientHP'));
                resolve(false);
                return;
              }

              await bloodHunter.update({
                'system.attributes.hp.value': currentHP - hpCost
              });

              ui.notifications.info(
                game.i18n.format('BLOODHUNTER.BloodCurse.HPPaid', { cost: hpCost })
              );
            }

            // Consume Blood Maledict use
            await consumeBloodMaledictUse(bloodHunter);

            // Execute the curse
            await CurseImplementations.executeCurseOfTheFallenPuppet(bloodHunter, fallenCreature, fallenToken, amplify);

            resolve(true);
          }
        },
        skip: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('BLOODHUNTER.BloodCurse.Skip'),
          callback: () => resolve(false)
        }
      },
      default: 'skip',
      close: () => resolve(false)
    }, {
      width: 400
    });

    dialog.render(true);

    // Auto-close after 10 seconds
    setTimeout(() => {
      dialog.close();
    }, 10000);
  });
}
