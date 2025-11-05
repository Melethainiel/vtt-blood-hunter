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
   * @param {string|null} scalePath - Optional scale path (e.g., 'crimson-rite', 'blood-maledict'). If null, uses level-based calculation.
   * @returns {string} Hemocraft die (e.g., "1d4", "1d6")
   */
  static getHemocraftDie(actor, scalePath = null) {
    // If scalePath is provided, check for DDB Importer scale value first
    if (scalePath) {
      const scaleValue = actor?.system?.scale?.['blood-hunter']?.[scalePath];

      if (scaleValue) {
        // Handle DDB object format: { number, faces, modifiers }
        if (typeof scaleValue === 'object' && scaleValue.number && scaleValue.faces) {
          const die = `${scaleValue.number}d${scaleValue.faces}`;
          console.log(`vtt-blood-hunter | Using DDB scale value for hemocraft die (${scalePath}): ${die}`);
          return die;
        }

        // Handle string format (legacy or alternative format)
        const diePattern = /^\d+d\d+$/;
        if (typeof scaleValue === 'string' && diePattern.test(scaleValue)) {
          console.log(`vtt-blood-hunter | Using DDB scale value for hemocraft die (${scalePath}): ${scaleValue}`);
          return scaleValue;
        } else if (scaleValue.value && typeof scaleValue.value === 'string' && diePattern.test(scaleValue.value)) {
          // Handle case where scale value is an object with a 'value' property
          console.log(`vtt-blood-hunter | Using DDB scale value for hemocraft die (${scalePath}): ${scaleValue.value}`);
          return scaleValue.value;
        } else {
          console.warn(`vtt-blood-hunter | Invalid DDB scale value format for ${scalePath}: ${JSON.stringify(scaleValue)}, falling back to level-based calculation`);
        }
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
   * Get modifier from ability score
   * @param {number} score - Ability score
   * @returns {number} Modifier
   */
  static getModifier(score) {
    return Math.floor((score - 10) / 2);
  }
}
