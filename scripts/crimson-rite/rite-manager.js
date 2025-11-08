/**
 * Crimson Rite lifecycle management
 */

import { BloodHunterUtils } from '../utils.js';
import { MODULE_ID } from '../blood-hunter.js';
import { BloodHunterIntegrations } from '../integrations.js';
import { RITE_TYPES } from './constants.js';
import { rollHPCost } from './rite-detection.js';

/**
 * Activate a Crimson Rite on a weapon
 * @param {Actor} actor - The Blood Hunter actor
 * @param {string} weaponId - The weapon item ID
 * @param {string} riteType - The type of rite to activate
 */
export async function activate(actor, weaponId, riteType) {
  const weapon = actor.items.get(weaponId);
  if (!weapon) return;

  // Check if weapon already has an active rite
  const existingRite = getActiveRite(weapon);
  if (existingRite) {
    // Remove existing rite first
    await deactivate(actor, weaponId, false);
  }

  // Roll HP cost (hemocraft die)
  const hpCost = await rollHPCost(actor);
  const currentHP = actor.system.attributes.hp.value;

  if (currentHP <= hpCost && game.settings.get(MODULE_ID, 'autoCalculateHP')) {
    ui.notifications.error(game.i18n.localize('BLOODHUNTER.CrimsonRite.InsufficientHP'));
    return;
  }

  // Apply HP cost using applyDamage() for better integration with midi-qol
  if (game.settings.get(MODULE_ID, 'autoCalculateHP')) {
    await actor.applyDamage(hpCost);
    ui.notifications.info(game.i18n.format('BLOODHUNTER.Notifications.HPCostApplied', { cost: hpCost }));
  }

  // Get rite damage and type
  const riteDamage = BloodHunterUtils.getHemocraftDie(actor, 'crimson-rite');
  const damageType = RITE_TYPES[riteType].damageType;

  // Create Active Effect data for the weapon
  const effectData = BloodHunterIntegrations.createCrimsonRiteEffect(
    riteType,
    damageType,
    riteDamage,
    weaponId,
    actor
  );

  // Apply Active Effect directly to the weapon
  try {
    const [effect] = await weapon.createEmbeddedDocuments('ActiveEffect', [effectData]);

    // Store effect metadata in weapon flags for easy retrieval
    await weapon.setFlag(MODULE_ID, 'crimsonRite', {
      effectId: effect.id,
      riteType: riteType,
      damageType: damageType,
      riteDamage: riteDamage
    });

    console.log(`${MODULE_ID} | Applied Crimson Rite Active Effect to ${weapon.name}`);
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to apply Crimson Rite:`, error);
    ui.notifications.error('Failed to apply Crimson Rite');
    return;
  }

  ui.notifications.info(
    game.i18n.format('BLOODHUNTER.CrimsonRite.Activated', {
      weapon: weapon.name,
      rite: game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + riteType)
    })
  );
}

/**
 * Deactivate a Crimson Rite on a weapon
 * @param {Actor} actor - The Blood Hunter actor
 * @param {string} weaponId - The weapon item ID
 * @param {boolean} showNotification - Whether to show notification
 */
export async function deactivate(actor, weaponId, showNotification = true) {
  const weapon = actor.items.get(weaponId);
  if (!weapon) return;

  const activeRite = getActiveRite(weapon);
  if (!activeRite) {
    if (showNotification) {
      ui.notifications.warn('No active Crimson Rite on this weapon');
    }
    return;
  }

  // Remove the Active Effect from the weapon
  try {
    await activeRite.delete();

    // Clear the weapon flag
    await weapon.unsetFlag(MODULE_ID, 'crimsonRite');

    console.log(`${MODULE_ID} | Removed Crimson Rite Active Effect from ${weapon.name}`);
  } catch (error) {
    console.error(`${MODULE_ID} | Failed to remove Active Effect:`, error);
    ui.notifications.error('Failed to remove Crimson Rite');
    return;
  }

  if (showNotification) {
    ui.notifications.info(
      game.i18n.format('BLOODHUNTER.CrimsonRite.Deactivated', {
        weapon: weapon.name
      })
    );
  }
}

/**
 * Get the active Crimson Rite Active Effect on a weapon
 * @param {Item} weapon - The weapon item
 * @returns {ActiveEffect|null} The active rite effect or null
 */
export function getActiveRite(weapon) {
  // Check if weapon has a Crimson Rite flag
  const riteFlag = weapon.getFlag(MODULE_ID, 'crimsonRite');
  if (!riteFlag?.effectId) return null;

  // Get the Active Effect from the weapon
  const effect = weapon.effects.get(riteFlag.effectId);

  // Verify it exists
  if (effect) {
    return effect;
  }

  return null;
}

/**
 * Remove all active Crimson Rites from an actor's weapons
 * Called when actor completes a short or long rest
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {Promise<number>} Number of rites removed
 */
export async function removeAllActiveRites(actor) {
  if (!actor) return 0;

  let ritesRemoved = 0;
  const weapons = actor.items.filter(i => i.type === 'weapon');

  for (const weapon of weapons) {
    const activeRite = getActiveRite(weapon);
    if (activeRite) {
      try {
        // Remove Active Effect from weapon
        await activeRite.delete();
        // Clear the weapon flag
        await weapon.unsetFlag(MODULE_ID, 'crimsonRite');
        ritesRemoved++;
        console.log(`${MODULE_ID} | Removed Crimson Rite from ${weapon.name}`);
      } catch (error) {
        console.error(`${MODULE_ID} | Failed to remove rite from ${weapon.name}:`, error);
      }
    }
  }

  return ritesRemoved;
}
