/**
 * Blood Hunter Module for Foundry VTT
 * Main module initialization
 */

import { CrimsonRite } from './crimson-rite/index.js';
import { BloodHunterUtils } from './utils.js';
import { BloodHunterIntegrations } from './integrations.js';
import { BloodCurse } from './blood-curse/index.js';
import { OrderOfTheLycan } from './order-lycan.js';
import { ActorSheetButton } from './actor-sheet-button.js';
import { FeatureSync } from './feature-sync.js';
import { initSocket } from './blood-curse/socket-handler.js';

// Module constants
const MODULE_ID = 'vtt-blood-hunter';
const MODULE_NAME = 'Blood Hunter';

// Track actors that have already triggered Fallen Puppet to avoid duplicate prompts
const fallenPuppetTriggered = new Set();

Hooks.once('init', async function() {
  console.log(`${MODULE_NAME} | Initializing Blood Hunter Module`);

  // Register module settings
  registerSettings();

  // Initialize classes
  game.bloodhunter = {
    CrimsonRite,
    BloodCurse,
    OrderOfTheLycan,
    FeatureSync,
    utils: BloodHunterUtils,
    integrations: BloodHunterIntegrations,
    MODULE_ID
  };

  // Register Handlebars helpers
  registerHandlebarsHelpers();

  // Register custom damage types
  BloodHunterIntegrations.registerCustomDamageTypes();

  // Register Blood Hunter feature category
  if (CONFIG.DND5E?.featureTypes?.class?.subtypes) {
    CONFIG.DND5E.featureTypes.class.subtypes.bloodHunter = 'BLOODHUNTER.FeatureCategory';
  }
});

Hooks.once('ready', async function() {
  console.log(`${MODULE_NAME} | Module Ready`);

  // Initialize socket handlers
  initSocket();

  // Initialize integrations
  BloodHunterIntegrations.init();

  // Initialize Blood Curse system
  BloodCurse.init();

  // Initialize Order of the Lycan system
  OrderOfTheLycan.init();

  // Register actor sheet buttons
  registerActorSheetButtons();
});

// Hook into combat turn changes - no longer needed for Blood Curse uses
// Blood Maledict charges are now tracked directly on the feature
// Keeping the hook for potential future use
Hooks.on('combatTurn', async(combat, updateData, options) => {
  // No longer needed - keeping for backward compatibility
});

