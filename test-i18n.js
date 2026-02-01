// Simple Node.js script to test i18n configuration
const fs = require('fs');

// Read the index.ts file to check imports
const indexPath = './web-app/src/i18n/index.ts';
const indexContent = fs.readFileSync(indexPath, 'utf8');

console.log('Checking i18n configuration...');
console.log('Index file imports:');
console.log(indexContent.substring(0, 500)); // First 500 characters

// Check if JSON files exist
const jsonFiles = [
  './web-app/src/i18n/es.json',
  './web-app/src/i18n/fr.json',
  './web-app/src/i18n/it.json'
];

jsonFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ Found: ${file}`);
  } else {
    console.log(`✗ Missing: ${file}`);
  }
});

console.log('\ni18n configuration validation completed.');