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
import { notifyPlayer } from '../socket-handler.js';

// Lazy getter to avoid circular dependency issues
const getSocketName = () => `module.${MODULE_ID}`;

/**
 * Execute the actual Fallen Puppet attack
 * @param {Actor} fallenCreature - The puppet creature
 * @param {Token} targetToken - The target token
 * @param {Item} weapon - The weapon to use
 * @param {boolean} amplify - Whether amplified
 * @param {string} hemocraftDie - The hemocraft die value (e.g., "1d6")
 */
export async function executeFallenPuppetAttack(fallenCreature, targetToken, weapon, amplify, hemocraftDie) {
  // Store and clear current targets
  const previousTargets = Array.from(game.user.targets);
  previousTargets.forEach(t => t.setTarget(false, { user: game.user, releaseOthers: false }));

  // Set the chosen target
  targetToken.setTarget(true, { user: game.user, releaseOthers: true, groupSelection: false });

  // Apply temporary effect to puppet for amplified attack bonus
  if (amplify && hemocraftDie) {
    const effectData = {
      name: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.AttackBonus'),
      icon: 'icons/magic/death/skull-humanoid-crown-white.webp',
      changes: [
        {
          key: 'system.bonuses.mwak.attack',
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: hemocraftDie,
          priority: 20
        },
        {
          key: 'system.bonuses.rwak.attack',
          mode: CONST.ACTIVE_EFFECT_MODES.ADD,
          value: hemocraftDie,
          priority: 20
        }
      ],
      duration: {
        turns: 1
      },
      flags: {
        [MODULE_ID]: {
          bloodCurse: true,
          curseType: 'fallen_puppet',
          temporary: true
        }
      }
    };

    // Add DAE special duration if DAE is active
    const isDaeActive = game.modules.get('dae')?.active;
    if (isDaeActive) {
      effectData.flags.dae = {
        specialDuration: ['1Attack']
      };
    }

    await fallenCreature.createEmbeddedDocuments('ActiveEffect', [effectData]);
    console.log(`${MODULE_ID} | Applied Fallen Puppet effect to ${fallenCreature.name}: ${hemocraftDie} bonus to attack`);
  }

  // Execute weapon attack using dnd5e item.use()
  await weapon.use({}, { createMessage: true });

  // Restore previous targeting state
  targetToken.setTarget(false, { user: game.user, releaseOthers: false });
  previousTargets.forEach(t => {
    if (t.id !== targetToken.id) {
      t.setTarget(true, { user: game.user, releaseOthers: false });
    }
  });
}

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
    i.system.range?.value === null // melee weapon (no range)
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

            // Execute weapon attack
            try {
              // Check if current user is GM - GMs execute directly, players request via socket
              if (game.user.isGM) {
                // GM can execute directly - create chat message first
                await createFallenPuppetChatMessage(
                  actor,
                  fallenCreature.name,
                  targetToken.name,
                  weapon.name,
                  amplify,
                  hemocraftDie
                );
                await executeFallenPuppetAttack(fallenCreature, targetToken, weapon, amplify, hemocraftDie);
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

/**
 * Create chat message for Fallen Puppet attack
 * @param {Actor} bloodHunter - The Blood Hunter actor
 * @param {string} puppetName - Name of the puppet creature
 * @param {string} targetName - Name of the target
 * @param {string} weaponName - Name of the weapon
 * @param {boolean} amplify - Whether amplified
 * @param {string} hemocraftDie - The hemocraft die value
 */
async function createFallenPuppetChatMessage(bloodHunter, puppetName, targetName, weaponName, amplify, hemocraftDie) {
  const messageContent = `
    <div class="bloodhunter-puppet-attack">
      <h3>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Title')}</h3>
      <p><strong>${puppetName}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Attacks')} <strong>${targetName}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.With')} ${weaponName}</p>
      ${amplify ? `<p><em>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.AmplifiedBonus')}: +${hemocraftDie}</em></p>` : ''}
    </div>
  `;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: bloodHunter }),
    content: messageContent,
    flags: {
      [MODULE_ID]: {
        bloodCurse: true,
        curseType: 'fallen_puppet',
        amplified: amplify
      }
    }
  });
}

/**
 * Request Fallen Puppet attack from GM
 * Called by player when they want to use Fallen Puppet curse
 * @param {string} bloodHunterId - The Blood Hunter actor ID
 * @param {string} puppetTokenId - The fallen creature's token ID
 * @param {string} targetTokenId - The target token ID
 * @param {string} weaponId - The weapon item ID to use
 * @param {boolean} amplify - Whether the curse is amplified
 * @param {string} hemocraftDie - The hemocraft die (e.g., "1d6")
 */
async function requestFallenPuppetAttack(bloodHunterId, puppetTokenId, targetTokenId, weaponId, amplify, hemocraftDie) {
  if (!game.socket) {
    console.error(`${MODULE_ID} | game.socket not available, cannot send request`);
    ui.notifications.error('Socket not available, cannot send request to GM');
    return;
  }

  const data = {
    action: 'fallenPuppetRequest',
    bloodHunterId: bloodHunterId,
    puppetTokenId: puppetTokenId,
    targetTokenId: targetTokenId,
    weaponId: weaponId,
    amplify: amplify,
    hemocraftDie: hemocraftDie,
    playerId: game.user.id,
    playerName: game.user.name
  };

  console.log(`${MODULE_ID} | Emitting to socket ${getSocketName()}:`, data);

  try {
    game.socket.emit(getSocketName(), data);
    console.log(`${MODULE_ID} | Socket emit successful`);
  } catch (error) {
    console.error(`${MODULE_ID} | Error emitting socket:`, error);
    ui.notifications.error(`Failed to send request: ${error.message}`);
    return;
  }

  ui.notifications.info(game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.RequestSent') || 'Fallen Puppet request sent to GM...');
}

/**
 * Handle Fallen Puppet request from player (GM only)
 * Called by socket-handler when GM receives request
 * @param {object} data - The request data
 */
export async function handleFallenPuppetRequest(data) {
  const puppetDoc = canvas.scene.tokens.get(data.puppetTokenId);
  const targetDoc = canvas.scene.tokens.get(data.targetTokenId);
  const bloodHunter = game.actors.get(data.bloodHunterId);

  if (!puppetDoc || !targetDoc || !bloodHunter) {
    console.error(`${MODULE_ID} | Invalid tokens or actor in Fallen Puppet request`);
    notifyPlayer(data.playerId, game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.InvalidRequest') || 'Invalid request', 'error');
    return;
  }

  const weapon = puppetDoc.actor.items.get(data.weaponId);
  if (!weapon) {
    console.error(`${MODULE_ID} | Weapon not found on puppet`);
    notifyPlayer(data.playerId, game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.WeaponNotFound') || 'Weapon not found', 'error');
    return;
  }

  // Get the actual Token objects (not TokenDocuments) for targeting
  const puppetToken = canvas.tokens.get(data.puppetTokenId);
  const targetToken = canvas.tokens.get(data.targetTokenId);

  // Create confirmation dialog for GM
  new Dialog({
    title: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Title'),
    content: `
      <div class="bloodhunter-gm-approval">
        <p><strong>${data.playerName}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.WantsToUse') || 'wants to use'} <strong>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Title')}</strong></p>
        <p>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.MakeAttack') || 'Make'} <strong>${puppetDoc.name}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Attack') || 'attack'} <strong>${targetDoc.name}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.With') || 'with'} ${weapon.name}?</p>
        ${data.amplify ? `<p><em>${game.i18n.localize('BLOODHUNTER.BloodCurse.Amplified') || 'Amplified'}: +${data.hemocraftDie}</em></p>` : ''}
      </div>
    `,
    buttons: {
      approve: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Approve') || 'Approve',
        callback: async() => {
          await executeGMFallenPuppetAttack(data, puppetToken, targetToken, weapon, bloodHunter);
        }
      },
      deny: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Deny') || 'Deny',
        callback: () => {
          notifyPlayer(data.playerId, game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Denied') || 'Fallen Puppet request denied by GM', 'warning');
        }
      }
    },
    default: 'approve'
  }).render(true);
}

/**
 * Execute Fallen Puppet attack as GM
 * @param {object} data - The request data
 * @param {Token} puppetToken - The puppet token object (not TokenDocument)
 * @param {Token} targetToken - The target token object (not TokenDocument)
 * @param {Item} weapon - The weapon item
 * @param {Actor} bloodHunter - The Blood Hunter actor
 */
async function executeGMFallenPuppetAttack(data, puppetToken, targetToken, weapon, bloodHunter) {
  try {
    // Validate that we received Token objects with setTarget method
    if (!puppetToken || !targetToken) {
      throw new Error('Invalid token objects - tokens not found on canvas');
    }
    if (typeof targetToken.setTarget !== 'function') {
      throw new Error('targetToken is not a Token object (missing setTarget method)');
    }

    // Create chat message describing the puppet attack
    await createFallenPuppetChatMessage(
      bloodHunter,
      puppetToken.name,
      targetToken.name,
      weapon.name,
      data.amplify,
      data.hemocraftDie
    );

    // Execute the attack using the shared function
    await executeFallenPuppetAttack(puppetToken.actor, targetToken, weapon, data.amplify, data.hemocraftDie);

    // Notify player of success
    notifyPlayer(data.playerId, game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Approved') || 'Fallen Puppet approved by GM!', 'success');

  } catch (error) {
    console.error(`${MODULE_ID} | Error executing Fallen Puppet attack:`, error);
    notifyPlayer(
      data.playerId,
      game.i18n.format('BLOODHUNTER.BloodCurse.FallenPuppet.AttackError', { error: error.message }) || `Attack error: ${error.message}`,
      'error'
    );
  }
}
