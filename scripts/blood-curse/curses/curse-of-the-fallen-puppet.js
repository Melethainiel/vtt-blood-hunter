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

  // Get melee weapons from the fallen creature (the puppet)
  const weapons = fallenCreature.items.filter(i =>
    i.type === 'weapon' &&
    i.system.equipped &&
    i.system.actionType === 'mwak' // melee weapon attack only
  );

  if (weapons.length === 0) {
    ui.notifications.warn(game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.NoWeapons'));
    return;
  }

  // Build weapon options from the fallen creature
  const weaponOptions = weapons.map(w =>
    `<option value="${w.id}">${w.name}</option>`
  ).join('');

  // Get all potential targets (creatures around the fallen puppet)
  const targetTokens = canvas.tokens.placeables.filter(t =>
    t.actor && (!fallenToken || t.id !== fallenToken.id)
  );

  if (targetTokens.length === 0) {
    ui.notifications.warn('No available targets found');
    return;
  }

  // Build target options
  const targetOptions = targetTokens.map(t =>
    `<option value="${t.id}">${t.name}</option>`
  ).join('');

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

                // Apply temporary effect to puppet for amplified attack bonus
                let effectId;
                if (amplify && hemocraftDie) {
                  const effectData = {
                    name: 'Fallen Puppet - Attack Bonus',
                    icon: 'icons/magic/death/skull-humanoid-crown-white.webp',
                    changes: [
                      {
                        key: 'system.bonuses.abilities.attack',
                        mode: 2, // ADD
                        value: hemocraftDie,
                        priority: 20
                      }
                    ],
                    duration: {
                      turns: 1,
                      seconds: 6
                    },
                    flags: {
                      [MODULE_ID]: {
                        bloodCurse: true,
                        curseType: 'fallen_puppet',
                        temporary: true
                      }
                    }
                  };

                  const effect = await fallenCreature.createEmbeddedDocuments('ActiveEffect', [effectData]);
                  effectId = effect[0].id;
                  console.log(`${MODULE_ID} | Applied Fallen Puppet effect to ${fallenCreature.name}: ${hemocraftDie}`);
                }

                // Execute weapon attack using dnd5e item.use()
                await weapon.use({}, { createMessage: true });

                // Remove the temporary effect immediately after attack
                if (effectId) {
                  await fallenCreature.deleteEmbeddedDocuments('ActiveEffect', [effectId]);
                  console.log(`${MODULE_ID} | Removed Fallen Puppet effect from ${fallenCreature.name}`);
                }

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
