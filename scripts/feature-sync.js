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
      skipped: syncPlan.unmatched.length
    };

    // Process each matched feature
    for (const match of syncPlan.matched) {
      const { actor: actorFeature, compendium: compendiumFeature } = match;

      try {
        // Delete the old feature (proper embedded document deletion)
        await actor.deleteEmbeddedDocuments('Item', [actorFeature.id]);

        // Create the new feature from compendium
        const itemData = compendiumFeature.toObject();
        await actor.createEmbeddedDocuments('Item', [itemData]);

        console.log(`Blood Hunter | Synced feature: ${actorFeature.name} → ${compendiumFeature.name}`);
        results.synced++;
      } catch (error) {
        console.error(`Blood Hunter | Failed to sync ${actorFeature.name}:`, error);
        results.failed++;
      }
    }

    // Show results notification
    this._showSyncResults(actor, results);

    return results;
  }

  /**
   * Prepare a sync plan by analyzing features and matching with compendium
   * @param {Actor} actor - The actor to analyze
   * @param {Array} documents - The compendium documents
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

    // Dry run: check each feature against compendium
    for (const actorFeature of candidateFeatures) {
      const identifier = actorFeature.system.identifier;
      const compendiumFeature = documents.find(item =>
        item.system?.identifier === identifier
      );

      if (compendiumFeature) {
        matched.push({
          actor: actorFeature,
          compendium: compendiumFeature
        });
      } else {
        unmatched.push(actorFeature);
      }
    }

    return { matched, unmatched, total: candidateFeatures.length };
  }

  /**
   * Show confirmation dialog before syncing with preview of matched/unmatched features
   * @param {Actor} actor - The actor to sync
   * @param {Object} syncPlan - Sync plan with matched and unmatched features
   * @returns {Promise<boolean>} True if user confirms
   * @private
   */
  static async _confirmSync(actor, syncPlan) {
    const { matched, unmatched } = syncPlan;

    // Build matched features list (will be synced)
    const matchedList = matched.length > 0
      ? matched.map(m => `<span style="color: #4CAF50;">✓</span> ${m.actor.name} → ${m.compendium.name}`).join('<br>')
      : `<em style="color: #888;">${game.i18n.localize('BLOODHUNTER.FeatureSync.NoMatched')}</em>`;

    // Build unmatched features list (will be skipped)
    const unmatchedList = unmatched.length > 0
      ? unmatched.map(f => `<span style="color: #888;">○</span> ${f.name}`).join('<br>')
      : `<em style="color: #888;">${game.i18n.localize('BLOODHUNTER.FeatureSync.NoUnmatched')}</em>`;

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
    const { synced, failed, skipped } = results;

    if (synced === 0 && failed === 0 && skipped > 0) {
      ui.notifications.info(
        game.i18n.format('BLOODHUNTER.FeatureSync.NoMatchingFeatures', {
          name: actor.name,
          count: skipped
        })
      );
    } else if (synced > 0 && failed === 0) {
      ui.notifications.info(
        game.i18n.format('BLOODHUNTER.FeatureSync.Success', {
          name: actor.name,
          count: synced
        })
      );
    } else if (synced > 0 && failed > 0) {
      ui.notifications.warn(
        game.i18n.format('BLOODHUNTER.FeatureSync.PartialSuccess', {
          name: actor.name,
          synced: synced,
          failed: failed
        })
      );
    } else if (failed > 0) {
      ui.notifications.error(
        game.i18n.format('BLOODHUNTER.FeatureSync.Failed', {
          name: actor.name,
          count: failed
        })
      );
    }
  }
}
