/**
 * Crimson Rite UI and dialog components
 */

import { BloodHunterUtils } from '../utils.js';
import { MODULE_ID } from '../blood-hunter.js';
import { getAvailableRites } from './rite-detection.js';
import { activate, deactivate, getActiveRite } from './rite-manager.js';

/**
 * Open dialog to activate a Crimson Rite
 * @param {Actor} actor - Optional actor, uses selected token if not provided
 */
export async function activateDialog(actor = null) {
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
  const availableRites = getAvailableRites(actor);

  // Build weapon options HTML
  let weaponOptions = '';
  for (const weapon of weapons) {
    const activeRite = getActiveRite(weapon);
    const riteFlag = weapon.getFlag(MODULE_ID, 'crimsonRite');
    const activeText = activeRite && riteFlag ? ` (${game.i18n.localize('BLOODHUNTER.CrimsonRite.Active')}: ${game.i18n.localize('BLOODHUNTER.CrimsonRite.Types.' + riteFlag.riteType)})` : '';
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
          await activate(actor, weaponId, riteType);
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
        await deactivate(actor, weaponId);
        // Close the dialog
        html.closest('.dialog').find('.dialog-button.cancel').trigger('click');
      });
    }
  }, {
    width: 400
  }).render(true);
}

/**
 * Add Crimson Rite button to weapon item sheet
 * @param {jQuery} html - The item sheet HTML
 * @param {Item} item - The weapon item
 */
export function addRiteButtonToSheet(html, item) {
  const activeRite = getActiveRite(item);

  // Find a good place to insert the button (after item description or properties)
  const insertPoint = html.find('.item-properties, .tab[data-tab="description"]').last();
  if (insertPoint.length === 0) return;

  let buttonHtml = '';

  if (activeRite) {
    const riteFlag = item.getFlag(MODULE_ID, 'crimsonRite');
    const riteType = riteFlag?.riteType;
    const riteDamage = riteFlag?.riteDamage;
    const damageType = riteFlag?.damageType;

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
    await activateDialog(item.actor);
  });
}
