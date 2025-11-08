/**
 * Blood Curse detection logic
 */

import { CURSE_TYPES } from './curse-registry.js';
import { BloodHunterUtils } from '../utils.js';
import { MODULE_ID } from '../blood-hunter.js';
import { hasUsesRemaining } from './maledict-resources.js';

/**
 * Detect known curses from actor's features/items
 * @param {Actor} actor - The Blood Hunter actor
 * @returns {Array} Array of known curse keys
 */
export function getKnownCursesFromFeatures(actor) {
  const knownCurses = [];

  // Search through actor's features for Blood Curse items
  const features = actor.items.filter(i => i.type === 'feat' || i.type === 'feature');

  for (const feature of features) {
    const name = feature.name.toLowerCase();
    const description = feature.system?.description?.value?.toLowerCase() || '';

    // Check for each curse type
    for (const [key, value] of Object.entries(CURSE_TYPES)) {
      const curseName = value.name.toLowerCase();

      // Check if feature mentions this curse
      if (name.includes(curseName) ||
          name.includes(key) ||
          description.includes(curseName) ||
          description.includes(key)) {

        if (!knownCurses.includes(key)) {
          knownCurses.push(key);
        }
      }

      // Check for specific curse patterns
      const curseKeywords = {
        binding: ['binding', 'bind'],
        marked: ['marked', 'mark'],
        anxious: ['anxious', 'anxiety'],
        eyeless: ['eyeless', 'blind'],
        fallen_puppet: ['fallen puppet', 'puppet'],
        bloated_agony: ['bloated agony', 'agony'],
        corrosion: ['corrosion', 'corrode'],
        exorcism: ['exorcism', 'exorcise']
      };

      if (curseKeywords[key]) {
        for (const keyword of curseKeywords[key]) {
          if (name.includes(keyword) || description.includes(keyword)) {
            if (!knownCurses.includes(key)) {
              knownCurses.push(key);
            }
          }
        }
      }
    }

    // Check for module flag
    if (feature.flags[MODULE_ID]?.bloodCurse) {
      const curseType = feature.flags[MODULE_ID].curseType;
      if (curseType && !knownCurses.includes(curseType)) {
        knownCurses.push(curseType);
      }
    }
  }

  return knownCurses;
}

/**
 * Get known curses by Blood Hunter level
 * @param {number} level - Blood Hunter level
 * @returns {Array} Array of curse keys available at this level
 */
export function getKnownCursesByLevel(level) {
  const curses = [];

  // Level 1 curses
  if (level >= 1) {
    curses.push('binding', 'marked', 'anxious');
  }

  // Level 6 curses
  if (level >= 6) {
    curses.push('eyeless', 'fallen_puppet');
  }

  // Level 10 curses
  if (level >= 10) {
    curses.push('bloated_agony');
  }

  // Level 14 curses
  if (level >= 14) {
    curses.push('corrosion');
  }

  // Level 18 curses
  if (level >= 18) {
    curses.push('exorcism');
  }

  return curses;
}

/**
 * Get available Blood Curses for an actor
 * @param {Actor} actor - The Blood Hunter actor
 * @param {string} timing - The timing filter
 * @returns {Array} Available curses
 */
export function getAvailableCurses(actor, timing = null) {
  const bloodHunterLevel = BloodHunterUtils.getBloodHunterLevel(actor);
  const detectionMode = game.settings.get(MODULE_ID, 'curseDetectionMode') || 'auto';

  let knownCurses = [];

  // Detect curses based on mode
  if (detectionMode === 'features' || detectionMode === 'auto') {
    knownCurses = getKnownCursesFromFeatures(actor);
  }

  // Fallback to level-based if auto mode and no features found
  if (detectionMode === 'auto' && knownCurses.length === 0) {
    knownCurses = getKnownCursesByLevel(bloodHunterLevel);
  } else if (detectionMode === 'level') {
    knownCurses = getKnownCursesByLevel(bloodHunterLevel);
  }

  // Filter actor's items to only those curses that are known
  return actor.items.filter(i =>
    i.type === 'feat' &&
    i.flags[MODULE_ID]?.bloodCurse &&
    (!timing || i.flags[MODULE_ID]?.timing === timing) &&
    knownCurses.includes(i.flags[MODULE_ID]?.curseType) &&
    bloodHunterLevel >= (i.flags[MODULE_ID]?.minLevel || 1) &&
    hasUsesRemaining(actor, i)
  );
}
