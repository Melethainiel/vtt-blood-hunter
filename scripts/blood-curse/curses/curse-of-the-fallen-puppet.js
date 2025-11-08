/**
 * Blood Curse of the Fallen Puppet implementation
 */

import { BloodHunterUtils } from '../../utils.js';
import { MODULE_ID } from '../../blood-hunter.js';

/**
 * Execute Blood Curse of the Fallen Puppet
 * @param {Actor} actor - The Blood Hunter actor
 * @param {Actor} fallenCreature - The creature that fell to 0 HP
 * @param {boolean} amplify - Whether amplified
 */
export async function executeCurseOfTheFallenPuppet(actor, fallenCreature, amplify) {
  if (!fallenCreature) {
    ui.notifications.warn('No fallen creature to control');
    return;
  }

  // Get the hemocraft die for amplified bonus
  const hemocraftDie = amplify ? BloodHunterUtils.getHemocraftDie(actor, 'blood-maledict') : null;

  // Get available weapons from the fallen creature
  const weapons = fallenCreature.items.filter(i =>
    i.type === 'weapon' && i.system.equipped
  );

  if (weapons.length === 0) {
    ui.notifications.warn(game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.NoWeapons'));
    return;
  }

  // Build weapon options
  let weaponOptions = '';
  for (const weapon of weapons) {
    weaponOptions += `<option value="${weapon.id}">${weapon.name}</option>`;
  }

  // Get all potential targets in range
  const tokens = canvas.tokens.placeables.filter(t =>
    t.actor && t.actor.id !== fallenCreature.id
  );

  let targetOptions = '';
  for (const token of tokens) {
    targetOptions += `<option value="${token.id}">${token.name}</option>`;
  }

  // Create dialog for choosing weapon and target
  const content = `
    <form class="bloodhunter-fallen-puppet">
      <p>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Description')}</p>
      ${amplify ? `<p><strong>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Amplified')}</strong> +${hemocraftDie} ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.ToAttack')}</p>` : ''}
      <div class="form-group">
        <label>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.SelectWeapon')}:</label>
        <select name="weapon" id="puppet-weapon">
          ${weaponOptions}
        </select>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.SelectTarget')}:</label>
        <select name="target" id="puppet-target">
          ${targetOptions}
        </select>
      </div>
    </form>
  `;

  return new Promise((resolve) => {
    new Dialog({
      title: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Title'),
      content: content,
      buttons: {
        attack: {
          icon: '<i class="fas fa-crosshairs"></i>',
          label: game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Attack'),
          callback: async(html) => {
            const weaponId = html.find('[name="weapon"]').val();
            const targetId = html.find('[name="target"]').val();

            const weapon = fallenCreature.items.get(weaponId);
            const targetToken = canvas.tokens.get(targetId);

            if (!weapon || !targetToken) {
              ui.notifications.error('Invalid weapon or target selection');
              resolve(false);
              return;
            }

            // If amplified, move the creature first
            if (amplify) {
              const fallenToken = canvas.tokens.placeables.find(t => t.actor?.id === fallenCreature.id);
              if (fallenToken) {
                const speed = fallenCreature.system.attributes.movement?.walk || 30;
                const halfSpeed = Math.floor(speed / 2);
                ui.notifications.info(
                  game.i18n.format('BLOODHUNTER.BloodCurse.FallenPuppet.CanMove', {
                    distance: halfSpeed
                  })
                );
              }
            }

            // Create chat message describing the puppet attack
            const messageContent = `
              <div class="bloodhunter-puppet-attack">
                <h3>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Title')}</h3>
                <p><strong>${fallenCreature.name}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.Attacks')} <strong>${targetToken.name}</strong> ${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.With')} ${weapon.name}</p>
                ${amplify ? `<p><em>${game.i18n.localize('BLOODHUNTER.BloodCurse.FallenPuppet.AmplifiedBonus')}: +${hemocraftDie}</em></p>` : ''}
              </div>
            `;

            await ChatMessage.create({
              speaker: ChatMessage.getSpeaker({ actor: actor }),
              content: messageContent,
              flags: {
                [MODULE_ID]: {
                  bloodCurse: true,
                  curseType: 'fallen_puppet',
                  amplified: amplify
                }
              }
            });

            // Trigger the weapon attack
            // Note: This would ideally trigger the actual weapon item's attack
            // For now, we create a notification
            ui.notifications.info(
              game.i18n.format('BLOODHUNTER.BloodCurse.FallenPuppet.RollAttack', {
                creature: fallenCreature.name,
                weapon: weapon.name,
                target: targetToken.name
              })
            );

            resolve(true);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('BLOODHUNTER.BloodCurse.Cancel'),
          callback: () => resolve(false)
        }
      },
      default: 'attack'
    }, {
      width: 400
    }).render(true);
  });
}
