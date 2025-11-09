/**
 * Blood Curse of the Fallen Puppet implementation
 *
 * When a creature within 30 feet of you falls to 0 hit points, you can use your
 * reaction to give that creature a final act of aggression. That creature immediately
 * makes a single weapon attack against a target of your choice within its attack range.
 *
 * Amplified: You can first move the cursed creature up to half its walking speed.
 * The attack roll of the cursed creature's attack gains a bonus equal to your
 * hemocraft die.
 */

import { BloodHunterUtils } from '../../utils.js';
import { MODULE_ID } from '../../blood-hunter.js';
import { requestFallenPuppetAttack } from '../socket-handler.js';

/**
 * Execute Blood Curse of the Fallen Puppet
 * @param {Actor} actor - The Blood Hunter actor using the curse
 * @param {Actor} fallenCreature - The creature that fell to 0 HP (to be controlled)
 * @param {Token} fallenToken - The token of the fallen creature
 * @param {boolean} amplify - Whether the curse is amplified
 */
export async function executeCurseOfTheFallenPuppet(actor, fallenCreature, fallenToken, amplify) {
  if (!fallenCreature) {
    ui.notifications.warn('No fallen creature to control');
    return;
  }

  // Get hemocraft die for amplified attack bonus
  const hemocraftDie = amplify ? BloodHunterUtils.getHemocraftDie(actor, 'blood-maledict') : null;

  // Find equipped weapons on the fallen creature
  const weapons = fallenCreature.items.filter(i =>
    i.type === 'weapon' && i.system.equipped
  );

  if (weapons.length === 0) {
    ui.notifications.warn(game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.NoWeapons'));
    return;
  }

  // Build weapon selection options for dialog
  let weaponOptions = '';
  for (const weapon of weapons) {
    weaponOptions += `<option value="${weapon.id}">${weapon.name}</option>`;
  }

  // Get all available targets (exclude the fallen creature itself)
  const tokens = canvas.tokens.placeables.filter(t =>
    t.actor && (!fallenToken || t.id !== fallenToken.id)
  );

  let targetOptions = '';
  for (const token of tokens) {
    targetOptions += `<option value="${token.id}">${token.name}</option>`;
  }

  // Prompt player to choose weapon and target
  const content = `
    <form class="bloodhunter-fallen-puppet">
      <p>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Description')}</p>
      ${amplify ? `<p><strong>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Amplified')}</strong> +${hemocraftDie} ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.ToAttack')}</p>` : ''}
      <div class="form-group">
        <label>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.SelectWeapon')}:</label>
        <select name="weapon" id="puppet-weapon">
          ${weaponOptions}
        </select>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.SelectTarget')}:</label>
        <select name="target" id="puppet-target">
          ${targetOptions}
        </select>
      </div>
    </form>
  `;

  return new Promise((resolve) => {
    new Dialog({
      title: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Title'),
      content: content,
      buttons: {
        attack: {
          icon: '<i class="fas fa-crosshairs"></i>',
          label: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Attack'),
          callback: async(html) => {
            const weaponId = html.find('[name="weapon"]').val();
            const targetId = html.find('[name="target"]').val();

            const weapon = fallenCreature.items.get(weaponId);
            const targetToken = canvas.tokens.get(targetId);

            if (!weapon || !targetToken) {
              ui.notifications.error('Invalid weapon or target selection');
              resolve(false);
              return;
            }

            // If amplified, notify about movement option
            if (amplify && fallenToken) {
              const speed = fallenCreature.system.attributes.movement?.walk || 30;
              const halfSpeed = Math.floor(speed / 2);
              ui.notifications.info(
                game.i18n.format('BLOODHUNTER.BloodCurse.FallenPuppet.CanMove', {
                  distance: halfSpeed
                })
              );
            }

            // Create chat message describing the puppet attack
            const messageContent = `
              <div class="bloodhunter-puppet-attack">
                <h3>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Title')}</h3>
                <p><strong>${fallenCreature.name}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Attacks')} <strong>${targetToken.name}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.With')} ${weapon.name}</p>
                ${amplify ? `<p><em>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.AmplifiedBonus')}: +${hemocraftDie}</em></p>` : ''}
              </div>
            `;

            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: actor }),
              content: messageContent,
              flags: {
                [MODULE_ID]: {
                  bloodCurse: true,
                  curseType: 'fallen_puppet',
                  amplified: amplify
                }
              }
            });

            // Execute weapon attack
            try {
              // Check if current user is GM - GMs execute directly, players request via socket
              if (game.user.isGM) {
                // GM can execute directly
                // Store and clear current targets
                const previousTargets = Array.from(game.user.targets);

                previousTargets.forEach(t => t.setTarget(false, { user: game.user, releaseOthers: false }));

                // Set the chosen target
                targetToken.setTarget(true, { user: game.user, releaseOthers: true, groupSelection: false });

                // Apply amplified bonus to attack if needed
                let attackOptions = {};
                if (amplify && hemocraftDie) {
                  attackOptions = {
                    advantage: false,
                    disadvantage: false,
                    bonus: hemocraftDie
                  };
                }

                // Execute weapon attack using dnd5e v4 item.use()
                await weapon.use(attackOptions, { createMessage: true });

                // Restore previous targeting state
                targetToken.setTarget(false, { user: game.user, releaseOthers: false });
                previousTargets.forEach(t => {
                  if (t.id !== targetToken.id) {
                    t.setTarget(true, { user: game.user, releaseOthers: false });
                  }
                });

                resolve(true);
              } else {
                // Player - send request to GM via socket
                await requestFallenPuppetAttack(
                  actor.id,
                  fallenToken.id,
                  targetToken.id,
                  weapon.id,
                  amplify,
                  hemocraftDie
                );
                resolve(true);
              }
            } catch (error) {
              console.error('Error triggering Fallen Puppet attack:', error);
              ui.notifications.error(
                game.i18n.format('BLOODHUNTER.BloodCurse.FallenPuppet.AttackError', {
                  error: error.message
                })
              );
              resolve(false);
            }
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('BLOODHUNTER.BloodCurse.Cancel'),
          callback: () => resolve(false)
        }
      },
      default: 'attack'
    }, {
      width: 400
    }).render(true);
  });
}
