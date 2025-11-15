/**
 * Socket handler for Blood Curse multiplayer communication
 * Handles GM/Player interactions for curses that require GM permissions
 */

import { handleFallenPuppetRequest } from './curses/curse-of-the-fallen-puppet.js';

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
