/**
 * Utility functions for Blood Hunter module
 */

export class BloodHunterUtils {

  /**
   * Check if an actor is a Blood Hunter
   * @param {Actor} actor - The actor to check
   * @returns {boolean} True if actor has Blood Hunter class
   */
  static isBloodHunter(actor) {
    if (!actor) return false;

    // Check for Blood Hunter class in character classes
    const classes = actor.items.filter(i => i.type === 'class');
    return classes.some(c =>
      c.name.toLowerCase().includes('blood hunter') ||
      c.system?.identifier === 'bloodhunter'
    );
  }

  /**
   * Get Blood Hunter class level for an actor
   * @param {Actor} actor - The actor
   * @returns {number} Blood Hunter level or 0
   */
  static getBloodHunterLevel(actor) {
    if (!actor) return 0;

    const bhClass = actor.items.find(i =>
      i.type === 'class' && (
        i.name.toLowerCase().includes('blood hunter') ||
        i.system?.identifier === 'bloodhunter'
      )
    );

    return bhClass?.system?.levels || 0;
  }

  /**
   * Get the hemocraft die based on Blood Hunter level
   * Prioritizes DDB scale value if available, falls back to level-based calculation
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {string} Hemocraft die (e.g., "1d4", "1d6")
   */
  static getHemocraftDie(actor) {
    // Check for DDB Importer scale value first
    const scaleValue = actor?.system?.scale?.['blood-hunter']?.['blood-maledict'];

    if (scaleValue) {
      // Validate the scale value format (should be like "1d4", "1d6", etc.)
      const diePattern = /^\d+d\d+$/;
      if (typeof scaleValue === 'string' && diePattern.test(scaleValue)) {
        console.log(`vtt-blood-hunter | Using DDB scale value for hemocraft die: ${scaleValue}`);
        return scaleValue;
      } else if (scaleValue.value && typeof scaleValue.value === 'string' && diePattern.test(scaleValue.value)) {
        // Handle case where scale value is an object with a 'value' property
        console.log(`vtt-blood-hunter | Using DDB scale value for hemocraft die: ${scaleValue.value}`);
        return scaleValue.value;
      } else {
        console.warn(`vtt-blood-hunter | Invalid DDB scale value format: ${JSON.stringify(scaleValue)}, falling back to level-based calculation`);
      }
    }

    // Fall back to level-based calculation
    const level = this.getBloodHunterLevel(actor);
    let die;

    if (level < 5) die = '1d4';
    else if (level < 11) die = '1d6';
    else if (level < 17) die = '1d8';
    else die = '1d10';

    console.log(`vtt-blood-hunter | Using level-based hemocraft die: ${die} (level ${level})`);
    return die;
  }

  /**
   * Check if actor has a specific Blood Hunter feature
   * @param {Actor} actor - The actor to check
   * @param {string} featureName - Name of the feature
   * @returns {boolean} True if actor has the feature
   */
  static hasFeature(actor, featureName) {
    if (!actor) return false;

    return actor.items.some(i =>
      i.type === 'feat' &&
      i.name.toLowerCase().includes(featureName.toLowerCase())
    );
  }

  /**
   * Get Blood Hunter Order for an actor
   * @param {Actor} actor - The actor
   * @returns {string|null} Order name or null
   */
  static getBloodHunterOrder(actor) {
    if (!actor) return null;

    const orders = [
      'ghostslayer',
      'lycan',
      'mutant',
      'profane soul'
    ];

    for (const order of orders) {
      if (this.hasFeature(actor, order)) {
        return order;
      }
    }

    return null;
  }

  /**
   * Calculate crimson rite damage bonus
   * @param {Actor} actor - The Blood Hunter actor
   * @param {string} damageType - Type of damage
   * @returns {string} Damage formula
   */
  static calculateRiteDamage(actor, damageType) {
    const die = this.getHemocraftDie(actor);
    return `${die}[${damageType}]`;
  }

  /**
   * Add chat message with Blood Hunter styling
   * @param {string} content - Message content
   * @param {Actor} actor - The actor
   */
  static async createChatMessage(content, actor = null) {
    const chatData = {
      content: content,
      speaker: actor ? ChatMessage.getSpeaker({ actor: actor }) : null,
      flags: {
        'vtt-blood-hunter': {
          message: true
        }
      }
    };

    await ChatMessage.create(chatData);
  }

  /**
   * Get modifier from ability score
   * @param {number} score - Ability score
   * @returns {number} Modifier
   */
  static getModifier(score) {
    return Math.floor((score - 10) / 2);
  }

  /**
   * Check if it's a weapon that can have Crimson Rite
   * @param {Item} item - The item to check
   * @returns {boolean} True if valid weapon
   */
  static isValidRiteWeapon(item) {
    if (!item || item.type !== 'weapon') return false;

    // All weapons can have Crimson Rite in the official rules
    return true;
  }

  /**
   * Format duration text
   * @param {number} seconds - Duration in seconds
   * @returns {string} Formatted duration
   */
  static formatDuration(seconds) {
    if (!seconds) return game.i18n.localize('Unlimited');

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Roll hemocraft die
   * @param {Actor} actor - The Blood Hunter actor
   * @param {string} label - Label for the roll
   * @returns {Promise<Roll>} The roll result
   */
  static async rollHemocraft(actor, label = 'Hemocraft') {
    const die = this.getHemocraftDie(actor);
    const roll = new Roll(die);
    await roll.evaluate();

    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: label
    });

    return roll;
  }
}
