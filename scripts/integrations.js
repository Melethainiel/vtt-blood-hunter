/**
 * Integration with DAE and midi-qol for Blood Hunter
 */

import { MODULE_ID } from './blood-hunter.js';

export class BloodHunterIntegrations {

  /**
   * Check if DAE (Dynamic Active Effects) is installed and active
   * @returns {boolean} True if DAE is available
   */
  static isDAEActive() {
    return game.modules.get('dae')?.active || false;
  }

  /**
   * Check if midi-qol is installed and active
   * @returns {boolean} True if midi-qol is available
   */
  static isMidiQOLActive() {
    return game.modules.get('midi-qol')?.active || false;
  }

  /**
   * Check if Advanced Macros is installed and active
   * @returns {boolean} True if Advanced Macros is available
   */
  static isAdvancedMacrosActive() {
    return game.modules.get('advanced-macros')?.active || false;
  }

  /**
   * Initialize integrations
   */
  static init() {
    console.log(`${MODULE_ID} | Checking integrations...`);

    if (this.isDAEActive()) {
      console.log(`${MODULE_ID} | DAE detected - Enhanced active effects enabled`);
    }

    if (this.isMidiQOLActive()) {
      console.log(`${MODULE_ID} | midi-qol detected - Enhanced combat automation enabled`);
      this.setupMidiQOLIntegration();
    }

    if (this.isAdvancedMacrosActive()) {
      console.log(`${MODULE_ID} | Advanced Macros detected - Item macro support enabled`);
    }
  }

  /**
   * Setup midi-qol integration hooks
   */
  static setupMidiQOLIntegration() {
    // Only hook into damage if DAE is NOT active
    // DAE handles damage bonuses via active effects on the weapon
    if (!this.isDAEActive()) {
      Hooks.on('midi-qol.DamageRollComplete', async(workflow) => {
        await this.addCrimsonRiteDamage(workflow);
      });
    }

    // Hook for Blood Curse reactions
    Hooks.on('midi-qol.AttackRollComplete', async(workflow) => {
      await this.checkBloodCurseReaction(workflow);
    });

    // Hook for applying amplified curses
    Hooks.on('midi-qol.RollComplete', async(workflow) => {
      await this.processBloodCurseEffects(workflow);
    });
  }

