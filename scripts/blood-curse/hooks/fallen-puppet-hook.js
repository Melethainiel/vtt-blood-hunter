/**
 * Fallen Puppet hook handler
 * Detects when creatures drop to 0 HP and prompts Blood Hunters with the curse
 */

import { BloodHunterUtils } from '../../utils.js';
import { MODULE_ID } from '../../blood-hunter.js';
import { getBloodMaledictFeature } from '../maledict-resources.js';

/**
 * Handle Fallen Puppet trigger when a creature drops to 0 HP
 * @param {Actor} fallenActor - The actor that dropped to 0 HP
 * @returns {Promise<void>}
 */
export async function handleFallenPuppetTrigger(fallenActor) {
  console.log(`${MODULE_ID} | Checking for Blood Hunters with Fallen Puppet curse for ${fallenActor.name}`);

  // Find the fallen token ONCE (not inside the loop)
  // For synthetic actors (unlinked tokens), actor.parent.id gives the token ID
  // For linked actors, we need to find by actor.id
  const fallenToken = canvas.tokens?.placeables.find(t =>
    t.id === fallenActor.parent?.id || t.actor?.id === fallenActor.id
  );

  if (!fallenToken) {
    console.log(`${MODULE_ID} | No token found for fallen creature ${fallenActor.name}`);
    return;
  }

  // Find all Blood Hunters in the scene with Fallen Puppet curse
  const bloodHunters = canvas.tokens?.placeables.filter(t =>
    t.actor &&
    BloodHunterUtils.isBloodHunter(t.actor) &&
    t.actor.items.some(i =>
      i.flags?.[MODULE_ID]?.bloodCurse &&
      i.flags[MODULE_ID]?.curseType === 'fallen_puppet'
    )
  ) || [];

  console.log(`${MODULE_ID} | Found ${bloodHunters.length} Blood Hunters with Fallen Puppet curse`);

  for (const bhToken of bloodHunters) {
    const bloodHunter = bhToken.actor;

    // Check if fallen creature is within 30 feet
    const distance = canvas.grid?.measureDistance(bhToken, fallenToken);
    console.log(`${MODULE_ID} | Distance from ${bloodHunter.name} to ${fallenActor.name}: ${distance} feet`);

    if (distance > 30) continue;

    // Check if Blood Hunter can use Blood Maledict
    if (!canUseBloodMaledict(bloodHunter)) continue;

    // Check ownership and prompt if appropriate
    if (shouldPromptUser(bloodHunter)) {
      console.log(`${MODULE_ID} | Prompting ${game.user.name} to use Fallen Puppet`);
      const { promptFallenPuppet } = await import('../curse-dialogs.js');
      await promptFallenPuppet(bloodHunter, fallenActor, fallenToken);
    } else {
      console.log(`${MODULE_ID} | Skipping prompt - user ${game.user.name} should not be prompted`);
    }
  }
}

/**
 * Check if a Blood Hunter can use Blood Maledict
 * @param {Actor} bloodHunter - The Blood Hunter actor
 * @returns {boolean} True if can use Blood Maledict
 */
function canUseBloodMaledict(bloodHunter) {
  const maledictFeature = getBloodMaledictFeature(bloodHunter);

  if (!maledictFeature) {
    console.warn(`${MODULE_ID} | ${bloodHunter.name} has no Blood Maledict feature`);
    return false;
  }

  const uses = maledictFeature.system.uses;
  if (!uses || !uses.max) {
    console.log(`${MODULE_ID} | ${bloodHunter.name} has no Blood Maledict uses configured`);
    return false;
  }

  const remaining = uses.value || 0;
  console.log(`${MODULE_ID} | ${bloodHunter.name} Blood Maledict: ${remaining}/${uses.max} remaining`);

  if (remaining <= 0) {
    console.log(`${MODULE_ID} | ${bloodHunter.name} has no Blood Maledict uses remaining`);
    return false;
  }

  return true;
}

/**
 * Determine if the current user should be prompted for this Blood Hunter
 * @param {Actor} bloodHunter - The Blood Hunter actor
 * @returns {boolean} True if should prompt
 */
function shouldPromptUser(bloodHunter) {
  console.log(`${MODULE_ID} | Checking ownership: bloodHunter.isOwner=${bloodHunter.isOwner}, game.user.isGM=${game.user.isGM}`);

  // Determine if we should prompt this user
  // 1. If the Blood Hunter has a player owner and this user owns it (not GM)
  // 2. If the Blood Hunter has no player owner and this user is GM
  const hasPlayerOwner = bloodHunter.hasPlayerOwner;
  const shouldPrompt = (hasPlayerOwner && bloodHunter.isOwner && !game.user.isGM) ||
                      (!hasPlayerOwner && game.user.isGM);

  if (!shouldPrompt) {
    console.log(`${MODULE_ID} | Skipping - hasPlayerOwner: ${hasPlayerOwner}, isOwner: ${bloodHunter.isOwner}, isGM: ${game.user.isGM}`);
  }

  return shouldPrompt;
}
