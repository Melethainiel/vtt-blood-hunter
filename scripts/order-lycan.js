/**
 * Order of the Lycan functionality for Blood Hunter
 * Hybrid Transformation, Blood Lust, and lycanthropic abilities
 */

import { BloodHunterUtils } from './utils.js';
import { BloodHunterIntegrations } from './integrations.js';
import { MODULE_ID } from './blood-hunter.js';

export class OrderOfTheLycan {

  // Transformation stages
  static TRANSFORMATION_FORMS = {
    humanoid: {
      name: 'Humanoid Form',
      level: 0,
      icon: 'icons/magic/control/silhouette-hold-change-blue.webp'
    },
    hybrid: {
      name: 'Hybrid Transformation',
      level: 3,
      icon: 'icons/creatures/mammals/wolf-howl-moon-white.webp',
      duration: 3600 // 1 hour in seconds
    }
  };

  // Hybrid form bonuses by level
  static HYBRID_BONUSES = {
    3: {
      ac: 1,
      speed: 10,
      strength: 0,
      dexterity: 0,
      damageReduction: 0,
      features: ['predatoryStrikes', 'cursedWeakness', 'bloodLust']
    },
    7: {
      ac: 1,
      speed: 15,
      strength: 1,
      dexterity: 0,
      damageReduction: 0,
      features: ['predatoryStrikes', 'cursedWeakness', 'bloodLust', 'stalkersprowess']
    },
    11: {
      ac: 2,
      speed: 15,
      strength: 1,
      dexterity: 1,
      damageReduction: 3,
      features: ['predatoryStrikes', 'cursedWeakness', 'bloodLust', 'stalkersprowess', 'brandOfTheVoracious']
    },
    15: {
      ac: 2,
      speed: 20,
      strength: 2,
      dexterity: 1,
      damageReduction: 5,
      features: ['predatoryStrikes', 'cursedWeakness', 'bloodLust', 'stalkersprowess', 'brandOfTheVoracious', 'advancedTransformation']
    },
    18: {
      ac: 2,
      speed: 20,
      strength: 2,
      dexterity: 2,
      damageReduction: 5,
      features: ['predatoryStrikes', 'cursedWeakness', 'bloodLust', 'stalkersprowess', 'brandOfTheVoracious', 'advancedTransformation', 'hybridTransformationMastery']
    }
  };

  /**
   * Initialize Order of the Lycan system
   */
  static init() {
    console.log(`${MODULE_ID} | Order of the Lycan system initialized`);

    // Register hooks for transformation
    this.registerHooks();
  }

  /**
   * Register hooks for Lycan abilities
   */
  static registerHooks() {
    // Hook for attacks to add Predatory Strikes damage
    Hooks.on('dnd5e.preRollDamage', async (item, rollConfig) => {
      if (!item.actor) return;

      const isTransformed = this.isTransformed(item.actor);
      if (isTransformed && this.hasPredatoryStrikes(item.actor)) {
        await this.addPredatoryStrikesDamage(item, rollConfig);
      }
    });

    // Hook for midi-qol integration
    if (BloodHunterIntegrations.isMidiQOLActive()) {
      Hooks.on('midi-qol.DamageRollComplete', async (workflow) => {
        if (!workflow.actor) return;

        const isTransformed = this.isTransformed(workflow.actor);
        if (isTransformed && this.hasPredatoryStrikes(workflow.actor)) {
          await this.addPredatoryStrikesMidiQOL(workflow);
        }
      });
    }
  }

  /**
   * Check if actor is in hybrid form
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {boolean} True if transformed
   */
  static isTransformed(actor) {
    if (!actor) return false;

    return actor.effects.some(e =>
      e.flags[MODULE_ID]?.hybridTransformation === true
    );
  }

  /**
   * Get current transformation effect
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {ActiveEffect|null} The transformation effect
   */
  static getTransformationEffect(actor) {
    return actor.effects.find(e =>
      e.flags[MODULE_ID]?.hybridTransformation === true
    );
  }

