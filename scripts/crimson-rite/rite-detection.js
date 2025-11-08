/**
 * Crimson Rite detection logic
 */

import { BloodHunterUtils } from '../utils.js';
import { MODULE_ID } from '../blood-hunter.js';
import { RITE_TYPES } from './constants.js';

/**
 * Roll HP cost for Crimson Rite activation
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {Promise<number>} The rolled HP cost
 */
export async function rollHPCost(actor) {
  const hemocraftDie = BloodHunterUtils.getHemocraftDie(actor, 'crimson-rite');
  const roll = await new Roll(`${hemocraftDie}[necrotic]`).evaluate();

  // Display roll in chat
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    flavor: game.i18n.localize('BLOODHUNTER.CrimsonRite.Title') + ' - ' + game.i18n.localize('BLOODHUNTER.CrimsonRite.Cost')
  });

  return roll.total;
}

/**
 * Detect known rites from actor's features/items
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {Array} Array of known rite keys
 */
export function getKnownRitesFromFeatures(actor) {
  const knownRites = [];

  // Search through actor's features for Crimson Rite items
  const features = actor.items.filter(i => i.type === 'feat' || i.type === 'feature');

  for (const feature of features) {
    const name = feature.name.toLowerCase();
    const description = feature.system?.description?.value?.toLowerCase() || '';

    // Priority 1: Check for module flag (most reliable)
    if (feature.flags[MODULE_ID]?.crimsonRite) {
      const riteType = feature.flags[MODULE_ID].riteType;
      if (riteType && RITE_TYPES[riteType] && !knownRites.includes(riteType)) {
        knownRites.push(riteType);
        console.log(`${MODULE_ID} | Detected rite from module flag: ${riteType} (from "${feature.name}")`);
        continue; // Skip other checks for this feature
      }
    }

    // Check if this feature is related to Crimson Rite at all
    // Support both English and French
    const isCrimsonRiteFeature = name.includes('crimson rite') ||
                                  name.includes('rite écarlate') ||
                                  description.includes('crimson rite') ||
                                  description.includes('rite écarlate');

    if (!isCrimsonRiteFeature) {
      continue; // Skip features that aren't related to Crimson Rite
    }

    // Priority 2: Check for specific rite patterns with context
    for (const key of Object.keys(RITE_TYPES)) {
      // Get localized name and clean it (remove damage type in parentheses)
      const localizedName = game.i18n.localize(`BLOODHUNTER.CrimsonRite.Types.${key}`);
      // Remove everything after and including the opening parenthesis
      const cleanedName = localizedName.replace(/\s*\([^)]*\).*$/, '').toLowerCase();

      // Debug log to see what we're comparing
      console.log(`${MODULE_ID} | Checking rite ${key}: cleanedName="${cleanedName}"`);

      // Check for D&D Beyond format patterns:
      // English: "Crimson Rite: Rite of the Flame"
      // French: "Rite Écarlate: Rite de la Flamme"

      // Pattern 1: Full localized name (e.g., "rite of the flame", "rite de la flamme")
      if (name.includes(cleanedName)) {
        if (!knownRites.includes(key)) {
          knownRites.push(key);
          console.log(`${MODULE_ID} | Detected rite from localized name: ${key} (from "${feature.name}")`);
          continue;
        }
      }

      // Pattern 2: DDB Importer format with "Crimson Rite: " prefix
      // English: "crimson rite: rite of the flame", "crimson rite: rite of flame"
      // French: "rite écarlate: rite de la flamme", "rite écarlate: rite du givre"
      const ddbPatterns = [
        `crimson rite: rite of the ${key}`,
        `crimson rite: rite of ${key}`,
        `rite écarlate: rite de la ${key}`,
        `rite écarlate: rite de l'${key}`,
        `rite écarlate: rite du ${key}`,
        `rite écarlate: rite des ${key}`
      ];

      for (const pattern of ddbPatterns) {
        if (name.includes(pattern)) {
          if (!knownRites.includes(key)) {
            knownRites.push(key);
            console.log(`${MODULE_ID} | Detected rite from DDB Importer pattern: ${key} (pattern: "${pattern}", from "${feature.name}")`);
            break;
          }
        }
      }

      // Pattern 3: English D&D Beyond patterns with rite key (without prefix)
      // "rite of the flame", "rite of flame"
      const englishPatterns = [
        `rite of the ${key}`,
        `rite of ${key}`
      ];

      for (const pattern of englishPatterns) {
        if (name.includes(pattern)) {
          if (!knownRites.includes(key)) {
            knownRites.push(key);
            console.log(`${MODULE_ID} | Detected rite from English pattern: ${key} (pattern: "${pattern}", from "${feature.name}")`);
            break;
          }
        }
      }

      // Pattern 4: French D&D Beyond patterns with rite key (without prefix)
      // "rite de la flamme", "rite du givre"
      const frenchPatterns = [
        `rite de la ${key}`,
        `rite de l'${key}`,
        `rite du ${key}`,
        `rite des ${key}`
      ];

      for (const pattern of frenchPatterns) {
        if (name.includes(pattern)) {
          if (!knownRites.includes(key)) {
            knownRites.push(key);
            console.log(`${MODULE_ID} | Detected rite from French pattern: ${key} (pattern: "${pattern}", from "${feature.name}")`);
            break;
          }
        }
      }
    }
  }

  if (knownRites.length > 0) {
    console.log(`${MODULE_ID} | Total rites detected from features: ${knownRites.length}`, knownRites);
  } else {
    console.log(`${MODULE_ID} | No rites detected from features`);
  }

  return knownRites;
}

/**
 * Get available rites for an actor based on their features or level
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {Object} Available rites
 */
export function getAvailableRites(actor) {
  const bloodHunterLevel = BloodHunterUtils.getBloodHunterLevel(actor);
  const available = {};

  // Check module setting for detection mode
  const detectionMode = game.settings.get(MODULE_ID, 'riteDetectionMode') || 'auto';

  let knownRites = [];

  if (detectionMode === 'features' || detectionMode === 'auto') {
    // Try to detect rites from features first
    knownRites = getKnownRitesFromFeatures(actor);
  }

  // If no rites found in features and mode is auto, fall back to level-based
  if (knownRites.length === 0 && detectionMode === 'auto') {
    console.log(`${MODULE_ID} | No rites found in features, using level-based detection`);

    for (const [key, value] of Object.entries(RITE_TYPES)) {
      if (bloodHunterLevel >= value.level) {
        available[key] = value;
      }
    }
  }
  // If mode is features-only or we found rites, use those
  else if (knownRites.length > 0) {
    console.log(`${MODULE_ID} | Found ${knownRites.length} rites in features:`, knownRites);

    for (const riteKey of knownRites) {
      if (RITE_TYPES[riteKey]) {
        available[riteKey] = RITE_TYPES[riteKey];
      }
    }
  }
  // If mode is level-only, use level-based
  else if (detectionMode === 'level') {
    for (const [key, value] of Object.entries(RITE_TYPES)) {
      if (bloodHunterLevel >= value.level) {
        available[key] = value;
      }
    }
  }

  return available;
}
