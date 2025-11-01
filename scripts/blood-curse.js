/**
 * Blood Curse functionality for Blood Hunter
 * Framework for implementing all Blood Curses with midi-qol integration
 */

import { BloodHunterUtils } from './utils.js';
import { BloodHunterIntegrations } from './integrations.js';
import { MODULE_ID } from './blood-hunter.js';

export class BloodCurse {

  // Blood Curse types and their properties
  static CURSE_TYPES = {
    binding: {
      name: 'Blood Curse of Binding',
      level: 1,
      timing: 'reaction',
      trigger: 'creature within 30 feet moves',
      amplified: 'Also apply Strength save or restrained',
      usesHemocraft: true
    },
    marked: {
      name: 'Blood Curse of the Marked',
      level: 1,
      timing: 'bonus',
      trigger: 'before attack roll',
      amplified: 'Additional hemocraft die',
      usesHemocraft: true
    },
    anxious: {
      name: 'Blood Curse of the Anxious',
      level: 1,
      timing: 'reaction',
      trigger: 'creature makes ability check',
      amplified: 'Disadvantage on next saving throw',
      usesHemocraft: false
    },
    eyeless: {
      name: 'Blood Curse of the Eyeless',
      level: 6,
      timing: 'reaction',
      trigger: 'creature attacks with advantage',
      amplified: 'Creature attacks with disadvantage',
      usesHemocraft: false
    },
    fallen_puppet: {
      name: 'Blood Curse of the Fallen Puppet',
      level: 6,
      timing: 'reaction',
      trigger: 'creature within 30 feet dies',
      amplified: 'Creature makes weapon attack',
      usesHemocraft: false
    },
    bloated_agony: {
      name: 'Blood Curse of Bloated Agony',
      level: 10,
      timing: 'bonus',
      trigger: 'at will',
      amplified: 'Constitution save or stunned',
      usesHemocraft: true
    },
    corrosion: {
      name: 'Blood Curse of Corrosion',
      level: 14,
      timing: 'reaction',
      trigger: 'creature casts a spell',
      amplified: 'Also deal psychic damage',
      usesHemocraft: true
    },
    exorcism: {
      name: 'Blood Curse of the Exorcism',
      level: 18,
      timing: 'bonus',
      trigger: 'fiend, fey, or undead',
      amplified: 'Banishment effect',
      usesHemocraft: true
    }
  };