  /**
   * Open transformation dialog
   * @param {Actor} actor - The Blood Hunter actor
   */
  static async transformationDialog(actor = null) {
    // Get actor from token if not provided
    if (!actor) {
      const token = canvas.tokens.controlled[0];
      if (!token) {
        ui.notifications.warn("Please select a token");
        return;
      }
      actor = token.actor;
    }

    // Check if actor is a Lycan Blood Hunter
    if (!this.isLycan(actor)) {
      ui.notifications.error(game.i18n.localize('BLOODHUNTER.Lycan.NotLycan'));
      return;
    }

    const isTransformed = this.isTransformed(actor);
    const bloodHunterLevel = BloodHunterUtils.getBloodHunterLevel(actor);
    const bonuses = this.getHybridBonuses(bloodHunterLevel);

    // Create dialog content
    const content = `
      <form class="bloodhunter-lycan-form">
        ${isTransformed ? `
          <div class="transformation-status active">
            <i class="fas fa-paw-claws"></i>
            <p><strong>${game.i18n.localize('BLOODHUNTER.Lycan.CurrentlyTransformed')}</strong></p>
          </div>
        ` : `
          <div class="transformation-preview">
            <h3>${game.i18n.localize('BLOODHUNTER.Lycan.HybridForm')}</h3>
            <div class="bonus-list">
              <p><i class="fas fa-shield"></i> +${bonuses.ac} AC</p>
              <p><i class="fas fa-running"></i> +${bonuses.speed} ft Speed</p>
              ${bonuses.strength > 0 ? `<p><i class="fas fa-fist-raised"></i> +${bonuses.strength} Strength</p>` : ''}
              ${bonuses.dexterity > 0 ? `<p><i class="fas fa-wind"></i> +${bonuses.dexterity} Dexterity</p>` : ''}
              ${bonuses.damageReduction > 0 ? `<p><i class="fas fa-heart"></i> ${bonuses.damageReduction} Damage Reduction</p>` : ''}
            </div>
            <div class="features-list">
              <p><strong>Abilities:</strong></p>
              <ul>
                <li>🦷 Predatory Strikes</li>
                <li>🌙 Cursed Weakness (Silver)</li>
                ${bonuses.features.includes('stalkersprowess') ? '<li>👁️ Stalker\'s Prowess</li>' : ''}
                ${bonuses.features.includes('brandOfTheVoracious') ? '<li>⚡ Brand of the Voracious</li>' : ''}
                ${bonuses.features.includes('advancedTransformation') ? '<li>💪 Advanced Transformation</li>' : ''}
              </ul>
            </div>
            <div class="blood-lust-warning">
              <i class="fas fa-exclamation-triangle"></i>
              <p><strong>Blood Lust:</strong> ${game.i18n.localize('BLOODHUNTER.Lycan.BloodLustWarning')}</p>
            </div>
          </div>
        `}
      </form>
    `;

    // Create and show dialog
    new Dialog({
      title: game.i18n.localize('BLOODHUNTER.Lycan.Transformation'),
      content: content,
      buttons: isTransformed ? {
        revert: {
          icon: '<i class="fas fa-user"></i>',
          label: game.i18n.localize('BLOODHUNTER.Lycan.RevertToHuman'),
          callback: async () => {
            await this.revertTransformation(actor);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      } : {
        transform: {
          icon: '<i class="fas fa-paw-claws"></i>',
          label: game.i18n.localize('BLOODHUNTER.Lycan.Transform'),
          callback: async () => {
            await this.transform(actor);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Cancel"
        }
      },
      default: isTransformed ? "revert" : "transform"
    }).render(true);
  }

  /**
   * Transform into hybrid form
   * @param {Actor} actor - The Blood Hunter actor
   */
  static async transform(actor) {
    if (this.isTransformed(actor)) {
      ui.notifications.warn(game.i18n.localize('BLOODHUNTER.Lycan.AlreadyTransformed'));
      return;
    }

    const bloodHunterLevel = BloodHunterUtils.getBloodHunterLevel(actor);
    const bonuses = this.getHybridBonuses(bloodHunterLevel);

    // Create transformation effect
    const effectData = this.createTransformationEffect(actor, bonuses);

    // Apply HP cost (no cost for transformation itself, but Blood Lust may trigger)
    // Transformation lasts 1 hour

    await actor.createEmbeddedDocuments('ActiveEffect', [effectData]);

    // Create chat message
    await this.createTransformationMessage(actor, true);

    ui.notifications.info(game.i18n.localize('BLOODHUNTER.Lycan.Transformed'));

    // Check for Blood Lust trigger
    await this.checkBloodLust(actor);
  }

  /**
   * Revert to humanoid form
   * @param {Actor} actor - The Blood Hunter actor
   */
  static async revertTransformation(actor) {
    const effect = this.getTransformationEffect(actor);
    if (!effect) {
      ui.notifications.warn(game.i18n.localize('BLOODHUNTER.Lycan.NotTransformed'));
      return;
    }

    await effect.delete();

    // Create chat message
    await this.createTransformationMessage(actor, false);

    ui.notifications.info(game.i18n.localize('BLOODHUNTER.Lycan.Reverted'));
  }

  /**
   * Create transformation Active Effect
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Object} bonuses - Hybrid form bonuses
   * @returns {Object} Effect data
   */
  static createTransformationEffect(actor, bonuses) {
    const bloodHunterLevel = BloodHunterUtils.getBloodHunterLevel(actor);

    const changes = [
      // AC bonus
      {
        key: 'system.attributes.ac.bonus',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: bonuses.ac,
        priority: 20
      },
      // Speed bonus
      {
        key: 'system.attributes.movement.walk',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: bonuses.speed,
        priority: 20
      }
    ];

    // Strength bonus
    if (bonuses.strength > 0) {
      changes.push({
        key: 'system.abilities.str.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: bonuses.strength,
        priority: 20
      });
    }

    // Dexterity bonus
    if (bonuses.dexterity > 0) {
      changes.push({
        key: 'system.abilities.dex.value',
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: bonuses.dexterity,
        priority: 20
      });
    }

    // Damage resistance (non-silver, non-magical)
    if (bonuses.damageReduction > 0) {
      // Note: DR is harder to implement via AE, may need custom handling
      // For now, we'll add it as a flag and handle manually
    }

    const effectData = {
      name: game.i18n.localize('BLOODHUNTER.Lycan.HybridForm'),
      icon: this.TRANSFORMATION_FORMS.hybrid.icon,
      origin: actor.uuid,
      duration: {
        seconds: 3600 // 1 hour
      },
      changes: changes,
      flags: {
        [MODULE_ID]: {
          hybridTransformation: true,
          lycanLevel: bloodHunterLevel,
          damageReduction: bonuses.damageReduction,
          features: bonuses.features
        }
      }
    };

    return effectData;
  }

  /**
   * Get hybrid bonuses for a given level
   * @param {number} level - Blood Hunter level
   * @returns {Object} Bonuses object
   */
  static getHybridBonuses(level) {
    // Find the highest level bonuses that apply
    const applicableLevels = Object.keys(this.HYBRID_BONUSES)
      .map(l => parseInt(l))
      .filter(l => level >= l)
      .sort((a, b) => b - a);

    return this.HYBRID_BONUSES[applicableLevels[0]] || this.HYBRID_BONUSES[3];
  }

  /**
   * Check if actor is Order of the Lycan
   * @param {Actor} actor - The actor to check
   * @returns {boolean} True if Lycan
   */
  static isLycan(actor) {
    if (!actor) return false;

    // Check for explicit flag first
    const hasFlag = actor.items.some(i =>
      i.type === 'feat' && i.flags[MODULE_ID]?.orderOfTheLycan === true
    );
    if (hasFlag) return true;

    // Auto-detect from features
    return this.hasLycanFeatures(actor);
  }

  /**
   * Detect Order of the Lycan features from actor's items
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {boolean} True if Lycan features detected
   */
  static hasLycanFeatures(actor) {
    if (!actor) return false;

    const features = actor.items.filter(i => i.type === 'feat' || i.type === 'feature');

    // Keywords that indicate Lycan features
    const lycanKeywords = [
      // English keywords
      'lycan', 'lycanthrope', 'hybrid transformation', 'hybrid form',
      'predatory strikes', 'blood lust', 'cursed weakness',
      'heightened senses', 'stalker\'s prowess', 'stalkers prowess',
      'brand of the voracious', 'advanced transformation',
      'hybrid transformation mastery',
      // French keywords
      'transformation hybride', 'forme hybride', 'frappes prédatrices',
      'soif de sang', 'faiblesse maudite', 'sens aiguisés',
      'prouesse du traqueur', 'marque du vorace',
      'transformation avancée', 'maîtrise de la transformation hybride'
    ];

    // Check for any Lycan-related features
    for (const feature of features) {
      const name = feature.name.toLowerCase();
      const description = feature.system?.description?.value?.toLowerCase() || '';

      for (const keyword of lycanKeywords) {
        if (name.includes(keyword) || description.includes(keyword)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if actor has Predatory Strikes
   * @param {Actor} actor - The actor
   * @returns {boolean} True if has ability
   */
  static hasPredatoryStrikes(actor) {
    const effect = this.getTransformationEffect(actor);
    if (!effect) return false;

    const features = effect.flags[MODULE_ID]?.features || [];
    return features.includes('predatoryStrikes');
  }

  /**
   * Add Predatory Strikes damage to attack
   * @param {Item} item - The weapon item
   * @param {Object} rollConfig - Roll configuration
   */
  static async addPredatoryStrikesDamage(item, rollConfig) {
    // Predatory Strikes: Add hemocraft die as slashing damage
    const hemocraftDie = BloodHunterUtils.getHemocraftDie(item.actor);

    if (rollConfig.parts) {
      rollConfig.parts.push(`${hemocraftDie}[slashing]`);
    }
  }

  /**
   * Add Predatory Strikes damage via midi-qol
   * @param {MidiQOL.Workflow} workflow - The workflow
   */
  static async addPredatoryStrikesMidiQOL(workflow) {
    const hemocraftDie = BloodHunterUtils.getHemocraftDie(workflow.actor);
    const bonusRoll = await new Roll(hemocraftDie).evaluate();

    if (workflow.damageRoll) {
      workflow.damageDetail.push({
        damage: bonusRoll.total,
        type: 'slashing',
        source: 'Predatory Strikes'
      });

      await bonusRoll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: workflow.actor }),
        flavor: 'Predatory Strikes'
      });
    }
  }

  /**
   * Check for Blood Lust trigger
   * @param {Actor} actor - The Blood Hunter actor
   */
  static async checkBloodLust(actor) {
    const bloodHunterLevel = BloodHunterUtils.getBloodHunterLevel(actor);

    // Blood Lust: At the start of your turn, if you've taken damage since your last turn,
    // must make DC 8 + damage taken Wisdom save or attack nearest creature

    // For now, we create a reminder in chat
    const content = `
      <div class="bloodhunter-blood-lust-reminder">
        <h3>🩸 Blood Lust Reminder</h3>
        <p>${actor.name} is in Hybrid Form!</p>
        <p><strong>Blood Lust:</strong> At the start of your turn, if you took damage since your last turn, make a <strong>Wisdom saving throw (DC 8 + damage taken)</strong>.</p>
        <p>On a failure, you must move towards and attack the nearest creature.</p>
        ${bloodHunterLevel >= 18 ? '<p><em>At 18th level, you have advantage on this save.</em></p>' : ''}
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: content,
      flags: {
        [MODULE_ID]: {
          bloodLust: true
        }
      }
    });
  }

  /**
   * Create transformation chat message
   * @param {Actor} actor - The actor
   * @param {boolean} transforming - True if transforming, false if reverting
   */
  static async createTransformationMessage(actor, transforming) {
    const bonuses = transforming ? this.getHybridBonuses(BloodHunterUtils.getBloodHunterLevel(actor)) : null;

    const content = transforming ? `
      <div class="bloodhunter-lycan-transformation">
        <h3>🐺 ${game.i18n.localize('BLOODHUNTER.Lycan.HybridTransformation')}</h3>
        <p><strong>${actor.name}</strong> transforms into their hybrid form!</p>
        <div class="transformation-bonuses">
          <p>+${bonuses.ac} AC | +${bonuses.speed} ft Speed</p>
          ${bonuses.strength > 0 ? `<p>+${bonuses.strength} Strength</p>` : ''}
          ${bonuses.dexterity > 0 ? `<p>+${bonuses.dexterity} Dexterity</p>` : ''}
          ${bonuses.damageReduction > 0 ? `<p>${bonuses.damageReduction} Damage Reduction (vs non-silver, non-magical)</p>` : ''}
          <p>🦷 Predatory Strikes Active</p>
        </div>
      </div>
    ` : `
      <div class="bloodhunter-lycan-reversion">
        <h3>👤 ${game.i18n.localize('BLOODHUNTER.Lycan.RevertToHuman')}</h3>
        <p><strong>${actor.name}</strong> reverts to their humanoid form.</p>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      content: content,
      flags: {
        [MODULE_ID]: {
          lycanTransformation: true,
          transforming: transforming
        }
      }
    });
  }

  /**
   * Create Lycan button for actor sheet
   * @param {jQuery} html - The sheet HTML
   * @param {Actor} actor - The actor
   */
  static addLycanButtonToSheet(html, actor) {
    if (!this.isLycan(actor)) return;

    const headerActions = html.find('.sheet-header .header-actions');
    if (headerActions.length === 0) return;

    const isTransformed = this.isTransformed(actor);

    const button = $(`
      <div class="bloodhunter-lycan-button ${isTransformed ? 'active' : ''}"
           title="${game.i18n.localize('BLOODHUNTER.Lycan.Transformation')}">
        <i class="fas fa-paw-claws"></i>
        <span>${isTransformed ? game.i18n.localize('BLOODHUNTER.Lycan.Hybrid') : game.i18n.localize('BLOODHUNTER.Lycan.Human')}</span>
      </div>
    `);

    button.on('click', () => {
      this.transformationDialog(actor);
    });

    headerActions.append(button);
  }
}