// Detect when creatures drop to 0 HP (for Fallen Puppet curse)
Hooks.on('updateActor', async(actor, change, options, userId) => {
  // Check if HP changed to 0 or below
  if (change.system?.attributes?.hp?.value !== undefined) {
    const newHP = change.system.attributes.hp.value;

    // Creature is at 0 HP or below
    if (newHP <= 0) {
      // Check if we already triggered for this actor
      const triggeredKey = `${actor.id}-${newHP}`;
      if (fallenPuppetTriggered.has(triggeredKey)) {
        return; // Already handled this drop to 0
      }

      // Mark as triggered
      fallenPuppetTriggered.add(triggeredKey);

      // Clean up after 1 second to allow re-triggering if HP changes again
      setTimeout(() => fallenPuppetTriggered.delete(triggeredKey), 1000);

      console.log(`${MODULE_ID} | Creature ${actor.name} at ${newHP} HP, checking for Blood Hunters with Fallen Puppet`);

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
        const fallenToken = canvas.tokens?.placeables.find(t => t.actor?.id === actor.id);

        // Check if fallen creature is within 30 feet
        if (fallenToken && bhToken) {
          const distance = canvas.grid?.measureDistance(bhToken, fallenToken);
          console.log(`${MODULE_ID} | Distance from ${bloodHunter.name} to ${actor.name}: ${distance} feet`);

          if (distance <= 30) {
            // Check if Blood Hunter has Blood Maledict uses remaining
            const maledictFeature = BloodCurse.getBloodMaledictFeature(bloodHunter);
            if (!maledictFeature) {
              console.warn(`${MODULE_ID} | ${bloodHunter.name} has no Blood Maledict feature`);
              continue;
            }

            const uses = maledictFeature.system.uses;
            if (!uses || !uses.max) {
              console.log(`${MODULE_ID} | ${bloodHunter.name} has no Blood Maledict uses configured`);
              continue;
            }

            // Check remaining uses (dnd5e v4)
            const remaining = uses.value || 0;
            console.log(`${MODULE_ID} | ${bloodHunter.name} Blood Maledict: ${remaining}/${uses.max} remaining`);

            if (remaining <= 0) {
              console.log(`${MODULE_ID} | ${bloodHunter.name} has no Blood Maledict uses remaining`);
              continue;
            }

            // Check ownership
            console.log(`${MODULE_ID} | Checking ownership: bloodHunter.isOwner=${bloodHunter.isOwner}, game.user.isGM=${game.user.isGM}`);

            // Determine if we should prompt this user
            // 1. If the Blood Hunter has a player owner and this user owns it (not GM)
            // 2. If the Blood Hunter has no player owner and this user is GM
            const hasPlayerOwner = bloodHunter.hasPlayerOwner;
            const shouldPrompt = (hasPlayerOwner && bloodHunter.isOwner && !game.user.isGM) ||
                                (!hasPlayerOwner && game.user.isGM);

            if (shouldPrompt) {
              console.log(`${MODULE_ID} | Prompting ${game.user.name} to use Fallen Puppet`);
              // Prompt the Blood Hunter to use Fallen Puppet
              await BloodCurse.promptFallenPuppet(bloodHunter, actor, fallenToken);
            } else {
              console.log(`${MODULE_ID} | Skipping prompt - user ${game.user.name} should not be prompted (hasPlayerOwner: ${hasPlayerOwner}, isOwner: ${bloodHunter.isOwner}, isGM: ${game.user.isGM})`);
            }
          }
        }
      }
    }
  }
});

// Hook into rest completion to remove Crimson Rites
// Only use this hook if DAE is NOT active (DAE handles duration via special durations)
Hooks.on('dnd5e.restCompleted', async(actor, result) => {
  // If DAE is active, it handles rest durations automatically
  if (BloodHunterIntegrations.isDAEActive()) return;

  if (!BloodHunterUtils.isBloodHunter(actor)) return;

  // Remove all active Crimson Rites
  const ritesRemoved = await CrimsonRite.removeAllActiveRites(actor);

  if (ritesRemoved > 0) {
    const restType = result.longRest ? 'BLOODHUNTER.CrimsonRite.LongRest' : 'BLOODHUNTER.CrimsonRite.ShortRest';
    ui.notifications.info(
      game.i18n.format('BLOODHUNTER.CrimsonRite.RitesEndedOnRest', {
        count: ritesRemoved,
        restType: game.i18n.localize(restType)
      })
    );
  }
});

// Hook into damage rolls to add Crimson Rite damage
// Only use this hook if DAE is NOT active (DAE handles damage via active effects)
// AND midi-qol is NOT active (midi-qol has its own hooks)
Hooks.on('dnd5e.preRollDamage', async(item, rollConfig) => {
  // If DAE is active, it handles the damage bonus via active effects
  if (BloodHunterIntegrations.isDAEActive()) return;

  // If midi-qol is active, skip this hook (it handles damage in its own workflow)
  if (BloodHunterIntegrations.isMidiQOLActive()) return;

  if (!item.actor) return;

  // Check if this weapon has an active Crimson Rite
  const activeRite = CrimsonRite.getActiveRite(item);
  if (activeRite) {
    // Add rite damage to the roll
    const riteData = activeRite.flags[MODULE_ID];
    const riteDamage = riteData.riteDamage;
    const damageType = riteData.damageType;

    if (rollConfig.parts) {
      rollConfig.parts.push(`${riteDamage}[${damageType}]`);
    }
  }
});