  /**
   * Add Crimson Rite damage to midi-qol workflow
   * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
   */
  static async addCrimsonRiteDamage(workflow) {
    const item = workflow.item;
    if (!item || item.type !== 'weapon') return;

    // Check for active Crimson Rite
    const activeRite = item.effects.find(e => e.flags[MODULE_ID]?.crimsonRite);
    if (!activeRite) return;

    const riteData = activeRite.flags[MODULE_ID];
    const riteDamage = riteData.riteDamage;
    const damageType = riteData.damageType;

    // Add bonus damage to workflow
    if (workflow.damageRoll) {
      const bonusRoll = await new Roll(riteDamage).evaluate();

      // Add to damage detail
      workflow.damageDetail.push({
        damage: bonusRoll.total,
        type: damageType,
        source: 'Crimson Rite'
      });

      // Create chat message for the bonus damage
      await bonusRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: workflow.actor }),
        flavor: `${game.i18n.localize('BLOODHUNTER.CrimsonRite.Title')} - ${game.i18n.localize('BLOODHUNTER.CrimsonRite.DamageTypes.' + damageType)}`
      });
    }
  }

  /**
   * Check for Blood Curse reactions during attack rolls
   * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
   */
  static async checkBloodCurseReaction(workflow) {
    // This will be implemented when Blood Curses are added
    // For now, we prepare the structure

    const target = workflow.targets?.first();
    if (!target) return;

    // Check if target is a Blood Hunter with available Blood Curses
    const targetActor = target.actor;
    if (!targetActor) return;

    // Look for Blood Hunter class
    const bhClass = targetActor.items.find(i =>
      i.type === 'class' &&
      (i.name.toLowerCase().includes('blood hunter') || i.system?.identifier === 'bloodhunter')
    );

    if (!bhClass) return;

    // Check for available Blood Curse reactions
    const bloodCurses = targetActor.items.filter(i =>
      i.type === 'feat' &&
      i.flags[MODULE_ID]?.bloodCurse &&
      i.flags[MODULE_ID]?.curseType === 'reaction'
    );

    if (bloodCurses.length > 0) {
      // Prompt for Blood Curse reaction
      // This will be fully implemented in the Blood Curse module
      console.log(`${MODULE_ID} | Blood Curse reaction available`);
    }
  }

  /**
   * Process Blood Curse effects
   * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
   */
  static async processBloodCurseEffects(workflow) {
    // Placeholder for Blood Curse effect processing
    // Will be implemented with Blood Curses
  }

  /**
   * Create DAE-compatible effect data for Crimson Rite
   * @param {string} riteType - The rite type
   * @param {string} damageType - The damage type
   * @param {string} riteDamage - The damage dice
   * @param {string} weaponId - The weapon ID
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {Object} Effect data
   */
  static createCrimsonRiteEffect(riteType, damageType, riteDamage, weaponId, actor) {
    const effectData = {
      name: `${game.i18n.localize('BLOODHUNTER.CrimsonRite.Title')} - ${game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + riteType)}`,
      icon: this.getRiteIcon(riteType),
      origin: actor.uuid,
      duration: {
        seconds: null // Lasts until dismissed or rest
      },
      flags: {
        [MODULE_ID]: {
          crimsonRite: true,
          riteType: riteType,
          damageType: damageType,
          riteDamage: riteDamage,
          weaponId: weaponId
        }
      },
      changes: []
    };

    // If DAE is active, add damage bonus changes and special duration
    if (this.isDAEActive()) {
      // DAE will handle the damage bonus automatically
      // This adds the bonus to the weapon's damage formula
      effectData.changes.push({
        key: 'system.damage.parts',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: JSON.stringify([riteDamage, damageType]),
        priority: 20
      });

      // Add DAE special duration for rest removal
      // DAE expects flags.dae.specialDuration for its special duration system
      effectData.flags.dae = {
        specialDuration: ['shortRest', 'longRest']
      };
    }

    // Add transfer flag so effect appears on actor when weapon is equipped
    effectData.transfer = true;

    return effectData;
  }

  /**
   * Create item macro for midi-qol OnUse
   * @param {string} macroType - Type of macro (crimsonRite, bloodCurse, etc.)
   * @param {Object} data - Macro data
   * @returns {string} Macro code
   */
  static createItemMacro(macroType, data = {}) {
    switch (macroType) {
      case 'crimsonRite':
        return this.createCrimsonRiteMacro(data);
      case 'bloodCurse':
        return this.createBloodCurseMacro(data);
      default:
        return '';
    }
  }

  /**
   * Create Crimson Rite activation macro
   * @param {Object} data - Macro data
   * @returns {string} Macro code
   */
  static createCrimsonRiteMacro(data) {
    return `
// Crimson Rite Activation Macro
(async () => {
  const actor = game.actors.get("${data.actorId}");
  const item = actor.items.get("${data.itemId}");

  if (!actor || !item) {
    ui.notifications.error("Actor or item not found");
    return;
  }

  // Call the Crimson Rite dialog
  game.bloodhunter.CrimsonRite.activateDialog(actor);
})();
    `.trim();
  }

  /**
   * Create Blood Curse macro
   * @param {Object} data - Macro data
   * @returns {string} Macro code
   */
  static createBloodCurseMacro(data) {
    return `
// Blood Curse Macro
(async () => {
  const actor = game.actors.get("${data.actorId}");
  const curse = actor.items.get("${data.curseId}");

  if (!actor || !curse) {
    ui.notifications.error("Actor or curse not found");
    return;
  }

  // Execute the Blood Curse
  game.bloodhunter.BloodCurse.execute(actor, curse);
})();
    `.trim();
  }

  /**
   * Get rite icon
   * @param {string} riteType - The rite type
   * @returns {string} Icon path
   */
  static getRiteIcon(riteType) {
    const icons = {
      flame: 'icons/magic/fire/flame-burning-hand-purple.webp',
      frozen: 'icons/magic/water/ice-snowflake-white.webp',
      storm: 'icons/magic/lightning/bolt-strike-blue.webp',
      corrosion: 'icons/magic/acid/dissolve-bone-white.webp',
      toxin: 'icons/magic/death/skull-poison-green.webp',
      dead: 'icons/magic/death/skull-shadow-black.webp',
      oracle: 'icons/magic/perception/eye-tendrils-purple.webp',
      dawn: 'icons/magic/holy/angel-winged-humanoid-blue.webp',
      roar: 'icons/magic/sonic/explosion-shock-sound-wave.webp'
    };

    return icons[riteType] || 'icons/magic/fire/flame-burning-hand-purple.webp';
  }

  /**
   * Create a midi-qol compatible item with OnUse macro
   * @param {Object} itemData - Base item data
   * @param {string} macroCode - Macro code to execute
   * @returns {Object} Enhanced item data
   */
  static enhanceItemForMidiQOL(itemData, macroCode) {
    if (!this.isMidiQOLActive()) return itemData;

    // Add midi-qol flags
    itemData.flags = itemData.flags || {};
    itemData.flags['midi-qol'] = {
      onUseMacroName: macroCode,
      effectActivation: true
    };

    return itemData;
  }

  /**
   * Register custom damage types if needed
   */
  static registerCustomDamageTypes() {
    // Ensure all Blood Hunter damage types are recognized
    // This is mostly for future custom damage types
    const customTypes = {
      'hemocraft': {
        label: 'Hemocraft',
        color: '#8b0000'
      }
    };

    // Register with CONFIG if needed
    for (const [key, value] of Object.entries(customTypes)) {
      if (!CONFIG.DND5E.damageTypes[key]) {
        CONFIG.DND5E.damageTypes[key] = value.label;
      }
    }
  }


}
