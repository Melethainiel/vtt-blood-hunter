/**
 * Feature Sync Utility
 * Syncs Blood Hunter features from DDB imports with enhanced compendium versions
 */

export class FeatureSync {
  static MODULE_ID = 'vtt-blood-hunter';
  static COMPENDIUM_ID = 'vtt-blood-hunter.blood-hunter-features';

  /**
   * Sync Blood Hunter features for an actor
   * Replaces existing features with compendium versions based on identifier matching
   * @param {Actor} actor - The actor to sync features for
   * @returns {Promise<Object>} Result object with counts of synced/failed features
   */
  static async syncFeatures(actor) {
    if (!actor) {
      ui.notifications.error('No actor provided for feature sync');
      return { synced: 0, failed: 0, skipped: 0 };
    }

    // Get the compendium pack
    const pack = game.packs.get(this.COMPENDIUM_ID);
    if (!pack) {
      ui.notifications.error(
        game.i18n.format('BLOODHUNTER.FeatureSync.CompendiumNotFound', {
          compendium: this.COMPENDIUM_ID
        })
      );
      return { synced: 0, failed: 0, skipped: 0 };
    }

    // Detect the Blood Hunter class advancement origin ID
    const advancementOrigin = this._detectBloodHunterOrigin(actor);
    if (advancementOrigin) {
      console.log(`Blood Hunter | Detected advancement origin: ${advancementOrigin}`);
    } else {
      console.warn('Blood Hunter | Could not detect Blood Hunter class advancement origin');
    }

    // Load the compendium documents
    const documents = await pack.getDocuments();
    console.log(`Blood Hunter | Loaded ${documents.length} features from compendium for sync`);

    // Prepare sync plan (dry run to match features)
    const syncPlan = await this._prepareSyncPlan(actor, documents);

    // Check if any features with identifiers were found
    if (syncPlan.total === 0) {
      ui.notifications.warn(
        game.i18n.localize('BLOODHUNTER.FeatureSync.NoFeaturesFound')
      );
      return { synced: 0, failed: 0, skipped: 0 };
    }

    // Check if any features have compendium matches
    if (syncPlan.matched.length === 0) {
      ui.notifications.info(
        game.i18n.format('BLOODHUNTER.FeatureSync.NoMatchingFeatures', {
          name: actor.name,
          count: syncPlan.total
        })
      );
      return { synced: 0, failed: 0, skipped: syncPlan.total };
    }

    // Show confirmation dialog with preview
    const proceed = await this._confirmSync(actor, syncPlan);
    if (!proceed) {
      return { synced: 0, failed: 0, skipped: 0 };
    }

    // Track results
    const results = {
      synced: 0,
      failed: 0,
      skipped: syncPlan.unmatched.length,
      duplicatesRemoved: 0,
      alreadySynced: syncPlan.alreadySynced?.length || 0
    };

    // First, remove duplicates if any
    if (syncPlan.duplicates && syncPlan.duplicates.length > 0) {
      console.log(`Blood Hunter | Removing ${syncPlan.duplicates.length} duplicate features`);
      for (const duplicate of syncPlan.duplicates) {
        try {
          await actor.deleteEmbeddedDocuments('Item', [duplicate.id]);
          console.log(`Blood Hunter | Removed duplicate: ${duplicate.name} (${duplicate.system.identifier})`);
          results.duplicatesRemoved++;
        } catch (error) {
          console.error(`Blood Hunter | Failed to remove duplicate ${duplicate.name}:`, error);
        }
      }
    }

    // Process each matched feature
    console.log(`Blood Hunter | Starting sync execution for ${syncPlan.matched.length} matched features`);
    for (const match of syncPlan.matched) {
      const { actor: actorFeature, compendium: compendiumFeature } = match;

      try {
        console.log(`Blood Hunter | Processing: "${actorFeature.name}" (ID: ${actorFeature.id}) → "${compendiumFeature.name}" (Compendium ID: ${compendiumFeature.id})`);

        // Delete the old feature (proper embedded document deletion)
        await actor.deleteEmbeddedDocuments('Item', [actorFeature.id]);
        console.log(`Blood Hunter | Deleted actor feature: ${actorFeature.name} (${actorFeature.id})`);

        // Create the new feature from compendium
        const itemData = compendiumFeature.toObject();

        // Update advancementOrigin if we detected one
        if (advancementOrigin) {
          if (!itemData.flags) itemData.flags = {};
          if (!itemData.flags.dnd5e) itemData.flags.dnd5e = {};
          itemData.flags.dnd5e.advancementOrigin = advancementOrigin;
          console.log(`Blood Hunter | Setting advancementOrigin to ${advancementOrigin} for ${compendiumFeature.name}`);
        }

        const created = await actor.createEmbeddedDocuments('Item', [itemData]);
        console.log(`Blood Hunter | Created compendium feature: ${compendiumFeature.name} (New ID: ${created[0].id})`);

        console.log(`Blood Hunter | Synced feature: ${actorFeature.name} → ${compendiumFeature.name}`);
        results.synced++;
      } catch (error) {
        console.error(`Blood Hunter | Failed to sync ${actorFeature.name}:`, error);
        results.failed++;
      }
    }
    console.log(`Blood Hunter | Sync execution complete: ${results.synced} synced, ${results.failed} failed, ${results.skipped} skipped`);

    // Update Blood Maledict max uses if feature was synced
    const BloodCurse = (await import('./blood-curse.js')).BloodCurse;
    const updated = await BloodCurse.updateBloodMaledictMaxUses(actor);
    if (updated) {
      console.log('Blood Hunter | Updated Blood Maledict max uses after sync');
    }

    // Show results notification
    this._showSyncResults(actor, results);

    return results;
  }

