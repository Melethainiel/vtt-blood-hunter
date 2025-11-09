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
  console.log(`${MODULE_ID} | Initializing socket handlers`);

  game.socket.on(SOCKET_NAME, async(data) => {
    console.log(`${MODULE_ID} | Socket received:`, data);

    switch (data.action) {
      case 'fallenPuppetRequest':
        if (game.user.isGM) {
          await handleFallenPuppetRequest(data);
        }
        break;

      case 'fallenPuppetResponse':
        if (data.userId === game.user.id) {
          handleFallenPuppetResponse(data);
        }
        break;

      case 'notification':
        if (data.userId === game.user.id) {
          ui.notifications[data.type || 'info'](data.message);
        }
        break;

      default:
        console.warn(`${MODULE_ID} | Unknown socket action: ${data.action}`);
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
export async function requestFallenPuppetAttack(bloodHunterId, puppetTokenId, targetTokenId, weaponId, amplify, hemocraftDie) {
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

  console.log(`${MODULE_ID} | Sending Fallen Puppet request to GM:`, data);

  game.socket.emit(SOCKET_NAME, data);

  ui.notifications.info(game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.RequestSent') || 'Fallen Puppet request sent to GM...');
}

/**
 * Handle Fallen Puppet request from player (GM only)
 * @param {object} data - The request data
 */
async function handleFallenPuppetRequest(data) {
  const puppet = canvas.scene.tokens.get(data.puppetTokenId);
  const target = canvas.scene.tokens.get(data.targetTokenId);
  const bloodHunter = game.actors.get(data.bloodHunterId);

  if (!puppet || !target || !bloodHunter) {
    console.error(`${MODULE_ID} | Invalid tokens or actor in Fallen Puppet request`);
    notifyPlayer(data.playerId, game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.InvalidRequest') || 'Invalid request', 'error');
    return;
  }

  const weapon = puppet.actor.items.get(data.weaponId);
  if (!weapon) {
    console.error(`${MODULE_ID} | Weapon not found on puppet`);
    notifyPlayer(data.playerId, game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.WeaponNotFound') || 'Weapon not found', 'error');
    return;
  }

  // Create confirmation dialog for GM
  new Dialog({
    title: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Title'),
    content: `
      <div class="bloodhunter-gm-approval">
        <p><strong>${data.playerName}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.WantsToUse') || 'wants to use'} <strong>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Title')}</strong></p>
        <p>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.MakeAttack') || 'Make'} <strong>${puppet.name}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Attack') || 'attack'} <strong>${target.name}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.With') || 'with'} ${weapon.name}?</p>
        ${data.amplify ? `<p><em>${game.i18n.localize('BLOODHUNTER.BloodCurse.Amplified') || 'Amplified'}: +${data.hemocraftDie}</em></p>` : ''}
      </div>
    `,
    buttons: {
      approve: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Approve') || 'Approve',
        callback: async() => {
          await executeGMFallenPuppetAttack(data, puppet, target, weapon);
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
 * @param {Token} puppetToken - The puppet token
 * @param {Token} targetToken - The target token
 * @param {Item} weapon - The weapon item
 */
async function executeGMFallenPuppetAttack(data, puppetToken, targetToken, weapon) {
  try {
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

    // Apply amplified bonus to attack if needed
    let attackOptions = {};
    if (data.amplify && data.hemocraftDie) {
      attackOptions = {
        advantage: false,
        disadvantage: false,
        bonus: data.hemocraftDie
      };
    }

    // Execute weapon attack
    await weapon.use(attackOptions, { createMessage: true });

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
  game.socket.emit(SOCKET_NAME, {
    action: 'notification',
    userId: userId,
    message: message,
    type: type
  });
}