  /**
   * Detect known curses from actor's features/items
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {Array} Array of known curse keys
   */
  static getKnownCursesFromFeatures(actor) {
    const knownCurses = [];

    // Search through actor's features for Blood Curse items
    const features = actor.items.filter(i => i.type === 'feat' || i.type === 'feature');

    for (const feature of features) {
      const name = feature.name.toLowerCase();
      const description = feature.system?.description?.value?.toLowerCase() || '';

      // Check for each curse type
      for (const [key, value] of Object.entries(this.CURSE_TYPES)) {
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
   * Initialize Blood Curse system
   */
  static init() {
    console.log(`${MODULE_ID} | Blood Curse system initialized`);

    // Register midi-qol hooks for reactions
    if (BloodHunterIntegrations.isMidiQOLActive()) {
      this.registerMidiQOLHooks();
    }
  }

  /**
   * Register midi-qol hooks for Blood Curse reactions
   */
  static registerMidiQOLHooks() {
    // Hook for reaction-based curses
    Hooks.on('midi-qol.preAttackRoll', async (workflow) => {
      await this.checkReactionCurses(workflow, 'preAttack');
    });

    Hooks.on('midi-qol.preCheckHits', async (workflow) => {
      await this.checkReactionCurses(workflow, 'preHit');
    });

    Hooks.on('midi-qol.preDamageRoll', async (workflow) => {
      await this.checkReactionCurses(workflow, 'preDamage');
    });
  }

  /**
   * Check if reaction curses should be prompted
   * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
   * @param {string} timing - The timing of the check
   */
  static async checkReactionCurses(workflow, timing) {
    // Get all Blood Hunters in the scene
    const bloodHunters = canvas.tokens.placeables.filter(t =>
      t.actor && BloodHunterUtils.isBloodHunter(t.actor)
    );

    for (const token of bloodHunters) {
      const actor = token.actor;

      // Get available Blood Curses
      const curses = this.getAvailableCurses(actor, timing);

      if (curses.length > 0 && this.shouldPromptReaction(workflow, timing)) {
        await this.promptBloodCurse(actor, curses, workflow);
      }
    }
  }

  /**
   * Get available Blood Curses for an actor
   * @param {Actor} actor - The Blood Hunter actor
   * @param {string} timing - The timing filter
   * @returns {Array} Available curses
   */
  static getAvailableCurses(actor, timing = null) {
    const bloodHunterLevel = BloodHunterUtils.getBloodHunterLevel(actor);
    const detectionMode = game.settings.get(MODULE_ID, 'curseDetectionMode') || 'auto';

    let knownCurses = [];

    // Detect curses based on mode
    if (detectionMode === 'features' || detectionMode === 'auto') {
      knownCurses = this.getKnownCursesFromFeatures(actor);
    }

    // Fallback to level-based if auto mode and no features found
    if (detectionMode === 'auto' && knownCurses.length === 0) {
      knownCurses = this.getKnownCursesByLevel(bloodHunterLevel);
    } else if (detectionMode === 'level') {
      knownCurses = this.getKnownCursesByLevel(bloodHunterLevel);
    }

    // Filter actor's items to only those curses that are known
    return actor.items.filter(i =>
      i.type === 'feat' &&
      i.flags[MODULE_ID]?.bloodCurse &&
      (!timing || i.flags[MODULE_ID]?.timing === timing) &&
      knownCurses.includes(i.flags[MODULE_ID]?.curseType) &&
      bloodHunterLevel >= (i.flags[MODULE_ID]?.minLevel || 1) &&
      this.hasUsesRemaining(actor, i)
    );
  }

  /**
   * Get known curses by Blood Hunter level
   * @param {number} level - Blood Hunter level
   * @returns {Array} Array of curse keys available at this level
   */
  static getKnownCursesByLevel(level) {
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
   * Check if actor has uses remaining for Blood Curses
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Item} curse - The curse item
   * @returns {boolean} True if uses remain
   */
  static hasUsesRemaining(actor, curse) {
    // Blood Curses can be used once per turn as a reaction/bonus action
    // Track uses via a resource or flag
    const usedThisTurn = curse.flags[MODULE_ID]?.usedThisTurn || false;
    return !usedThisTurn;
  }

  /**
   * Check if reaction should be prompted
   * @param {MidiQOL.Workflow} workflow - The workflow
   * @param {string} timing - The timing
   * @returns {boolean} True if should prompt
   */
  static shouldPromptReaction(workflow, timing) {
    // Check distance, conditions, etc.
    // For now, always return true if in combat
    return game.combat?.started || false;
  }

  /**
   * Prompt player to use a Blood Curse
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Array} curses - Available curses
   * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
   */
  static async promptBloodCurse(actor, curses, workflow) {
    // Build curse options
    let curseOptions = '';
    for (const curse of curses) {
      curseOptions += `<option value="${curse.id}">${curse.name}</option>`;
    }

    // Create dialog
    const content = `
      <form class="bloodhunter-curse-prompt">
        <p>Use a Blood Curse?</p>
        <div class="form-group">
          <select name="curse" id="curse-select">
            <option value="">-- Select Curse --</option>
            ${curseOptions}
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" name="amplify" id="curse-amplify" />
            Amplify (costs HP)
          </label>
        </div>
      </form>
    `;

    // Show dialog with timeout
    return new Promise((resolve) => {
      const dialog = new Dialog({
        title: 'Blood Curse Reaction',
        content: content,
        buttons: {
          use: {
            icon: '<i class="fas fa-hand-sparkles"></i>',
            label: 'Use Curse',
            callback: async (html) => {
              const curseId = html.find('[name="curse"]').val();
              const amplify = html.find('[name="amplify"]').prop('checked');

              if (curseId) {
                const curse = actor.items.get(curseId);
                await this.execute(actor, curse, workflow, amplify);
              }
              resolve(true);
            }
          },
          skip: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Skip',
            callback: () => resolve(false)
          }
        },
        default: 'skip',
        close: () => resolve(false)
      }, {
        width: 400
      });

      dialog.render(true);

      // Auto-close after 10 seconds
      setTimeout(() => {
        dialog.close();
      }, 10000);
    });
  }

  /**
   * Execute a Blood Curse
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Item} curse - The curse item
   * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
   * @param {boolean} amplify - Whether to amplify
   */
  static async execute(actor, curse, workflow, amplify = false) {
    const curseType = curse.flags[MODULE_ID]?.curseType;

    // Calculate HP cost if amplified
    if (amplify) {
      const hpCost = this.calculateAmplificationCost(actor);
      const currentHP = actor.system.attributes.hp.value;

      if (currentHP <= hpCost) {
        ui.notifications.warn('Insufficient HP to amplify Blood Curse');
        return;
      }

      await actor.update({
        'system.attributes.hp.value': currentHP - hpCost
      });

      ui.notifications.info(`Paid ${hpCost} HP to amplify Blood Curse`);
    }

    // Execute curse based on type
    await this.executeCurseEffect(actor, curse, workflow, amplify);

    // Mark curse as used this turn
    await curse.setFlag(MODULE_ID, 'usedThisTurn', true);

    // Create chat message
    await this.createCurseChatMessage(actor, curse, amplify);
  }

  /**
   * Calculate HP cost for amplification
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {number} HP cost
   */
  static calculateAmplificationCost(actor) {
    const bloodHunterLevel = BloodHunterUtils.getBloodHunterLevel(actor);

    if (bloodHunterLevel < 5) return 1;
    if (bloodHunterLevel < 11) return 2;
    if (bloodHunterLevel < 17) return 3;
    return 4;
  }

  /**
   * Execute the actual curse effect
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Item} curse - The curse item
   * @param {MidiQOL.Workflow} workflow - The midi-qol workflow
   * @param {boolean} amplify - Whether amplified
   */
  static async executeCurseEffect(actor, curse, workflow, amplify) {
    const curseType = curse.flags[MODULE_ID]?.curseType;

    // This is where specific curse logic would go
    // For now, we create a framework that can be extended

    switch (curseType) {
      case 'marked':
        await this.executeCurseOfTheMarked(actor, workflow, amplify);
        break;
      case 'binding':
        await this.executeCurseOfBinding(actor, workflow, amplify);
        break;
      case 'anxious':
        await this.executeCurseOfTheAnxious(actor, workflow, amplify);
        break;
      // Add more curse types as needed
      default:
        console.warn(`${MODULE_ID} | Unknown curse type: ${curseType}`);
    }
  }

  /**
   * Execute Blood Curse of the Marked
   * @param {Actor} actor - The Blood Hunter actor
   * @param {MidiQOL.Workflow} workflow - The workflow
   * @param {boolean} amplify - Whether amplified
   */
  static async executeCurseOfTheMarked(actor, workflow, amplify) {
    const hemocraftDie = BloodHunterUtils.getHemocraftDie(actor);
    const bonusDice = amplify ? '2' : '1';
    const bonusRoll = await new Roll(`${bonusDice}${hemocraftDie.substring(1)}`).evaluate();

    if (workflow.damageRoll) {
      // Add bonus damage
      workflow.damageRoll._total += bonusRoll.total;

      await bonusRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: actor }),
        flavor: `Blood Curse of the Marked${amplify ? ' (Amplified)' : ''}`
      });
    }
  }

  /**
   * Execute Blood Curse of Binding
   * @param {Actor} actor - The Blood Hunter actor
   * @param {MidiQOL.Workflow} workflow - The workflow
   * @param {boolean} amplify - Whether amplified
   */
  static async executeCurseOfBinding(actor, workflow, amplify) {
    const target = workflow.targets?.first();
    if (!target) return;

    // Reduce movement to 0
    const effectData = {
      name: 'Blood Curse of Binding',
      icon: 'icons/magic/blood/strike-body-explode-red.webp',
      duration: {
        turns: 1
      },
      changes: [
        {
          key: 'system.attributes.movement.all',
          mode: CONST.ACTIVE_EFFECT_MODES.CUSTOM,
          value: '0',
          priority: 99
        }
      ],
      flags: {
        [MODULE_ID]: {
          bloodCurse: true,
          curseType: 'binding',
          amplified: amplify
        }
      }
    };

    if (amplify) {
      // Add restrained condition requirement (Strength save)
      const dc = 8 + actor.system.attributes.prof + Math.max(
        BloodHunterUtils.getModifier(actor.system.abilities.int.value),
        BloodHunterUtils.getModifier(actor.system.abilities.wis.value)
      );

      ui.notifications.info(`Target must make DC ${dc} Strength save or be restrained`);
    }

    await target.actor.createEmbeddedDocuments('ActiveEffect', [effectData]);
  }

  /**
   * Execute Blood Curse of the Anxious
   * @param {Actor} actor - The Blood Hunter actor
   * @param {MidiQOL.Workflow} workflow - The workflow
   * @param {boolean} amplify - Whether amplified
   */
  static async executeCurseOfTheAnxious(actor, workflow, amplify) {
    // Impose disadvantage on ability check
    // This would require integration with the specific ability check workflow
    ui.notifications.info('Target has disadvantage on the ability check');

    if (amplify) {
      ui.notifications.info('Target also has disadvantage on next saving throw');
    }
  }

  /**
   * Create chat message for curse usage
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Item} curse - The curse item
   * @param {boolean} amplify - Whether amplified
   */
  static async createCurseChatMessage(actor, curse, amplify) {
    const content = `
      <div class="bloodhunter-curse-message">
        <h3>${curse.name}${amplify ? ' (Amplified)' : ''}</h3>
        <p>${curse.system.description.value || ''}</p>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: content,
      flags: {
        [MODULE_ID]: {
          bloodCurse: true,
          amplified: amplify
        }
      }
    });
  }

  /**
   * Reset Blood Curse uses at start of turn
   * @param {Combat} combat - The combat instance
   * @param {Object} updateData - Update data
   */
  static async resetCurseUses(combat, updateData) {
    const combatant = combat.combatant;
    if (!combatant?.actor) return;

    const actor = combatant.actor;
    if (!BloodHunterUtils.isBloodHunter(actor)) return;

    // Reset all Blood Curse uses
    const curses = actor.items.filter(i =>
      i.type === 'feat' && i.flags[MODULE_ID]?.bloodCurse
    );

    for (const curse of curses) {
      await curse.unsetFlag(MODULE_ID, 'usedThisTurn');
    }
  }
}