  /**
   * Detect the Blood Hunter class advancement origin ID from the actor
   * This is used to properly link features to their parent class
   * @param {Actor} actor - The actor to check
   * @returns {string|null} The advancement origin ID or null if not found
   * @private
   */
  static _detectBloodHunterOrigin(actor) {
    // Look for any Blood Hunter feature with an advancementOrigin
    const bloodHunterFeature = actor.items.find(item => {
      // Check if it's a Blood Hunter class feature with advancementOrigin set
      return item.type === 'feat' &&
        item.system?.type?.subtype === 'bloodHunter' &&
        item.flags?.dnd5e?.advancementOrigin;
    });

    if (bloodHunterFeature) {
      return bloodHunterFeature.flags.dnd5e.advancementOrigin;
    }

    // Fallback: look for the Blood Hunter class itself
    const bloodHunterClass = actor.items.find(item =>
      item.type === 'class' &&
      (item.name.toLowerCase().includes('blood hunter') ||
       item.system?.identifier === 'blood-hunter')
    );

    if (bloodHunterClass) {
      return bloodHunterClass.id;
    }

    return null;
  }

  /**
   * Prepare a sync plan by analyzing features and matching with compendium
   * @param {Actor} actor - The actor to analyze
   * @param {Array<Item>} documents - The compendium documents
   * @returns {Promise<Object>} Sync plan with matched and unmatched features
   * @private
   */
  static async _prepareSyncPlan(actor, documents) {
    // Find all features with identifiers (no subtype filter - more flexible)
    const candidateFeatures = actor.items.filter(item =>
      item.type === 'feat' &&
      item.system?.identifier
    );

    const matched = [];
    const unmatched = [];
    const alreadySynced = []; // Track features already synced from compendium
    const usedCompendiumIdentifiers = new Set(); // Track which compendium features have been matched
    const usedActorIdentifiers = new Set(); // Track which actor identifiers have been matched to avoid duplicates

    // Dry run: check each feature against compendium
    for (const actorFeature of candidateFeatures) {
      const actorIdentifier = actorFeature.system.identifier;

      // Skip if we already matched this identifier (handles duplicate features from DDB)
      if (usedActorIdentifiers.has(actorIdentifier)) {
        console.log(`${this.MODULE_ID} | Skipping duplicate: "${actorFeature.name}" (${actorIdentifier}) - already matched`);
        // We'll handle deletion of duplicates in a separate pass
        continue;
      }

      // Try to find exact match first
      let compendiumFeature = documents.find(item =>
        item.system?.identifier === actorIdentifier &&
        !usedCompendiumIdentifiers.has(item.system?.identifier) // Ensure not already matched
      );

      // If no exact match, try flexible matching as fallback
      // This handles edge cases and backwards compatibility
      if (!compendiumFeature) {
        compendiumFeature = documents.find(item => {
          const compIdentifier = item.system?.identifier;
          if (!compIdentifier || usedCompendiumIdentifiers.has(compIdentifier)) return false;

          // Normalize both identifiers for comparison (remove "the" variations)
          const normalizedActor = actorIdentifier.replace(/-the-/g, '-');
          const normalizedComp = compIdentifier.replace(/-the-/g, '-');

          // Check if one contains the other (for partial matches)
          if (normalizedActor.includes(normalizedComp) || normalizedComp.includes(normalizedActor)) {
            console.log(`${this.MODULE_ID} | Flexible match: "${actorIdentifier}" → "${compIdentifier}"`);
            return true;
          }

          return false;
        });
      }

      if (compendiumFeature) {
        // Check if this feature is already up-to-date with the compendium version
        // Compare the feature data to see if they're identical (already synced)
        if (this._areFeaturesSame(actorFeature, compendiumFeature)) {
          console.log(`${this.MODULE_ID} | Already synced: "${actorFeature.name}" (${actorIdentifier}) - skipping`);
          alreadySynced.push(actorFeature);
          usedActorIdentifiers.add(actorIdentifier); // Mark as processed
          usedCompendiumIdentifiers.add(compendiumFeature.system.identifier);
          continue;
        }

        matched.push({
          actor: actorFeature,
          compendium: compendiumFeature
        });
        usedCompendiumIdentifiers.add(compendiumFeature.system.identifier); // Mark this compendium feature as used
        usedActorIdentifiers.add(actorIdentifier); // Mark this actor identifier as matched
        console.log(`${this.MODULE_ID} | Matched: "${actorFeature.name}" (${actorIdentifier}) → "${compendiumFeature.name}" (${compendiumFeature.system.identifier})`);
      } else {
        unmatched.push(actorFeature);
        console.log(`${this.MODULE_ID} | No match for: "${actorFeature.name}" (${actorIdentifier})`);
      }
    }

    // Find duplicates: features with the same identifier that weren't matched
    const duplicates = candidateFeatures.filter(item =>
      usedActorIdentifiers.has(item.system.identifier) &&
      !matched.some(m => m.actor.id === item.id) &&
      !alreadySynced.some(s => s.id === item.id)
    );

    return { matched, unmatched, duplicates, alreadySynced, total: candidateFeatures.length };
  }

