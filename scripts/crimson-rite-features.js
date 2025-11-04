/**
 * Crimson Rite Feature Items System
 * Allows using Crimson Rite as activable features instead of dialogs
 */

import { CrimsonRite } from './crimson-rite.js';
import { MODULE_ID } from './blood-hunter.js';
import { BloodHunterUtils } from './utils.js';

export class CrimsonRiteFeatures {
  
  /**
   * Initialize the Crimson Rite feature system
   */
  static init() {
    // Hook into item usage
    Hooks.on('dnd5e.useItem', this._onUseItem.bind(this));
    
    console.log(`${MODULE_ID} | Crimson Rite Features system initialized`);
  }

  /**
   * Handle feature item usage
   * @param {Item5e} item - The item being used
   * @param {object} config - Usage configuration
   * @param {object} options - Additional options
   * @returns {boolean|void} False to prevent default behavior
   */
  static async _onUseItem(item, config, options) {
    // Check if this is a Crimson Rite feature
    if (!item.flags[MODULE_ID]?.crimsonRiteFeature) return;

    const actor = item.actor;
    if (!actor) return;

    // Get the rite type from the feature
    const riteType = item.flags[MODULE_ID].riteType;
    if (!riteType) {
      ui.notifications.error('Invalid Crimson Rite feature: missing rite type');
      return false;
    }

    // Open weapon selection dialog
    await this.activateRiteFromFeature(actor, riteType);

    // Prevent default item usage
    return false;
  }

  /**
   * Activate a Crimson Rite from a feature
   * @param {Actor} actor - The Blood Hunter actor
   * @param {string} riteType - The type of rite to activate
   */
  static async activateRiteFromFeature(actor, riteType) {
    // Get available weapons
    const weapons = actor.items.filter(i => i.type === 'weapon');
    if (weapons.length === 0) {
      ui.notifications.warn(game.i18n.localize('BLOODHUNTER.CrimsonRite.NoWeapons'));
      return;
    }

    // Build weapon options HTML
    let weaponOptions = '';
    for (const weapon of weapons) {
      const activeRite = CrimsonRite.getActiveRite(weapon);
      const activeText = activeRite ? ` (${game.i18n.localize('BLOODHUNTER.CrimsonRite.Active')}: ${game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + activeRite.flags[MODULE_ID].riteType)})` : '';
      weaponOptions += `<option value="${weapon.id}">${weapon.name}${activeText}</option>`;
    }

    const hpCost = CrimsonRite.calculateHPCost(actor);
    const riteDamage = CrimsonRite.getRiteDamage(actor);
    const riteName = game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + riteType);

