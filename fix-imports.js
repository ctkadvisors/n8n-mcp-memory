#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory to search for files
const directoryPath = path.join(process.cwd(), 'src/api/generated');

// Function to add .js extension to import paths
function fixImports(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    // Replace import paths without .js extension
    const fixedContent = content.replace(
      /from ['"]([^'"]*?)['"];/g,
      (match, importPath) => {
        // Skip node_modules imports and already fixed imports
        if (importPath.includes('node_modules') ||
            importPath.startsWith('@') ||
            importPath.endsWith('.js')) {
          return match;
        }
        return `from '${importPath}.js';`;
      }
    );

    // Write the fixed content back to the file
    if (content !== fixedContent) {
      fs.writeFileSync(filePath, fixedContent, 'utf8');
      console.log(`Fixed imports in ${filePath}`);
    }
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
  }
}

// Function to recursively process all files in a directory
function processDirectory(directoryPath) {
  const files = fs.readdirSync(directoryPath);

  for (const file of files) {
    const filePath = path.join(directoryPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      processDirectory(filePath);
    } else if (stats.isFile() && (file.endsWith('.ts') || file.endsWith('.js'))) {
      fixImports(filePath);
    }
  }
}

// Start processing
console.log('Fixing import paths...');
processDirectory(directoryPath);
console.log('Done!');