  /**
   * Compare two features to see if they're the same (already synced)
   * @param {Item} actorFeature - The feature on the actor
   * @param {Item} compendiumFeature - The feature from compendium
   * @returns {boolean} True if features are the same
   * @private
   */
  static _areFeaturesSame(actorFeature, compendiumFeature) {
    // Check if the actor feature has the Blood Hunter flag indicating it came from compendium
    const hasCompendiumFlag = actorFeature.flags?.[this.MODULE_ID];

    // Compare key properties that would indicate the feature needs updating
    const sameIdentifier = actorFeature.system?.identifier === compendiumFeature.system?.identifier;
    const sameName = actorFeature.name === compendiumFeature.name;

    // If it has compendium flags and matches identifier/name, consider it synced
    return hasCompendiumFlag && sameIdentifier && sameName;
  }

  /**
   * Show confirmation dialog before syncing with preview of matched/unmatched features
   * @param {Actor} actor - The actor to sync
   * @param {Object} syncPlan - Sync plan with matched and unmatched features
   * @returns {Promise<boolean>} True if user confirms
   * @private
   */
  static async _confirmSync(actor, syncPlan) {
    const { matched, unmatched, duplicates, alreadySynced } = syncPlan;

    // Build matched features list (will be synced)
    const matchedList = matched.length > 0
      ? matched.map(m => `<span style="color: #4CAF50;">✓</span> ${m.actor.name} → ${m.compendium.name}`).join('<br>')
      : `<em style="color: #888;">${game.i18n.localize('BLOODHUNTER.FeatureSync.NoMatched')}</em>`;

    // Build unmatched features list (will be skipped)
    const unmatchedList = unmatched.length > 0
      ? unmatched.map(f => `<span style="color: #888;">○</span> ${f.name}`).join('<br>')
      : `<em style="color: #888;">${game.i18n.localize('BLOODHUNTER.FeatureSync.NoUnmatched')}</em>`;

    // Build duplicates list (will be removed)
    const duplicatesList = duplicates && duplicates.length > 0
      ? duplicates.map(f => `<span style="color: #ff6400;">✗</span> ${f.name} (${f.system.identifier})`).join('<br>')
      : null;

    // Build already synced list (no action needed)
    const alreadySyncedList = alreadySynced && alreadySynced.length > 0
      ? alreadySynced.map(f => `<span style="color: #2196F3;">●</span> ${f.name}`).join('<br>')
      : null;

    return Dialog.confirm({
      title: game.i18n.localize('BLOODHUNTER.FeatureSync.ConfirmTitle'),
      content: `
        <p>${game.i18n.format('BLOODHUNTER.FeatureSync.ConfirmMessage', {
    name: actor.name,
    count: matched.length
  })}</p>
        
        <div style="margin: 1em 0;">
          <h3 style="margin: 0.5em 0; font-size: 1.1em; border-bottom: 2px solid #4CAF50;">
            ${game.i18n.localize('BLOODHUNTER.FeatureSync.WillSync')} (${matched.length})
          </h3>
          <div style="max-height: 150px; overflow-y: auto; padding: 0.5em; background: rgba(76, 175, 80, 0.1); border-radius: 3px; font-size: 0.9em;">
            ${matchedList}
          </div>
        </div>

        ${unmatched.length > 0 ? `
        <div style="margin: 1em 0;">
          <h3 style="margin: 0.5em 0; font-size: 1.1em; border-bottom: 2px solid #888;">
            ${game.i18n.localize('BLOODHUNTER.FeatureSync.WillSkip')} (${unmatched.length})
          </h3>
          <div style="max-height: 100px; overflow-y: auto; padding: 0.5em; background: rgba(0,0,0,0.1); border-radius: 3px; font-size: 0.9em;">
            ${unmatchedList}
          </div>
        </div>
        ` : ''}

        ${duplicatesList ? `
        <div style="margin: 1em 0;">
          <h3 style="margin: 0.5em 0; font-size: 1.1em; border-bottom: 2px solid #ff6400;">
            Duplicates (Will be Removed) (${duplicates.length})
          </h3>
          <div style="max-height: 100px; overflow-y: auto; padding: 0.5em; background: rgba(255, 100, 0, 0.1); border-radius: 3px; font-size: 0.9em;">
            ${duplicatesList}
          </div>
        </div>
        ` : ''}

        ${alreadySyncedList ? `
        <div style="margin: 1em 0;">
          <h3 style="margin: 0.5em 0; font-size: 1.1em; border-bottom: 2px solid #2196F3;">
            Already Up-to-Date (${alreadySynced.length})
          </h3>
          <div style="max-height: 100px; overflow-y: auto; padding: 0.5em; background: rgba(33, 150, 243, 0.1); border-radius: 3px; font-size: 0.9em;">
            ${alreadySyncedList}
          </div>
        </div>
        ` : ''}

        <p style="color: #ff6400; font-weight: bold; margin-top: 1em;">
          ${game.i18n.localize('BLOODHUNTER.FeatureSync.ConfirmWarning')}
        </p>
      `,
      yes: () => true,
      no: () => false,
      defaultYes: false
    });
  }

