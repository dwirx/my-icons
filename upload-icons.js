#!/usr/bin/env node

/**
 * Icon Upload Helper Script
 * 
 * This script helps you organize and upload icons to your GitHub repository.
 * It provides utilities for:
 * - Validating icon files
 * - Generating CDN URLs
 * - Creating organized folder structures
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    repository: 'dwirx/my-icons',
    branch: 'main',
    baseUrl: 'https://cdn.jsdelivr.net/gh',
    categories: ['social', 'ui', 'brands', 'flags', 'custom'],
    supportedFormats: ['.svg', '.png', '.ico', '.webp'],
    maxFileSize: 50 * 1024 * 1024 // 50MB
};

/**
 * Generate CDN URL for an icon
 */
function generateCdnUrl(category, filename) {
    return `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/${category}/${filename}`;
}

/**
 * Validate icon file
 */
function validateIcon(filePath) {
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    if (!CONFIG.supportedFormats.includes(ext)) {
        throw new Error(`Unsupported format: ${ext}. Supported: ${CONFIG.supportedFormats.join(', ')}`);
    }
    
    if (stats.size > CONFIG.maxFileSize) {
        throw new Error(`File too large: ${(stats.size / (1024 * 1024)).toFixed(2)}MB. Max: ${CONFIG.maxFileSize / (1024 * 1024)}MB`);
    }
    
    return true;
}

/**
 * Generate usage examples for an icon
 */
function generateUsageExamples(category, filename) {
    const cdnUrl = generateCdnUrl(category, filename);
    const ext = path.extname(filename).toLowerCase();
    
    let examples = `\n## Usage Examples for ${filename}\n\n`;
    examples += `**CDN URL:** \`${cdnUrl}\`\n\n`;
    
    if (ext === '.svg') {
        examples += `### HTML\n`;
        examples += `\`\`\`html\n`;
        examples += `<img src="${cdnUrl}" alt="${path.parse(filename).name}">\n`;
        examples += `\`\`\`\n\n`;
        
        examples += `### CSS\n`;
        examples += `\`\`\`css\n`;
        examples += `.icon {\n`;
        examples += `    background-image: url('${cdnUrl}');\n`;
        examples += `    background-size: contain;\n`;
        examples += `    background-repeat: no-repeat;\n`;
        examples += `}\n`;
        examples += `\`\`\`\n\n`;
    } else {
        examples += `### HTML\n`;
        examples += `\`\`\`html\n`;
        examples += `<img src="${cdnUrl}" alt="${path.parse(filename).name}">\n`;
        examples += `\`\`\`\n\n`;
    }
    
    return examples;
}

/**
 * Create folder structure if it doesn't exist
 */
function ensureFolderStructure() {
    CONFIG.categories.forEach(category => {
        const folderPath = path.join('icons', category);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log(`✅ Created folder: ${folderPath}`);
        }
    });
}

/**
 * List all icons in the repository
 */
function listIcons() {
    console.log('\n📁 Current Icons in Repository:\n');
    
    CONFIG.categories.forEach(category => {
        const folderPath = path.join('icons', category);
        if (fs.existsSync(folderPath)) {
            const files = fs.readdirSync(folderPath)
                .filter(file => !file.startsWith('.') && CONFIG.supportedFormats.includes(path.extname(file).toLowerCase()));
            
            if (files.length > 0) {
                console.log(`\n${category.toUpperCase()} (${files.length} icons):`);
                files.forEach(file => {
                    const cdnUrl = generateCdnUrl(category, file);
                    console.log(`  📄 ${file} → ${cdnUrl}`);
                });
            }
        }
    });
}

/**
 * Main CLI interface
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    
    switch (command) {
        case 'init':
            ensureFolderStructure();
            console.log('\n🎉 Repository structure initialized!');
            console.log('\nNext steps:');
            console.log('1. Add your icons to the appropriate category folders');
            console.log('2. Commit and push to GitHub');
            console.log('3. Access via jsDelivr CDN');
            break;
            
        case 'list':
            listIcons();
            break;
            
        case 'url':
            if (args.length < 3) {
                console.log('Usage: node upload-icons.js url <category> <filename>');
                process.exit(1);
            }
            const category = args[1];
            const filename = args[2];
            console.log(`\n🔗 CDN URL: ${generateCdnUrl(category, filename)}`);
            break;
            
        case 'validate':
            if (args.length < 2) {
                console.log('Usage: node upload-icons.js validate <filepath>');
                process.exit(1);
            }
            const filePath = args[1];
            try {
                validateIcon(filePath);
                console.log(`✅ ${filePath} is valid`);
            } catch (error) {
                console.error(`❌ ${error.message}`);
                process.exit(1);
            }
            break;
            
        case 'examples':
            if (args.length < 3) {
                console.log('Usage: node upload-icons.js examples <category> <filename>');
                process.exit(1);
            }
            const cat = args[1];
            const file = args[2];
            console.log(generateUsageExamples(cat, file));
            break;
            
        default:
            console.log(`
🎨 Icon Upload Helper Script

Usage:
  node upload-icons.js <command> [options]

Commands:
  init                    Initialize folder structure
  list                    List all current icons
  url <category> <file>   Generate CDN URL for an icon
  validate <filepath>     Validate an icon file
  examples <cat> <file>   Generate usage examples

Examples:
  node upload-icons.js init
  node upload-icons.js list
  node upload-icons.js url social github.svg
  node upload-icons.js validate icons/social/github.svg
  node upload-icons.js examples social github.svg

Configuration:
  Repository: ${CONFIG.repository}
  Branch: ${CONFIG.branch}
  Supported formats: ${CONFIG.supportedFormats.join(', ')}
  Max file size: ${CONFIG.maxFileSize / (1024 * 1024)}MB
            `);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    generateCdnUrl,
    validateIcon,
    generateUsageExamples,
    CONFIG
}; 