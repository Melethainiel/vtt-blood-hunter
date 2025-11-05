/**
 * Blood Hunter Module for Foundry VTT
 * Main module initialization
 */

import { CrimsonRite } from './crimson-rite.js';
import { BloodHunterUtils } from './utils.js';
import { BloodHunterIntegrations } from './integrations.js';
import { BloodCurse } from './blood-curse.js';
import { OrderOfTheLycan } from './order-lycan.js';
import { ActorSheetButton } from './actor-sheet-button.js';

// Module constants
const MODULE_ID = 'vtt-blood-hunter';
const MODULE_NAME = 'Blood Hunter';

Hooks.once('init', async function() {
  console.log(`${MODULE_NAME} | Initializing Blood Hunter Module`);

  // Register module settings
  registerSettings();

  // Initialize classes
  game.bloodhunter = {
    CrimsonRite,
    BloodCurse,
    OrderOfTheLycan,
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

  // Initialize integrations
  BloodHunterIntegrations.init();

  // Initialize Blood Curse system
  BloodCurse.init();

  // Initialize Order of the Lycan system
  OrderOfTheLycan.init();

  // Create macro compendium if needed
  await createMacros();
});

// Hook into combat turn changes to reset Blood Curse uses
Hooks.on('combatTurn', async(combat, updateData, options) => {
  await BloodCurse.resetCurseUses(combat, updateData);
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

// Hook into activity usage to handle Crimson Rite feature activation
// This allows the "Crimson Rite" feature from the compendium to trigger the activation dialog
Hooks.on('dnd5e.preUseActivity', async(activity, usageConfig, dialogConfig, messageConfig) => {
  const item = activity?.item;
  if (!item) return;

  // Check if this item is flagged as a Crimson Rite activation feature
  if (item.getFlag('vtt-blood-hunter', 'crimsonRiteActivation')) {
    await CrimsonRite.activateDialog();
    return false; // Prevent default item usage
  }
});

// Hook into item sheet rendering to add Crimson Rite buttons
Hooks.on('renderItemSheet5e', (app, html, data) => {
  if (!game.settings.get(MODULE_ID, 'showRiteButtons')) return;

  const item = app.object;
  if (!item.actor || item.type !== 'weapon') return;

  // Check if actor is a Blood Hunter
  if (!BloodHunterUtils.isBloodHunter(item.actor)) return;

  CrimsonRite.addRiteButtonToSheet(html, item);
});

// Hook into character sheet rendering
Hooks.on('renderActorSheet5e', (app, html, data) => {
  const actor = app.object;
  if (!BloodHunterUtils.isBloodHunter(actor)) return;

  // Add "Update Features" button
  ActorSheetButton.addButton(app, html, {
    id: 'bloodhunter-update-features',
    icon: 'fa-sync',
    label: 'BLOODHUNTER.UpdateFeatures.Title',
    tooltip: 'BLOODHUNTER.UpdateFeatures.Tooltip',
    onClick: (actor) => {
      // Placeholder: Will implement compendium update logic later
      ui.notifications.info(
        game.i18n.format('BLOODHUNTER.UpdateFeatures.Placeholder', {
          name: actor.name
        })
      );
    },
    isVisible: (actor) => BloodHunterUtils.isBloodHunter(actor)
  });

  // Add Crimson Rite button
  ActorSheetButton.addButton(app, html, {
    id: 'bloodhunter-crimson-rite',
    icon: 'fa-fire-alt',
    label: 'BLOODHUNTER.CrimsonRite.Title',
    tooltip: 'BLOODHUNTER.CrimsonRite.Title',
    onClick: (actor) => {
      CrimsonRite.activateDialog(actor);
    },
    isVisible: (actor) => BloodHunterUtils.isBloodHunter(actor)
  });

  // Add Lycan Transformation button if Order of the Lycan
  ActorSheetButton.addButton(app, html, {
    id: 'bloodhunter-lycan-transform',
    icon: 'fa-wolf-pack-battalion',
    label: OrderOfTheLycan.isTransformed(actor) ? 'BLOODHUNTER.Lycan.Hybrid' : 'BLOODHUNTER.Lycan.Human',
    tooltip: 'BLOODHUNTER.Lycan.Transformation',
    onClick: (actor) => {
      OrderOfTheLycan.transformationDialog(actor);
    },
    isVisible: (actor) => OrderOfTheLycan.isLycan(actor),
    cssClass: OrderOfTheLycan.isTransformed(actor) ? 'active' : ''
  });
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

async function createMacros() {
  // Create Crimson Rite macro
  const macroName = 'BH: Crimson Rite';
  const existingMacro = game.macros.find(m => m.name === macroName);

  if (!existingMacro) {
    await Macro.create({
      name: macroName,
      type: 'script',
      command: 'game.bloodhunter.CrimsonRite.activateDialog();',
      flags: { 'vtt-blood-hunter': { macro: true } }
    });
  }


  // Create Hybrid Transformation macro
  const lycanMacroName = 'BH: Hybrid Transformation';
  const existingLycanMacro = game.macros.find(m => m.name === lycanMacroName);

  if (!existingLycanMacro) {
    await Macro.create({
      name: lycanMacroName,
      type: 'script',
      img: 'icons/creatures/mammals/wolf-howl-moon-white.webp',
      command: 'game.bloodhunter.OrderOfTheLycan.transformationDialog();',
      flags: { 'vtt-blood-hunter': { macro: true } }
    });
  }
}

export { MODULE_ID, MODULE_NAME };
