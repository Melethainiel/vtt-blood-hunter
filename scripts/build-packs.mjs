import { compilePack } from '@foundryvtt/foundryvtt-cli';
import { readdirSync, existsSync } from 'fs';

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
  const sourcePath = `./packData/${pack}`;
  
  // Check if directory exists and has JSON files
  if (!existsSync(sourcePath)) {
    console.log(`⏭️  Skipping ${pack}: source directory does not exist\n`);
    continue;
  }
  
  const files = readdirSync(sourcePath);
  const hasJsonFiles = files.some(f => f.endsWith('.json'));
  
  if (!hasJsonFiles) {
    console.log(`⏭️  Skipping ${pack}: no JSON source files found\n`);
    continue;
  }

  try {
    console.log(`📦 Compiling: ${pack}`);
    await compilePack(
      sourcePath,
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
