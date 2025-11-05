/**
 * Crimson Rite functionality for Blood Hunter
 */

import { BloodHunterUtils } from './utils.js';
import { MODULE_ID } from './blood-hunter.js';
import { BloodHunterIntegrations } from './integrations.js';

export class CrimsonRite {

  // Available rite types with their damage types
  static RITE_TYPES = {
    flame: { damageType: 'fire', level: 1 },
    frozen: { damageType: 'cold', level: 1 },
    storm: { damageType: 'lightning', level: 1 },
    dead: { damageType: 'necrotic', level: 14 },
    oracle: { damageType: 'psychic', level: 14 },
    roar: { damageType: 'thunder', level: 14 }
  };

  /**
   * Roll HP cost for Crimson Rite activation
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {Promise<number>} The rolled HP cost
   */
  static async rollHPCost(actor) {
    const hemocraftDie = BloodHunterUtils.getHemocraftDie(actor, 'crimson-rite');
    const roll = await new Roll(`${hemocraftDie}[necrotic]`).evaluate();

    // Display roll in chat
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: actor }),
      flavor: game.i18n.localize('BLOODHUNTER.CrimsonRite.Title') + ' - ' + game.i18n.localize('BLOODHUNTER.CrimsonRite.Cost')
    });

    return roll.total;
  }

  /**
   * Detect known rites from actor's features/items
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {Array} Array of known rite keys
   */
  static getKnownRitesFromFeatures(actor) {
    const knownRites = [];

    // Search through actor's features for Crimson Rite items
    const features = actor.items.filter(i => i.type === 'feat' || i.type === 'feature');

    for (const feature of features) {
      const name = feature.name.toLowerCase();
      const description = feature.system?.description?.value?.toLowerCase() || '';

      // Priority 1: Check for module flag (most reliable)
      if (feature.flags[MODULE_ID]?.crimsonRite) {
        const riteType = feature.flags[MODULE_ID].riteType;
        if (riteType && this.RITE_TYPES[riteType] && !knownRites.includes(riteType)) {
          knownRites.push(riteType);
          console.log(`${MODULE_ID} | Detected rite from module flag: ${riteType} (from "${feature.name}")`);
          continue; // Skip other checks for this feature
        }
      }

      // Check if this feature is related to Crimson Rite at all
      // Support both English and French
      const isCrimsonRiteFeature = name.includes('crimson rite') ||
                                    name.includes('rite écarlate') ||
                                    description.includes('crimson rite') ||
                                    description.includes('rite écarlate');

      if (!isCrimsonRiteFeature) {
        continue; // Skip features that aren't related to Crimson Rite
      }

      // Priority 2: Check for specific rite patterns with context
      for (const key of Object.keys(this.RITE_TYPES)) {
        // Get localized name and clean it (remove damage type in parentheses)
        const localizedName = game.i18n.localize(`BLOODHUNTER.CrimsonRite.Types.${key}`);
        // Remove everything after and including the opening parenthesis
        const cleanedName = localizedName.replace(/\s*\([^)]*\).*$/, '').toLowerCase();

        // Debug log to see what we're comparing
        console.log(`${MODULE_ID} | Checking rite ${key}: cleanedName="${cleanedName}"`);

        // Check for D&D Beyond format patterns:
        // English: "Crimson Rite: Rite of the Flame"
        // French: "Rite Écarlate: Rite de la Flamme"

        // Pattern 1: Full localized name (e.g., "rite of the flame", "rite de la flamme")
        if (name.includes(cleanedName)) {
          if (!knownRites.includes(key)) {
            knownRites.push(key);
            console.log(`${MODULE_ID} | Detected rite from localized name: ${key} (from "${feature.name}")`);
            continue;
          }
        }

        // Pattern 2: English D&D Beyond patterns with rite key
        // "rite of the flame", "rite of flame"
        const englishPatterns = [
          `rite of the ${key}`,
          `rite of ${key}`
        ];

        for (const pattern of englishPatterns) {
          if (name.includes(pattern)) {
            if (!knownRites.includes(key)) {
              knownRites.push(key);
              console.log(`${MODULE_ID} | Detected rite from English pattern: ${key} (pattern: "${pattern}", from "${feature.name}")`);
              break;
            }
          }
        }

        // Pattern 3: French D&D Beyond patterns with rite key
        // "rite de la flamme", "rite du givre"
        const frenchPatterns = [
          `rite de la ${key}`,
          `rite de l'${key}`,
          `rite du ${key}`,
          `rite des ${key}`
        ];

        for (const pattern of frenchPatterns) {
          if (name.includes(pattern)) {
            if (!knownRites.includes(key)) {
              knownRites.push(key);
              console.log(`${MODULE_ID} | Detected rite from French pattern: ${key} (pattern: "${pattern}", from "${feature.name}")`);
              break;
            }
          }
        }
      }
    }

    if (knownRites.length > 0) {
      console.log(`${MODULE_ID} | Total rites detected from features: ${knownRites.length}`, knownRites);
    } else {
      console.log(`${MODULE_ID} | No rites detected from features`);
    }

    return knownRites;
  }

  /**
   * Get available rites for an actor based on their features or level
   * @param {Actor} actor - The Blood Hunter actor
   * @returns {Object} Available rites
   */
  static getAvailableRites(actor) {
    const bloodHunterLevel = BloodHunterUtils.getBloodHunterLevel(actor);
    const available = {};

    // Check module setting for detection mode
    const detectionMode = game.settings.get(MODULE_ID, 'riteDetectionMode') || 'auto';

    let knownRites = [];

    if (detectionMode === 'features' || detectionMode === 'auto') {
      // Try to detect rites from features first
      knownRites = this.getKnownRitesFromFeatures(actor);
    }

    // If no rites found in features and mode is auto, fall back to level-based
    if (knownRites.length === 0 && detectionMode === 'auto') {
      console.log(`${MODULE_ID} | No rites found in features, using level-based detection`);

      for (const [key, value] of Object.entries(this.RITE_TYPES)) {
        if (bloodHunterLevel >= value.level) {
          available[key] = value;
        }
      }
    }
    // If mode is features-only or we found rites, use those
    else if (knownRites.length > 0) {
      console.log(`${MODULE_ID} | Found ${knownRites.length} rites in features:`, knownRites);

      for (const riteKey of knownRites) {
        if (this.RITE_TYPES[riteKey]) {
          available[riteKey] = this.RITE_TYPES[riteKey];
        }
      }
    }
    // If mode is level-only, use level-based
    else if (detectionMode === 'level') {
      for (const [key, value] of Object.entries(this.RITE_TYPES)) {
        if (bloodHunterLevel >= value.level) {
          available[key] = value;
        }
      }
    }

    return available;
  }

  /**
   * Open dialog to activate a Crimson Rite
   * @param {Actor} actor - Optional actor, uses selected token if not provided
   */
  static async activateDialog(actor = null) {
    // Get actor from token if not provided
    if (!actor) {
      const token = canvas.tokens.controlled[0];
      if (!token) {
        ui.notifications.warn('Please select a token');
        return;
      }
      actor = token.actor;
    }

    // Check if actor is a Blood Hunter
    if (!BloodHunterUtils.isBloodHunter(actor)) {
      ui.notifications.error(game.i18n.localize('BLOODHUNTER.CrimsonRite.NotBloodHunter'));
      return;
    }

    // Get available weapons
    const weapons = actor.items.filter(i => i.type === 'weapon');
    if (weapons.length === 0) {
      ui.notifications.warn(game.i18n.localize('BLOODHUNTER.CrimsonRite.NoWeapons'));
      return;
    }

    // Get available rites
    const availableRites = this.getAvailableRites(actor);

    // Build weapon options HTML
    let weaponOptions = '';
    for (const weapon of weapons) {
      const activeRite = this.getActiveRite(weapon);
      const activeText = activeRite ? ` (${game.i18n.localize('BLOODHUNTER.CrimsonRite.Active')}: ${game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + activeRite.riteType)})` : '';
      weaponOptions += `<option value="${weapon.id}">${weapon.name}${activeText}</option>`;
    }

    // Build rite options HTML
    let riteOptions = '';
    for (const key of Object.keys(availableRites)) {
      riteOptions += `<option value="${key}">${game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + key)}</option>`;
    }

    const hemocraftDie = BloodHunterUtils.getHemocraftDie(actor, 'crimson-rite');

    // Create dialog content
    const content = `
      <form class="bh-rite-dialog">
        <div class="form-group">
          <label>${game.i18n.localize('BLOODHUNTER.CrimsonRite.SelectWeapon')}:</label>
          <select name="weapon" id="rite-weapon">
            ${weaponOptions}
          </select>
        </div>
        <div class="form-group">
          <label>${game.i18n.localize('BLOODHUNTER.CrimsonRite.SelectRite')}:</label>
          <select name="rite" id="rite-type">
            ${riteOptions}
          </select>
        </div>
        <div class="form-group info">
          <p><strong>${game.i18n.localize('BLOODHUNTER.CrimsonRite.Cost')}:</strong> ${hemocraftDie} HP</p>
          <p><strong>Bonus Damage:</strong> ${hemocraftDie}</p>
        </div>
        <div class="form-group">
          <button type="button" id="deactivate-rite" class="deactivate-button">
            ${game.i18n.localize('BLOODHUNTER.CrimsonRite.Deactivate')}
          </button>
        </div>
      </form>
    `;

    // Create and show dialog
    new Dialog({
      title: game.i18n.localize('BLOODHUNTER.CrimsonRite.Title'),
      content: content,
      buttons: {
        activate: {
          icon: '<i class="fas fa-fire"></i>',
          label: game.i18n.localize('BLOODHUNTER.CrimsonRite.Activate'),
          callback: async(html) => {
            const weaponId = html.find('[name="weapon"]').val();
            const riteType = html.find('[name="rite"]').val();
            await this.activate(actor, weaponId, riteType);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: 'Cancel'
        }
      },
      default: 'activate',
      render: (html) => {
        // Add deactivate button handler
        html.find('#deactivate-rite').on('click', async() => {
          const weaponId = html.find('[name="weapon"]').val();
          await this.deactivate(actor, weaponId);
          // Close the dialog
          html.closest('.dialog').find('.dialog-button.cancel').trigger('click');
        });
      }
    }, {
      width: 400
    }).render(true);
  }

  /**
   * Activate a Crimson Rite on a weapon
   * @param {Actor} actor - The Blood Hunter actor
   * @param {string} weaponId - The weapon item ID
   * @param {string} riteType - The type of rite to activate
   */
  static async activate(actor, weaponId, riteType) {
    const weapon = actor.items.get(weaponId);
    if (!weapon) return;

    // Check if weapon already has an active rite
    const existingRite = this.getActiveRite(weapon);
    if (existingRite) {
      // Remove existing rite first
      await this.deactivate(actor, weaponId, false);
    }

    // Roll HP cost (hemocraft die)
    const hpCost = await this.rollHPCost(actor);
    const currentHP = actor.system.attributes.hp.value;

    if (currentHP <= hpCost && game.settings.get(MODULE_ID, 'autoCalculateHP')) {
      ui.notifications.error(game.i18n.localize('BLOODHUNTER.CrimsonRite.InsufficientHP'));
      return;
    }

    // Apply HP cost
    if (game.settings.get(MODULE_ID, 'autoCalculateHP')) {
      await actor.update({
        'system.attributes.hp.value': currentHP - hpCost
      });
      ui.notifications.info(game.i18n.format('BLOODHUNTER.Notifications.HPCostApplied', { cost: hpCost }));
    }

    // Get rite damage and type
    const riteDamage = BloodHunterUtils.getHemocraftDie(actor, 'crimson-rite');
    const damageType = this.RITE_TYPES[riteType].damageType;

    // Create Active Effect for the rite
    // Use DAE-enhanced effect if available
    let effectData;
    if (BloodHunterIntegrations.isDAEActive()) {
      effectData = BloodHunterIntegrations.createCrimsonRiteEffect(
        riteType,
        damageType,
        riteDamage,
        weaponId,
        actor
      );
    } else {
      // Fallback to basic effect
      effectData = {
        name: `${game.i18n.localize('BLOODHUNTER.CrimsonRite.Title')} - ${game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + riteType)}`,
        icon: this.getRiteIcon(riteType),
        origin: actor.uuid,
        duration: {
          seconds: null // Lasts until dismissed or rest
        },
        flags: {
          'vtt-blood-hunter': {
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
    }

    await weapon.createEmbeddedDocuments('ActiveEffect', [effectData]);

    ui.notifications.info(
      game.i18n.format('BLOODHUNTER.CrimsonRite.Activated', {
        weapon: weapon.name,
        rite: game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + riteType)
      })
    );
  }

  /**
   * Deactivate a Crimson Rite on a weapon
   * @param {Actor} actor - The Blood Hunter actor
   * @param {string} weaponId - The weapon item ID
   * @param {boolean} showNotification - Whether to show notification
   */
  static async deactivate(actor, weaponId, showNotification = true) {
    const weapon = actor.items.get(weaponId);
    if (!weapon) return;

    const activeRite = this.getActiveRite(weapon);
    if (!activeRite) {
      if (showNotification) {
        ui.notifications.warn('No active Crimson Rite on this weapon');
      }
      return;
    }

    await activeRite.delete();

    if (showNotification) {
      ui.notifications.info(
        game.i18n.format('BLOODHUNTER.CrimsonRite.Deactivated', {
          weapon: weapon.name
        })
      );
    }
  }

  /**
   * Get the active Crimson Rite effect on a weapon
   * @param {Item} weapon - The weapon item
   * @returns {ActiveEffect|null} The active rite effect or null
   */
  static getActiveRite(weapon) {
    return weapon.effects.find(e => e.flags['vtt-blood-hunter']?.crimsonRite);
  }

  /**
   * Get icon for rite type
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
   * Add Crimson Rite button to weapon item sheet
   * @param {jQuery} html - The item sheet HTML
   * @param {Item} item - The weapon item
   */
  static addRiteButtonToSheet(html, item) {
    const activeRite = this.getActiveRite(item);

    // Find a good place to insert the button (after item description or properties)
    const insertPoint = html.find('.item-properties, .tab[data-tab="description"]').last();
    if (insertPoint.length === 0) return;

    let buttonHtml = '';

    if (activeRite) {
      const riteType = activeRite.flags['vtt-blood-hunter'].riteType;
      const riteDamage = activeRite.flags['vtt-blood-hunter'].riteDamage;
      const damageType = activeRite.flags['vtt-blood-hunter'].damageType;

      buttonHtml = `
        <div class="bloodhunter-active-rite">
          <i class="fas fa-fire-alt"></i>
          <span class="rite-name">${game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + riteType)}</span>
          <span class="rite-damage">${riteDamage} ${game.i18n.localize('BLOODHUNTER.CrimsonRite.DamageTypes.' + damageType)}</span>
        </div>
      `;
    } else {
      buttonHtml = `
        <button type="button" class="bloodhunter-rite-activate" data-item-id="${item.id}">
          <i class="fas fa-fire-alt"></i>
          <span>${game.i18n.localize('BLOODHUNTER.CrimsonRite.Activate')}</span>
        </button>
      `;
    }

    const buttonElement = $(buttonHtml);
    insertPoint.after(buttonElement);

    // Add click handler for activation button
    buttonElement.on('click', async(event) => {
      event.preventDefault();
      await this.activateDialog(item.actor);
    });
  }
}
