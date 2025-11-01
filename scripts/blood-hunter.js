/**
 * Blood Hunter Module for Foundry VTT
 * Main module initialization
 */

import { CrimsonRite } from './crimson-rite.js';
import { BloodHunterUtils } from './utils.js';
import { BloodHunterIntegrations } from './integrations.js';
import { BloodCurse } from './blood-curse.js';
import { OrderOfTheLycan } from './order-lycan.js';

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
});

Hooks.once('ready', async function() {
  console.log(`${MODULE_NAME} | Module Ready`);

  // Initialize integrations
  BloodHunterIntegrations.init();

  // Initialize Blood Curse system
  BloodCurse.init();

  // Initialize Order of the Lycan system
  OrderOfTheLycan.init();

  // Setup DAE special durations
  BloodHunterIntegrations.setupDAEDurations();

  // Create macro compendium if needed
  await createMacros();
});

// Hook into combat turn changes to reset Blood Curse uses
Hooks.on('combatTurn', async (combat, updateData, options) => {
  await BloodCurse.resetCurseUses(combat, updateData);
});

// Hook into damage rolls to add Crimson Rite damage
// Only use this hook if midi-qol is NOT active (midi-qol has its own hooks)
Hooks.on('dnd5e.preRollDamage', async (item, rollConfig) => {
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

  // Add Blood Hunter specific UI elements
  addBloodHunterUI(html, actor);
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
  const macroName = "Crimson Rite";
  const existingMacro = game.macros.find(m => m.name === macroName);

  if (!existingMacro) {
    await Macro.create({
      name: macroName,
      type: "script",
      img: "icons/magic/fire/flame-burning-hand-purple.webp",
      command: `game.bloodhunter.CrimsonRite.activateDialog();`,
      flags: { "vtt-blood-hunter": { macro: true } }
    });
  }

  // Create Hybrid Transformation macro
  const lycanMacroName = "Hybrid Transformation";
  const existingLycanMacro = game.macros.find(m => m.name === lycanMacroName);

  if (!existingLycanMacro) {
    await Macro.create({
      name: lycanMacroName,
      type: "script",
      img: "icons/creatures/mammals/wolf-howl-moon-white.webp",
      command: `game.bloodhunter.OrderOfTheLycan.transformationDialog();`,
      flags: { "vtt-blood-hunter": { macro: true } }
    });
  }
}

function addBloodHunterUI(html, actor) {
  // Find the header actions area
  const headerActions = html.find('.sheet-header .header-actions');
  if (headerActions.length === 0) return;

  // Add Crimson Rite button
  const riteButton = $(`
    <div class="bloodhunter-rite-button" title="${game.i18n.localize('BLOODHUNTER.CrimsonRite.Title')}">
      <i class="fas fa-fire-alt"></i>
      <span>${game.i18n.localize('BLOODHUNTER.CrimsonRite.Title')}</span>
    </div>
  `);

  riteButton.on('click', () => {
    CrimsonRite.activateDialog(actor);
  });

  headerActions.append(riteButton);

  // Add Lycan Transformation button if Order of the Lycan
  OrderOfTheLycan.addLycanButtonToSheet(html, actor);
}

export { MODULE_ID, MODULE_NAME };
