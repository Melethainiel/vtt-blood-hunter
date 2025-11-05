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

    // Load the compendium index
    await pack.getDocuments();

    // Find all Blood Hunter features on the actor
    const actorFeatures = actor.items.filter(item =>
      item.type === 'feat' &&
      item.system?.type?.subtype === 'bloodHunter' &&
      item.system?.identifier
    );

    if (actorFeatures.length === 0) {
      ui.notifications.warn(
        game.i18n.localize('BLOODHUNTER.FeatureSync.NoFeaturesFound')
      );
      return { synced: 0, failed: 0, skipped: 0 };
    }

    // Show confirmation dialog
    const proceed = await this._confirmSync(actor, actorFeatures);
    if (!proceed) {
      return { synced: 0, failed: 0, skipped: 0 };
    }

    // Track results
    const results = {
      synced: 0,
      failed: 0,
      skipped: 0
    };

    // Process each feature
    for (const actorFeature of actorFeatures) {
      const identifier = actorFeature.system.identifier;

      // Find matching compendium feature by identifier
      const compendiumFeature = pack.contents.find(item =>
        item.system?.identifier === identifier
      );

      if (!compendiumFeature) {
        console.log(`Blood Hunter | No compendium match for: ${actorFeature.name} (${identifier})`);
        results.skipped++;
        continue;
      }

      try {
        // Delete the old feature
        await actorFeature.delete();

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
   * Show confirmation dialog before syncing
   * @param {Actor} actor - The actor to sync
   * @param {Array} features - Features that will be synced
   * @returns {Promise<boolean>} True if user confirms
   * @private
   */
  static async _confirmSync(actor, features) {
    const featureList = features.map(f => `• ${f.name}`).join('\n');

    return Dialog.confirm({
      title: game.i18n.localize('BLOODHUNTER.FeatureSync.ConfirmTitle'),
      content: `
        <p>${game.i18n.format('BLOODHUNTER.FeatureSync.ConfirmMessage', {
    name: actor.name,
    count: features.length
  })}</p>
        <div style="max-height: 200px; overflow-y: auto; margin: 1em 0; padding: 0.5em; background: rgba(0,0,0,0.1); border-radius: 3px;">
          <pre style="margin: 0; font-size: 0.9em;">${featureList}</pre>
        </div>
        <p style="color: #ff6400; font-weight: bold;">
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
