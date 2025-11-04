import { compilePack } from '@foundryvtt/foundryvtt-cli';

/**
 * Build script for compiling Foundry VTT compendium packs
 * This script compiles source JSON files from packData/ into LevelDB format in packs/
 */

const packs = [
  'blood-hunter-features',
  'blood-hunter-items'
];

console.log('🔨 Building compendium packs...\n');

for (const pack of packs) {
  try {
    console.log(`📦 Compiling: ${pack}`);
    await compilePack(
      `./packData/${pack}`,
      `./packs/${pack}`,
      { log: true }
    );
    console.log(`✅ Successfully compiled: ${pack}\n`);
  } catch (error) {
    console.error(`❌ Error compiling ${pack}:`, error);
    process.exit(1);
  }
}

console.log('✨ All packs compiled successfully!');
