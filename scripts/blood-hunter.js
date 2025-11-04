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

  // Initialize compendiums with default content
  await initializeCompendiums();
});

// Hook into combat turn changes to reset Blood Curse uses
Hooks.on('combatTurn', async(combat, updateData, options) => {
  await BloodCurse.resetCurseUses(combat, updateData);
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
  const lycanMacroName = 'Hybrid Transformation';
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

async function initializeCompendiums() {
  // Get the Blood Hunter Features compendium
  const pack = game.packs.get('vtt-blood-hunter.blood-hunter-features');
  if (!pack) {
    console.warn(`${MODULE_NAME} | Blood Hunter Features compendium not found`);
    return;
  }

  // Check if Crimson Rite feature already exists
  const index = await pack.getIndex();
  const existingFeature = index.find(i => i.name === 'Crimson Rite');

  if (existingFeature) {
    // Feature already exists, skip creation
    return;
  }

  // Only GMs can create compendium content
  if (!game.user.isGM) return;

  console.log(`${MODULE_NAME} | Creating Crimson Rite feature in compendium...`);

  // Create the Crimson Rite feature
  const featureData = {
    name: 'Crimson Rite',
    type: 'feat',
    img: 'icons/magic/fire/flame-burning-skull-orange.webp',
    system: {
      description: {
        value: `<h2>Crimson Rite</h2>
<p>As a bonus action, you can activate a Crimson Rite on a single weapon. The rite lasts until you finish a short or long rest.</p>
<p>When you activate a Crimson Rite, you take damage equal to one roll of your hemocraft die. While active, attacks with this weapon deal an extra 1d4 damage of the rite's damage type.</p>
<p><strong>Click this feature to activate a Crimson Rite on one of your weapons.</strong></p>`,
        chat: '',
        unidentified: ''
      },
      source: {
        custom: 'Blood Hunter'
      },
      activation: {
        type: 'bonus',
        cost: 1
      },
      type: {
        value: 'class',
        subtype: ''
      },
      requirements: 'Blood Hunter 2',
      uses: {
        value: null,
        max: '',
        per: null,
        recovery: ''
      }
    },
    flags: {
      'vtt-blood-hunter': {
        crimsonRiteActivation: true
      }
    }
  };

  try {
    // Create the item in the compendium
    await pack.getDocument(await Item.create(featureData, { pack: pack.collection }));
    console.log(`${MODULE_NAME} | Crimson Rite feature created successfully`);
  } catch (error) {
    console.error(`${MODULE_NAME} | Error creating Crimson Rite feature:`, error);
  }
}

function addBloodHunterUI(html, actor) {
  // Find the header actions area
  // dnd5e v3 uses .sheet-header-buttons, v2 uses .header-actions
  let headerActions = html.find('.sheet-header .sheet-header-buttons');
  if (headerActions.length === 0) {
    // Fallback to v2 selector for backward compatibility
    headerActions = html.find('.sheet-header .header-actions');
  }
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