  /**
   * Show sync results notification
   * @param {Actor} actor - The actor that was synced
   * @param {Object} results - Sync results
   * @private
   */
  static _showSyncResults(actor, results) {
    const { synced, failed, skipped, duplicatesRemoved, alreadySynced } = results;

    // Build message parts
    const messageParts = [];

    if (synced > 0) {
      messageParts.push(`${synced} synced`);
    }
    if (duplicatesRemoved > 0) {
      messageParts.push(`${duplicatesRemoved} duplicates removed`);
    }
    if (alreadySynced > 0) {
      messageParts.push(`${alreadySynced} already up-to-date`);
    }
    if (skipped > 0) {
      messageParts.push(`${skipped} skipped`);
    }
    if (failed > 0) {
      messageParts.push(`${failed} failed`);
    }

    const message = `${actor.name}: ${messageParts.join(', ')}`;

    // If everything was already synced and nothing to do
    if (synced === 0 && failed === 0 && duplicatesRemoved === 0 && alreadySynced > 0 && skipped === 0) {
      ui.notifications.info(`${actor.name}: All features are already up-to-date!`);
    } else if (synced === 0 && failed === 0 && duplicatesRemoved === 0 && skipped > 0) {
      ui.notifications.info(
        game.i18n.format('BLOODHUNTER.FeatureSync.NoMatchingFeatures', {
          name: actor.name,
          count: skipped
        })
      );
    } else if (failed === 0) {
      ui.notifications.info(message);
    } else if (failed > 0 && synced > 0) {
      ui.notifications.warn(message);
    } else {
      ui.notifications.error(message);
    }
  }
}
