/**
 * Actor Sheet Button Utility
 * Provides a reusable system for adding custom buttons to actor sheets
 * Compatible with both dnd5e v2 and v3, using getActorSheetHeaderButtons hook
 * Follows PopOut! module pattern for ApplicationV2 compatibility
 */

export class ActorSheetButton {
  // Static registry for button configurations
  static #buttonConfigs = [];

  /**
   * Register a button configuration
   * @param {Object} config - Button configuration
   * @param {string} config.id - Unique button ID
   * @param {string} config.icon - FontAwesome icon class (e.g., 'fa-sync')
   * @param {string} config.label - Button label (localization key or text)
   * @param {string} config.tooltip - Button tooltip (localization key or text)
   * @param {Function} config.onClick - Click handler (receives actor as parameter)
   * @param {Function} [config.isVisible] - Optional visibility check (receives actor, defaults to always visible)
   * @param {string} [config.cssClass] - Optional additional CSS class
   */
  static registerButton(config) {
    this.#buttonConfigs.push(config);
  }

  /**
   * Clear all registered buttons (useful for testing)
   */
  static clearButtons() {
    this.#buttonConfigs = [];
  }

  /**
   * Add buttons to actor sheet header (called by getActorSheetHeaderButtons hook)
   * @param {Application} app - The actor sheet application
   * @param {Array} buttons - Array of button configurations to modify
   * @param {Object} [data] - Optional render data passed by the hook
   */
  static addHeaderButtons(app, buttons, data) {
    const actor = data?.actor || app.object;
    if (!actor) return;

    // Add each registered button if visible
    for (const config of this.#buttonConfigs) {
      // Check visibility condition
      if (config.isVisible && !config.isVisible(actor)) {
        continue;
      }

      // Get localized strings
      const label = game.i18n.localize(config.label);

      // Create button object for header
      const buttonData = {
        label: label,
        class: `bloodhunter-header-button ${config.cssClass || ''}`,
        icon: `fas ${config.icon}`,
        onclick: () => config.onClick(actor)
      };

      buttons.unshift(buttonData);
    }
  }

  /**
   * Inject buttons into ApplicationV2 header (called by renderActorSheet hook)
   * This is needed because ApplicationV2 doesn't always respect header buttons from the hook
   * @param {Application} app - The actor sheet application
   * @param {HTMLElement} html - The actor sheet HTML element
   * @param {Object} [data] - Optional render data passed by the hook
   */
  static injectHeaderButtonsV2(app, html, data) {
    const actor = data?.actor || app.object;
    if (!actor) return;

    // Get the native element (handle both jQuery and native)
    const appElement = html;

    // For ApplicationV2, add to header controls area
    const header = appElement.querySelector('.window-header');
    const closeButton = header?.querySelector('[data-action="close"]');

    if (!closeButton) return;

    // Add each registered button if visible
    for (const config of this.#buttonConfigs) {
      // Check visibility condition
      if (config.isVisible && !config.isVisible(actor)) {
        continue;
      }

      // Prevent duplicate buttons
      if (header.querySelector(`#${config.id}`)) {
        continue;
      }

      // Get localized strings
      const tooltip = game.i18n.localize(config.tooltip);

      // Create header control button (always icon-only for ApplicationV2)
      const headerButton = document.createElement('button');
      headerButton.id = config.id;
      headerButton.className = `header-control icon bloodhunter-module-button ${config.cssClass || ''}`;
      headerButton.type = 'button';
      headerButton.innerHTML = `<i class="fas ${config.icon}"></i>`;
      headerButton.setAttribute('data-tooltip', tooltip);

      // Add click handler
      headerButton.addEventListener('click', () => config.onClick(actor));

      // Insert before close button
      closeButton.parentNode.insertBefore(headerButton, closeButton);
    }
  }
}
