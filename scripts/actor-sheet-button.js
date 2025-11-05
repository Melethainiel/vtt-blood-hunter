/**
 * Actor Sheet Button Utility
 * Provides a reusable system for adding custom buttons to actor sheets
 * Compatible with both dnd5e v2 and v3, ApplicationV1 and ApplicationV2
 */

import { MODULE_ID } from './blood-hunter.js';

export class ActorSheetButton {
  /**
   * Add a custom button to an actor sheet
   * @param {Application} app - The actor sheet application
   * @param {jQuery} html - The actor sheet HTML
   * @param {Object} config - Button configuration
   * @param {string} config.id - Unique button ID
   * @param {string} config.icon - FontAwesome icon class (e.g., 'fa-sync')
   * @param {string} config.label - Button label (localization key or text)
   * @param {string} config.tooltip - Button tooltip (localization key or text)
   * @param {Function} config.onClick - Click handler (receives actor as parameter)
   * @param {Function} [config.isVisible] - Optional visibility check (receives actor, defaults to always visible)
   * @param {string} [config.cssClass] - Optional additional CSS class
   */
  static addButton(app, html, config) {
    const actor = app.object;

    // Check visibility condition
    if (config.isVisible && !config.isVisible(actor)) {
      return;
    }

    // Prevent duplicate buttons
    const existingButton = html.find(`#${config.id}`);
    if (existingButton.length > 0) {
      return;
    }

    // Get localized strings
    const label = game.i18n.localize(config.label);
    const tooltip = game.i18n.localize(config.tooltip);

    // Detect ApplicationV2 (Foundry v2 apps use native DOM)
    const isApplicationV2 = app.id && !app.appId;

    if (isApplicationV2) {
      this._addButtonV2(app, html, config, label, tooltip);
    } else {
      this._addButtonV1(app, html, config, label, tooltip);
    }
  }

  /**
   * Add button for ApplicationV1 (jQuery-based, dnd5e v2/v3)
   * @private
   */
  static _addButtonV1(app, html, config, label, tooltip) {
    const actor = app.object;

    // Try multiple selectors for maximum compatibility
    // dnd5e v3 uses .sheet-header-buttons
    // dnd5e v2 uses .header-actions
    let headerActions = html.find('.sheet-header .sheet-header-buttons');
    if (headerActions.length === 0) {
      headerActions = html.find('.sheet-header .header-actions');
    }
    if (headerActions.length === 0) {
      // Fallback: try to find any header area
      headerActions = html.find('.window-header');
    }
    if (headerActions.length === 0) {
      console.warn(`${MODULE_ID} | Could not find header area for button: ${config.id}`);
      return;
    }

    // Create button element
    const additionalClass = config.cssClass || '';
    const button = $(`
      <a id="${config.id}" class="bloodhunter-sheet-button ${additionalClass}" title="${tooltip}">
        <i class="fas ${config.icon}"></i>
        <span>${label}</span>
      </a>
    `);

    // Attach click handler
    button.on('click', (event) => {
      event.preventDefault();
      config.onClick(actor);
    });

    // Append to header
    headerActions.append(button);
  }

  /**
   * Add button for ApplicationV2 (native DOM, future-proof)
   * @private
   */
  static _addButtonV2(app, html, config, label, tooltip) {
    const actor = app.object;

    // Get the native element (not jQuery)
    const appElement = html[0] || html;

    // Find header controls area
    const header = appElement.querySelector('.window-header');
    if (!header) {
      console.warn(`${MODULE_ID} | Could not find window header for button: ${config.id}`);
      return;
    }

    // Try to find the close button to insert before it
    const closeButton = header.querySelector('[data-action="close"]');

    // Create button element (ApplicationV2 style)
    const button = document.createElement('button');
    button.id = config.id;
    button.className = `header-control icon bloodhunter-sheet-button ${config.cssClass || ''}`;
    button.type = 'button';
    button.innerHTML = `<i class="fas ${config.icon}"></i>`;
    button.setAttribute('data-tooltip', tooltip);
    button.setAttribute('aria-label', label);

    // Attach click handler
    button.addEventListener('click', (event) => {
      event.preventDefault();
      config.onClick(actor);
    });

    // Insert button
    if (closeButton && closeButton.parentNode) {
      closeButton.parentNode.insertBefore(button, closeButton);
    } else {
      header.appendChild(button);
    }
  }

  /**
   * Remove a button from an actor sheet
   * @param {jQuery} html - The actor sheet HTML
   * @param {string} buttonId - The button ID to remove
   */
  static removeButton(html, buttonId) {
    const button = html.find(`#${buttonId}`);
    if (button.length > 0) {
      button.remove();
    }
  }
}
