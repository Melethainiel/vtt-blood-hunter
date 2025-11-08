/**
 * Integration with DAE and midi-qol for Blood Hunter
 */

import { MODULE_ID } from './blood-hunter.js';
import { BloodHunterUtils } from './utils.js';

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
   * Create Crimson Rite effect data for weapon enchantment
   * Uses dnd5e v4.x enchantment system for proper damage application
   * @param {string} riteType - The rite type
   * @param {string} damageType - The damage type
   * @param {string} riteDamage - The damage dice (e.g., "1d6")
   * @param {string} weaponId - The weapon ID
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {Object} Effect data for enchantment
   */
  static createCrimsonRiteEffect(riteType, damageType, riteDamage, weaponId, actor) {
    // Parse damage dice (e.g., "1d6" -> {number: 1, denomination: 6})
    const dice = BloodHunterUtils.parseDamageDice(riteDamage);

    const effectData = {
      name: `${game.i18n.localize('BLOODHUNTER.CrimsonRite.Title')} - ${game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + riteType)}`,
      type: 'enchantment', // ⚠️ Type obligatoire pour les enchantements
      icon: BloodHunterUtils.getRiteIcon(riteType),
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
      changes: [],
      transfer: false
    };

    // Add damage to activities[attack].damage.parts using the dnd5e v4.x format
    // This works with or without DAE, as it's the native dnd5e v4.x system
    effectData.changes.push({
      key: 'activities[attack].damage.parts',
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: JSON.stringify({
        number: dice.number,
        denomination: dice.denomination,
        types: [damageType]
      }),
      priority: 20
    });

    // If DAE is active, add special duration for rest removal
    if (this.isDAEActive()) {
      effectData.flags.dae = {
        specialDuration: ['shortRest', 'longRest']
      };
    }

    return effectData;
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
