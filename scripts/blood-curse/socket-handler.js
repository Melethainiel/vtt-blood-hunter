/**
 * Socket handler for Blood Curse multiplayer communication
 * Handles GM/Player interactions for curses that require GM permissions
 */

// Define MODULE_ID locally to avoid circular dependency with blood-hunter.js
const MODULE_ID = 'vtt-blood-hunter';
const SOCKET_NAME = `module.${MODULE_ID}`;

/**
 * Initialize socket listeners
 * Called once during module ready hook
 */
export function initSocket() {
  if (!game.socket) {
    console.error(`${MODULE_ID} | game.socket not available during initSocket()`);
    return;
  }

  console.log(`${MODULE_ID} | Initializing socket handlers for: ${SOCKET_NAME}`);

  game.socket.on(SOCKET_NAME, async(data) => {
    console.log(`${MODULE_ID} | Socket received on ${SOCKET_NAME}:`, data);

    try {
      switch (data.action) {
        case 'fallenPuppetRequest':
          if (game.user.isGM) {
            console.log(`${MODULE_ID} | Processing fallenPuppetRequest as GM`);
            await handleFallenPuppetRequest(data);
          } else {
            console.log(`${MODULE_ID} | Ignoring fallenPuppetRequest (not GM)`);
          }
          break;

        case 'fallenPuppetResponse':
          if (data.userId === game.user.id) {
            console.log(`${MODULE_ID} | Processing fallenPuppetResponse for this user`);
            handleFallenPuppetResponse(data);
          } else {
            console.log(`${MODULE_ID} | Ignoring fallenPuppetResponse (different user)`);
          }
          break;

        case 'notification':
          if (data.userId === game.user.id) {
            console.log(`${MODULE_ID} | Displaying notification for this user`);
            ui.notifications[data.type || 'info'](data.message);
          } else {
            console.log(`${MODULE_ID} | Ignoring notification (different user)`);
          }
          break;

        default:
          console.warn(`${MODULE_ID} | Unknown socket action: ${data.action}`);
      }
    } catch (error) {
      console.error(`${MODULE_ID} | Error handling socket message:`, error);
    }
  });

  console.log(`${MODULE_ID} | Socket handlers initialized successfully`);
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
export async function requestFallenPuppetAttack(bloodHunterId, puppetTokenId, targetTokenId, weaponId, amplify, hemocraftDie) {
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

  console.log(`${MODULE_ID} | Emitting to socket ${SOCKET_NAME}:`, data);

  try {
    game.socket.emit(SOCKET_NAME, data);
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
 * @param {object} data - The request data
 */
async function handleFallenPuppetRequest(data) {
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
          await executeGMFallenPuppetAttack(data, puppetToken, targetToken, weapon);
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
 */
async function executeGMFallenPuppetAttack(data, puppetToken, targetToken, weapon) {
  try {
    // Validate that we received Token objects with setTarget method
    if (!puppetToken || !targetToken) {
      throw new Error('Invalid token objects - tokens not found on canvas');
    }
    if (typeof targetToken.setTarget !== 'function') {
      throw new Error('targetToken is not a Token object (missing setTarget method)');
    }

    // Create chat message describing the puppet attack
    const bloodHunter = game.actors.get(data.bloodHunterId);
    const messageContent = `
      <div class="bloodhunter-puppet-attack">
        <h3>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Title')}</h3>
        <p><strong>${puppetToken.name}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Attacks')} <strong>${targetToken.name}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.With')} ${weapon.name}</p>
        ${data.amplify ? `<p><em>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.AmplifiedBonus')}: +${data.hemocraftDie}</em></p>` : ''}
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: bloodHunter }),
      content: messageContent,
      flags: {
        [MODULE_ID]: {
          bloodCurse: true,
          curseType: 'fallen_puppet',
          amplified: data.amplify
        }
      }
    });

    // Store and clear current targets
    const previousTargets = Array.from(game.user.targets);
    previousTargets.forEach(t => t.setTarget(false, { user: game.user, releaseOthers: false }));

    // Set the chosen target
    targetToken.setTarget(true, { user: game.user, releaseOthers: true, groupSelection: false });

    // Apply temporary effect to puppet for amplified attack bonus
    let effectId;
    if (data.amplify && data.hemocraftDie) {
      const effectData = {
        name: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.AttackBonus'),
        icon: 'icons/magic/death/skull-humanoid-crown-white.webp',
        changes: [
          {
            key: 'system.bonuses.mwak.attack',
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: data.hemocraftDie,
            priority: 20
          },
          {
            key: 'system.bonuses.rwak.attack',
            mode: CONST.ACTIVE_EFFECT_MODES.ADD,
            value: data.hemocraftDie,
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

      const effect = await puppetToken.actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
      effectId = effect[0].id;
      console.log(`${MODULE_ID} | Applied Fallen Puppet effect to ${puppetToken.name}: ${data.hemocraftDie}`);
    }

    // Execute weapon attack
    await weapon.use({}, { createMessage: true });

    // Remove the temporary effect immediately after attack
    if (effectId) {
      await puppetToken.actor.deleteEmbeddedDocuments('ActiveEffect', [effectId]);
      console.log(`${MODULE_ID} | Removed Fallen Puppet effect from ${puppetToken.name}`);
    }

    // Restore previous targeting state
    targetToken.setTarget(false, { user: game.user, releaseOthers: false });
    previousTargets.forEach(t => {
      if (t.id !== targetToken.id) {
        t.setTarget(true, { user: game.user, releaseOthers: false });
      }
    });

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

/**
 * Handle Fallen Puppet response from GM
 * @param {object} data - The response data
 */
function handleFallenPuppetResponse(data) {
  if (data.approved) {
    ui.notifications.success(data.message);
  } else {
    ui.notifications.warning(data.message);
  }
}

/**
 * Send notification to a specific player
 * @param {string} userId - The user ID to notify
 * @param {string} message - The notification message
 * @param {string} type - Notification type: 'info', 'warning', 'error', 'success'
 */
export function notifyPlayer(userId, message, type = 'info') {
  if (!game.socket) {
    console.error(`${MODULE_ID} | game.socket not available, cannot send notification`);
    return;
  }

  const data = {
    action: 'notification',
    userId: userId,
    message: message,
    type: type
  };

  console.log(`${MODULE_ID} | Sending notification to user ${userId}:`, data);

  try {
    game.socket.emit(SOCKET_NAME, data);
    console.log(`${MODULE_ID} | Notification sent successfully`);
  } catch (error) {
    console.error(`${MODULE_ID} | Error sending notification:`, error);
  }
}
