/**
 * Blood Curse of the Anxious implementation
 */

/**
 * Execute Blood Curse of the Anxious
 * @param {Actor} actor - The Blood Hunter actor
 * @param {MidiQOL.Workflow} workflow - The workflow
 * @param {boolean} amplify - Whether amplified
 */
export async function executeCurseOfTheAnxious(actor, workflow, amplify) {
  // Impose disadvantage on ability check
  // This would require integration with the specific ability check workflow
  ui.notifications.info('Target has disadvantage on the ability check');

  if (amplify) {
    ui.notifications.info('Target also has disadvantage on next saving throw');
  }
}
