/**
 * Blood Maledict resource management
 */

import { BloodHunterUtils } from '../utils.js';
import { MODULE_ID } from '../blood-hunter.js';

/**
 * Get the Blood Maledict feature from actor
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {Item|null} The Blood Maledict feature or null
 */
export function getBloodMaledictFeature(actor) {
  return actor.items.find(i =>
    i.type === 'feat' &&
    (i.name.toLowerCase().includes('blood maledict') ||
     i.system?.identifier === 'blood-maledict')
  );
}

/**
 * Get max Blood Maledict uses based on Blood Hunter level
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {number} Max uses (1/2/3/4 based on level)
 */
export function getBloodMaledictMaxUses(actor) {
  const level = BloodHunterUtils.getBloodHunterLevel(actor);
  if (level >= 17) return 4;
  if (level >= 13) return 3;
  if (level >= 6) return 2;
  return 1;
}

/**
 * Update Blood Maledict max uses based on current level
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {Promise<boolean>} True if updated
 */
export async function updateBloodMaledictMaxUses(actor) {
  const maledictFeature = getBloodMaledictFeature(actor);
  if (!maledictFeature) return false;

  const expectedMax = getBloodMaledictMaxUses(actor);
  const currentMax = maledictFeature.system.uses.max;

  // Only update if different
  if (currentMax !== expectedMax.toString()) {
    await maledictFeature.update({
      'system.uses.max': expectedMax.toString()
    });
    console.log(`${MODULE_ID} | Updated Blood Maledict max uses to ${expectedMax}`);
    return true;
  }

  return false;
}

/**
 * Consume one use of Blood Maledict
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {Promise<boolean>} True if use was consumed
 */
export async function consumeBloodMaledictUse(actor) {
  const maledictFeature = getBloodMaledictFeature(actor);
  if (!maledictFeature) {
    console.warn(`${MODULE_ID} | No Blood Maledict feature found on ${actor.name}`);
    return false;
  }

  // Ensure max uses is correct for current level
  await updateBloodMaledictMaxUses(actor);

  const uses = maledictFeature.system.uses;
  if (uses && uses.max) {
    // dnd5e v3+ uses 'spent' field instead of decrementing 'value'
    // value = max - spent, so we increment spent to consume a use
    const currentSpent = uses.spent || 0;
    const newSpent = Math.min(currentSpent + 1, uses.max);

    await maledictFeature.update({
      'system.uses.spent': newSpent
    });

    console.log(`${MODULE_ID} | Consumed Blood Maledict use (${newSpent}/${uses.max} spent)`);
    return true;
  }

  return false;
}

/**
 * Check if actor has uses remaining for Blood Curses
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {boolean} True if uses remain
 */
export function hasUsesRemaining(actor) {
  // Check Blood Maledict uses only
  const maledictFeature = getBloodMaledictFeature(actor);
  if (maledictFeature) {
    const uses = maledictFeature.system.uses;
    if (uses && uses.max) {
      // Check remaining uses - compatible with both dnd5e v3 (spent) and v4 (value)
      let remaining;
      if (uses.spent !== undefined) {
        // dnd5e v3+ uses 'spent' field: remaining = max - spent
        const spent = uses.spent || 0;
        remaining = uses.max - spent;
      } else {
        // dnd5e v2 and some v4 uses 'value' field: remaining = value
        remaining = uses.value || 0;
      }
      return remaining > 0;
    }
  }

  // Fallback: if no Blood Maledict feature found, allow use (backward compatibility)
  return true;
}

/**
 * Reset Blood Curse uses at start of turn
 * DEPRECATED: No longer needed as we only track Blood Maledict charges
 * @param {Combat} combat - The combat instance
 * @param {Object} updateData - Update data
 */
export async function resetCurseUses(combat, updateData) {
  // No longer needed - Blood Maledict charges are tracked directly
  // Keeping this function for backward compatibility
  return;
}