    // Create dialog content
    const content = `
      <form class="bloodhunter-crimson-rite-form">
        <div class="form-group">
          <label>${game.i18n.localize('BLOODHUNTER.CrimsonRite.SelectWeapon')}:</label>
          <select name="weapon" id="rite-weapon">
            ${weaponOptions}
          </select>
        </div>
        <div class="form-group info">
          <p><strong>${game.i18n.localize('BLOODHUNTER.CrimsonRite.SelectRite')}:</strong> ${riteName}</p>
          <p><strong>${game.i18n.localize('BLOODHUNTER.CrimsonRite.Cost')}:</strong> ${hpCost} HP</p>
          <p><strong>Bonus Damage:</strong> ${riteDamage}</p>
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
      title: riteName,
      content: content,
      buttons: {
        activate: {
          icon: '<i class="fas fa-fire"></i>',
          label: game.i18n.localize('BLOODHUNTER.CrimsonRite.Activate'),
          callback: async(html) => {
            const weaponId = html.find('[name="weapon"]').val();
            await CrimsonRite.activate(actor, weaponId, riteType);
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
          await CrimsonRite.deactivate(actor, weaponId);
          // Close the dialog
          html.closest('.dialog').find('.dialog-button.cancel').trigger('click');
        });
      }
    }).render(true);
  }

  /**
   * Create a Crimson Rite feature item
   * @param {string} riteType - The type of rite (flame, frozen, storm, etc.)
   * @returns {object} Item data for the feature
   */
  static createRiteFeatureData(riteType) {
    const riteInfo = CrimsonRite.RITE_TYPES[riteType];
    if (!riteInfo) return null;

    const riteName = game.i18n.localize(`BLOODHUNTER.CrimsonRite.Types.${riteType}`);
    const icon = CrimsonRite.getRiteIcon(riteType);

    // Build description
    const description = `
      <p><strong>Crimson Rite</strong></p>
      <p>As a bonus action, you can activate a Crimson Rite on a single weapon with the elemental energy of ${riteInfo.damageType} damage.</p>
      <p>The rite lasts until you finish a short or long rest. When you activate a Crimson Rite, you take necrotic damage equal to one roll of your hemocraft die.</p>
      <p>While the rite is active, attacks you make with this weapon deal an extra hemocraft die of ${riteInfo.damageType} damage.</p>
      <p><em>Click to activate this rite on one of your weapons.</em></p>
    `;

    return {
      name: riteName,
      type: 'feat',
      img: icon,
      system: {
        description: {
          value: description,
          chat: '',
          unidentified: ''
        },
        source: 'Blood Hunter Class',
        activation: {
          type: 'bonus',
          cost: 1,
          condition: ''
        },
        duration: {
          value: null,
          units: 'spec'
        },
        target: {
          value: 1,
          width: null,
          units: '',
          type: 'self'
        },
        range: {
          value: null,
          long: null,
          units: 'self'
        },
        uses: {
          value: null,
          max: '',
          per: null,
          recovery: ''
        },
        consume: {
          type: '',
          target: null,
          amount: null
        },
        ability: null,
        actionType: 'util',
        attackBonus: '',
        chatFlavor: '',
        critical: {
          threshold: null,
          damage: ''
        },
        damage: {
          parts: [],
          versatile: ''
        },
        formula: '',
        save: {
          ability: '',
          dc: null,
          scaling: 'spell'
        },
        requirements: `Blood Hunter ${riteInfo.level}`,
        recharge: {
          value: null,
          charged: true
        }
      },
      flags: {
        [MODULE_ID]: {
          crimsonRiteFeature: true,
          riteType: riteType,
          damageType: riteInfo.damageType,
          requiredLevel: riteInfo.level
        }
      }
    };
  }

  /**
   * Add Crimson Rite features to an actor
   * @param {Actor} actor - The Blood Hunter actor
   * @param {Array<string>} riteTypes - Optional array of specific rites to add (defaults to available rites)
   */
  static async addRiteFeaturesToActor(actor, riteTypes = null) {
    if (!BloodHunterUtils.isBloodHunter(actor)) {
      ui.notifications.error(game.i18n.localize('BLOODHUNTER.CrimsonRite.NotBloodHunter'));
      return;
    }

    // Get available rites if not specified
    if (!riteTypes) {
      const availableRites = CrimsonRite.getAvailableRites(actor);
      riteTypes = Object.keys(availableRites);
    }

    const itemsToCreate = [];
    let alreadyHas = 0;

    for (const riteType of riteTypes) {
      // Check if actor already has this feature
      const existing = actor.items.find(i => 
        i.flags[MODULE_ID]?.crimsonRiteFeature && 
        i.flags[MODULE_ID]?.riteType === riteType
      );

      if (existing) {
        alreadyHas++;
        continue;
      }

      const featureData = this.createRiteFeatureData(riteType);
      if (featureData) {
        itemsToCreate.push(featureData);
      }
    }

    if (itemsToCreate.length > 0) {
      await actor.createEmbeddedDocuments('Item', itemsToCreate);
      ui.notifications.info(`Added ${itemsToCreate.length} Crimson Rite feature(s) to ${actor.name}`);
    }

    if (alreadyHas > 0) {
      ui.notifications.info(`${actor.name} already has ${alreadyHas} Crimson Rite feature(s)`);
    }

    if (itemsToCreate.length === 0 && alreadyHas === 0) {
      ui.notifications.warn('No Crimson Rite features to add');
    }
  }

  /**
   * Remove all Crimson Rite features from an actor
   * @param {Actor} actor - The actor to remove features from
   */
  static async removeRiteFeaturesFromActor(actor) {
    const riteFeatures = actor.items.filter(i => i.flags[MODULE_ID]?.crimsonRiteFeature);
    
    if (riteFeatures.length === 0) {
      ui.notifications.info('No Crimson Rite features to remove');
      return;
    }

    const ids = riteFeatures.map(f => f.id);
    await actor.deleteEmbeddedDocuments('Item', ids);
    
    ui.notifications.info(`Removed ${riteFeatures.length} Crimson Rite feature(s) from ${actor.name}`);
  }
}