// Hook into activity usage to handle Blood Hunter feature activations
// This allows features from the compendium to trigger custom dialogs and behaviors
Hooks.on('dnd5e.preUseActivity', async(activity, usageConfig, dialogConfig, messageConfig) => {
  const item = activity?.item;
  if (!item) return;

  // Get all Blood Hunter flags from the item
  const bhFlags = item.flags?.[MODULE_ID] || {};

  // Map of feature flags to their handler functions
  const featureHandlers = {
    crimsonRiteActivation: async() => {
      await CrimsonRite.activateDialog();
      return false; // Prevent default item usage
    },
    hybridTransformation: async() => {
      // TODO: Call OrderOfTheLycan.transformationDialog() in a future update
      // For now, just infrastructure is in place
      return false; // Prevent default item usage
    }
  };

  // Check each flag and call its handler if found
  for (const [flagKey, handler] of Object.entries(featureHandlers)) {
    if (bhFlags[flagKey]) {
      return await handler();
    }
  }
});

// Hook into actor sheet header buttons (ApplicationV1 compatibility)
Hooks.on('renderApplicationV1', (app, buttons, data) => {
  if (app.document?.type !== 'character') return;
  ActorSheetButton.addHeaderButtons(app, buttons, data);
});

// Hook into actor sheet rendering (ApplicationV2 compatibility)
Hooks.on('renderApplicationV2', (app, html, data) => {
  if (app.document?.type !== 'character') return;
  // Inject buttons for ApplicationV2 sheets
  ActorSheetButton.injectHeaderButtonsV2(app, html, data);
});

function registerSettings() {
  game.settings.register(MODULE_ID, 'autoCalculateHP', {
    name: game.i18n.localize('BLOODHUNTER.Settings.AutoCalculateHP.Name'),
    hint: game.i18n.localize('BLOODHUNTER.Settings.AutoCalculateHP.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, 'showRiteButtons', {
    name: game.i18n.localize('BLOODHUNTER.Settings.ShowRiteButtons.Name'),
    hint: game.i18n.localize('BLOODHUNTER.Settings.ShowRiteButtons.Hint'),
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });

  game.settings.register(MODULE_ID, 'riteDetectionMode', {
    name: game.i18n.localize('BLOODHUNTER.Settings.RiteDetectionMode.Name'),
    hint: game.i18n.localize('BLOODHUNTER.Settings.RiteDetectionMode.Hint'),
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'auto': game.i18n.localize('BLOODHUNTER.Settings.RiteDetectionMode.Auto'),
      'features': game.i18n.localize('BLOODHUNTER.Settings.RiteDetectionMode.Features'),
      'level': game.i18n.localize('BLOODHUNTER.Settings.RiteDetectionMode.Level')
    },
    default: 'auto'
  });

  game.settings.register(MODULE_ID, 'curseDetectionMode', {
    name: game.i18n.localize('BLOODHUNTER.Settings.CurseDetectionMode.Name'),
    hint: game.i18n.localize('BLOODHUNTER.Settings.CurseDetectionMode.Hint'),
    scope: 'world',
    config: true,
    type: String,
    choices: {
      'auto': game.i18n.localize('BLOODHUNTER.Settings.CurseDetectionMode.Auto'),
      'features': game.i18n.localize('BLOODHUNTER.Settings.CurseDetectionMode.Features'),
      'level': game.i18n.localize('BLOODHUNTER.Settings.CurseDetectionMode.Level')
    },
    default: 'auto'
  });
}

function registerHandlebarsHelpers() {
  Handlebars.registerHelper('bloodhunter-localize', function(key) {
    return game.i18n.localize(key);
  });
}

function registerActorSheetButtons() {
  // Register Update Features button
  ActorSheetButton.registerButton({
    id: 'bloodhunter-update-features',
    icon: 'fa-sync',
    label: 'BLOODHUNTER.UpdateFeatures.Title',
    tooltip: 'BLOODHUNTER.UpdateFeatures.Tooltip',
    onClick: async(actor) => {
      await FeatureSync.syncFeatures(actor);
    },
    isVisible: (actor) => BloodHunterUtils.isBloodHunter(actor)
  });
}

export { MODULE_ID, MODULE_NAME };
