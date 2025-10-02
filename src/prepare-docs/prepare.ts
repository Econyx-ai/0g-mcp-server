import fs from 'fs/promises';
import path from 'path';
import { fromProjectRoot, log } from '../utils/file-utils.js';

const DOCS_SOURCES = [
  {
    source: fromProjectRoot('lib/0g-docs/docs'),
    dest: fromProjectRoot('.docs/raw')
  },
  {
    source: fromProjectRoot('lib/0g-storage-node'),
    dest: fromProjectRoot('.docs/raw/storage-node')
  },
  {
    source: fromProjectRoot('lib/0g-storage-client'),
    dest: fromProjectRoot('.docs/raw/storage-client')
  },
  {
    source: fromProjectRoot('lib/0g-serving-broker'),
    dest: fromProjectRoot('.docs/raw/serving-broker')
  },
  {
    source: fromProjectRoot('lib/0g-serving-user-broker'),
    dest: fromProjectRoot('.docs/raw/serving-user-broker')
  }
];

async function copyDir(src: string, dest: string, skipDirs: string[] = []) {
  // Create destination directory
  await fs.mkdir(dest, { recursive: true });

  // Read source directory
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    // Skip certain directories
    if (entry.isDirectory() && skipDirs.includes(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy directories
      await copyDir(srcPath, destPath, skipDirs);
    } else if (entry.isFile() && (entry.name.endsWith('.mdx') || entry.name.endsWith('.md'))) {
      // Copy both mdx and md files
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export async function prepare() {
  try {
    log('Preparing 0g documentation...');

    // Clean up existing docs directory if it exists
    try {
      await fs.rm(fromProjectRoot('.docs/raw'), { recursive: true });
    } catch {
      // Ignore if directory doesn't exist
    }

    // Copy all documentation sources
    for (const { source, dest } of DOCS_SOURCES) {
      const sourceName = path.basename(source);
      log(`Copying ${sourceName}...`);

      // Skip common non-doc directories
      let skipDirs: string[] = [];
      if (sourceName === '0g-storage-node') {
        skipDirs = ['node', 'common', 'tests', 'scripts', 'run', '.github', '.git', 'version-meld', 'storage-contracts-abis', '.gitbook'];
      } else if (sourceName === '0g-storage-client') {
        skipDirs = ['cmd', 'common', 'contract', 'core', 'gateway', 'indexer', 'kv', 'node', 'transfer', '.github', '.git'];
      } else if (sourceName === '0g-serving-broker') {
        skipDirs = ['.github', '.git'];
      } else if (sourceName === '0g-serving-user-broker') {
        skipDirs = ['docs', 'lib.commonjs', 'lib.esm', 'cli.commonjs', 'types', 'binary', 'token.counter', '.github', '.git'];
      }

      await copyDir(source, dest, skipDirs);
      log(`✅ ${sourceName} files copied successfully`);
    }

    log('✅ All documentation files copied successfully');
  } catch (error) {
    console.error('❌ Failed to copy documentation files:', error);
    throw error;
  }
}

if (process.env.PREPARE === 'true') {
  try {
    await prepare();
  } catch (error) {
    console.error('Error preparing documentation:', error);
    process.exit(1);
  }
}
