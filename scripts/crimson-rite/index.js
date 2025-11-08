/**
 * Crimson Rite functionality for Blood Hunter
 * Main facade providing backward-compatible API
 */

import { RITE_TYPES } from './constants.js';
import * as Detection from './rite-detection.js';
import * as Manager from './rite-manager.js';
import * as UI from './rite-ui.js';

export class CrimsonRite {
  // Constants
  static RITE_TYPES = RITE_TYPES;

  // Detection methods
  static rollHPCost = Detection.rollHPCost;
  static getKnownRitesFromFeatures = Detection.getKnownRitesFromFeatures;
  static getAvailableRites = Detection.getAvailableRites;

  // Manager methods
  static activate = Manager.activate;
  static deactivate = Manager.deactivate;
  static getActiveRite = Manager.getActiveRite;
  static removeAllActiveRites = Manager.removeAllActiveRites;

  // UI methods
  static activateDialog = UI.activateDialog;
  static addRiteButtonToSheet = UI.addRiteButtonToSheet;
}
