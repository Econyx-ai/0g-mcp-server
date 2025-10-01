import fs from 'fs/promises';
import path from 'path';
import { fromProjectRoot, log } from '../utils/file-utils.js';

const DOCS_SOURCE = fromProjectRoot('lib/0g-docs/docs');
const DOCS_DEST = fromProjectRoot('.docs/raw');

async function copyDir(src: string, dest: string) {
  // Create destination directory
  await fs.mkdir(dest, { recursive: true });

  // Read source directory
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy directories
      await copyDir(srcPath, destPath);
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
      await fs.rm(DOCS_DEST, { recursive: true });
    } catch {
      // Ignore if directory doesn't exist
    }

    // Copy docs
    await copyDir(DOCS_SOURCE, DOCS_DEST);
    log('✅ 0g documentation files copied successfully');
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
