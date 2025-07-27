const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const sharp = require('sharp');

class IconUploadHandler {
    constructor() {
        this.iconsDir = path.join(__dirname, 'icons');
        this.maxFileSize = 50 * 1024 * 1024; // 50MB
        this.supportedFormats = ['.svg', '.png', '.ico', '.webp'];
    }

    // Sanitize file name
    sanitizeFileName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
            .replace(/-+/g, '-')          // Replace multiple hyphens with single
            .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
    }

    // Sanitize folder name
    sanitizeFolderName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
            .replace(/-+/g, '-')          // Replace multiple hyphens with single
            .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
    }

    // Validate file
    validateFile(file) {
        const ext = path.extname(file.originalname).toLowerCase();
        
        if (!this.supportedFormats.includes(ext)) {
            throw new Error(`Unsupported format: ${ext}. Supported: ${this.supportedFormats.join(', ')}`);
        }
        
        if (file.size > this.maxFileSize) {
            throw new Error(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Max: ${this.maxFileSize / (1024 * 1024)}MB`);
        }
        
        return true;
    }

    // Create directory if it doesn't exist
    ensureDirectoryExists(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }

    // Save file to icons folder
    async saveFile(file, category, customFolder = null) {
        try {
            // Validate file
            this.validateFile(file);

            // Determine final category and file name
            const finalCategory = customFolder ? `custom/${this.sanitizeFolderName(customFolder)}` : category;
            const finalName = this.sanitizeFileName(path.parse(file.originalname).name);
            const fileExt = path.extname(file.originalname).toLowerCase();
            const fileName = finalName + fileExt;

            // Create directory path
            const categoryDir = path.join(this.iconsDir, finalCategory);
            this.ensureDirectoryExists(categoryDir);

            // Full file path
            const filePath = path.join(categoryDir, fileName);

            // Check if file already exists
            if (fs.existsSync(filePath)) {
                throw new Error(`File ${fileName} already exists in ${finalCategory}`);
            }

            // Save file
            await this.writeFile(file.path, filePath);

            // Create .gitkeep file if directory is empty
            this.createGitkeepIfNeeded(categoryDir);

            return {
                success: true,
                fileName: fileName,
                category: finalCategory,
                filePath: filePath,
                size: file.size,
                url: `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/${finalCategory}/${fileName}`
            };

        } catch (error) {
            throw error;
        }
    }

    // Save file from buffer (for direct file upload)
    async saveFileFromBuffer(fileBuffer, originalName, category, customFolder = null, compress = true) {
        try {
            // Create a temporary file object for validation
            const tempFile = {
                originalname: originalName,
                size: fileBuffer.length
            };

            // Validate file
            this.validateFile(tempFile);

            // Determine final category and file name
            const finalCategory = customFolder ? `custom/${this.sanitizeFolderName(customFolder)}` : category;
            const finalName = this.sanitizeFileName(path.parse(originalName).name);
            const fileExt = path.extname(originalName).toLowerCase();
            const fileName = finalName + fileExt;
            
            console.log(`Uploading file: ${originalName} -> ${fileName} to ${finalCategory}`);

            // Create directory path
            const categoryDir = path.join(this.iconsDir, finalCategory);
            this.ensureDirectoryExists(categoryDir);

            // Full file path
            const filePath = path.join(categoryDir, fileName);

            // Check if file already exists
            if (fs.existsSync(filePath)) {
                throw new Error(`File ${fileName} already exists in ${finalCategory}`);
            }

            let processedBuffer = fileBuffer;
            let originalSize = fileBuffer.length;

            // Compress image if it's a supported format and compression is enabled
            if (compress && this.isCompressibleFormat(fileExt)) {
                try {
                    processedBuffer = await this.compressImage(fileBuffer, fileExt);
                    console.log(`Compressed ${originalName}: ${this.formatFileSize(originalSize)} → ${this.formatFileSize(processedBuffer.length)}`);
                } catch (compressError) {
                    console.warn(`Compression failed for ${originalName}, using original:`, compressError.message);
                    processedBuffer = fileBuffer;
                }
            }

            // Save file directly from buffer
            fs.writeFileSync(filePath, processedBuffer);

            // Create .gitkeep file if directory is empty
            this.createGitkeepIfNeeded(categoryDir);

            return {
                success: true,
                fileName: fileName,
                category: finalCategory,
                filePath: filePath,
                originalSize: originalSize,
                compressedSize: processedBuffer.length,
                size: processedBuffer.length,
                url: `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/${finalCategory}/${fileName}`
            };

        } catch (error) {
            throw error;
        }
    }

    // Check if format is compressible
    isCompressibleFormat(ext) {
        return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext.toLowerCase());
    }

    // Compress image
    async compressImage(buffer, ext) {
        const extLower = ext.toLowerCase();
        
        try {
            let sharpInstance = sharp(buffer);
            
            // Apply compression based on format
            if (extLower === '.png') {
                return await sharpInstance
                    .png({ 
                        quality: 80,
                        compressionLevel: 9,
                        progressive: true
                    })
                    .toBuffer();
            } else if (extLower === '.jpg' || extLower === '.jpeg') {
                return await sharpInstance
                    .jpeg({ 
                        quality: 80,
                        progressive: true,
                        mozjpeg: true
                    })
                    .toBuffer();
            } else if (extLower === '.webp') {
                return await sharpInstance
                    .webp({ 
                        quality: 80,
                        effort: 6
                    })
                    .toBuffer();
            } else {
                // For other formats, return original buffer
                return buffer;
            }
        } catch (error) {
            console.error('Compression error:', error);
            return buffer; // Return original if compression fails
        }
    }

    // Write file to destination
    async writeFile(sourcePath, destPath) {
        return new Promise((resolve, reject) => {
            const readStream = fs.createReadStream(sourcePath);
            const writeStream = fs.createWriteStream(destPath);

            readStream.on('error', reject);
            writeStream.on('error', reject);
            writeStream.on('finish', resolve);

            readStream.pipe(writeStream);
        });
    }

    // Create .gitkeep file if directory is empty
    createGitkeepIfNeeded(dirPath) {
        const files = fs.readdirSync(dirPath);
        const hasFiles = files.some(file => !file.startsWith('.'));
        
        if (!hasFiles) {
            const gitkeepPath = path.join(dirPath, '.gitkeep');
            if (!fs.existsSync(gitkeepPath)) {
                fs.writeFileSync(gitkeepPath, '# This file ensures the folder is tracked by git\n');
            }
        }
    }

    // Delete file
    async deleteFile(fileName, category) {
        try {
            let filePath;
            
            // Handle custom folder structure
            if (category.startsWith('custom/')) {
                const customSubfolder = category.split('/')[1];
                filePath = path.join(this.iconsDir, 'custom', customSubfolder, fileName);
            } else {
                filePath = path.join(this.iconsDir, category, fileName);
            }
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`File ${fileName} not found in ${category}`);
            }

            // Delete file
            fs.unlinkSync(filePath);

            // Check if directory is empty and remove .gitkeep if needed
            const categoryDir = path.dirname(filePath);
            const files = fs.readdirSync(categoryDir);
            const hasFiles = files.some(file => !file.startsWith('.'));
            
            if (!hasFiles) {
                const gitkeepPath = path.join(categoryDir, '.gitkeep');
                if (fs.existsSync(gitkeepPath)) {
                    fs.unlinkSync(gitkeepPath);
                }
            }

            return {
                success: true,
                message: `File ${fileName} deleted successfully`
            };

        } catch (error) {
            throw error;
        }
    }

    // List all icons
    async listIcons() {
        const icons = [];
        
        try {
            const categories = fs.readdirSync(this.iconsDir);
            
            for (const category of categories) {
                const categoryPath = path.join(this.iconsDir, category);
                const stat = fs.statSync(categoryPath);
                
                if (stat.isDirectory()) {
                    if (category === 'custom') {
                        // Handle custom folder structure
                        const subItems = fs.readdirSync(categoryPath);
                        
                        for (const subItem of subItems) {
                            const subItemPath = path.join(categoryPath, subItem);
                            const subItemStat = fs.statSync(subItemPath);
                            
                            if (subItemStat.isDirectory()) {
                                const files = fs.readdirSync(subItemPath);
                                
                                for (const file of files) {
                                    if (!file.startsWith('.') && this.supportedFormats.includes(path.extname(file).toLowerCase())) {
                                        const filePath = path.join(subItemPath, file);
                                        const fileStat = fs.statSync(filePath);
                                        
                                        icons.push({
                                            name: file,
                                            category: `custom/${subItem}`,
                                            size: this.formatFileSize(fileStat.size),
                                            lastModified: fileStat.mtime.toISOString(),
                                            url: `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/custom/${subItem}/${file}`
                                        });
                                    }
                                }
                            }
                        }
                    } else {
                        // Handle regular categories
                        const files = fs.readdirSync(categoryPath);
                        
                        for (const file of files) {
                            if (!file.startsWith('.') && this.supportedFormats.includes(path.extname(file).toLowerCase())) {
                                const filePath = path.join(categoryPath, file);
                                const fileStat = fs.statSync(filePath);
                                
                                icons.push({
                                    name: file,
                                    category: category,
                                    size: this.formatFileSize(fileStat.size),
                                    lastModified: fileStat.mtime.toISOString(),
                                    url: `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/${category}/${file}`
                                });
                            }
                        }
                    }
                }
            }
            
            return icons;
            
        } catch (error) {
            console.error('Error listing icons:', error);
            return [];
        }
    }

    // Get all available categories (folders)
    async getCategories() {
        const categories = [];
        
        try {
            const items = fs.readdirSync(this.iconsDir);
            
            for (const item of items) {
                const itemPath = path.join(this.iconsDir, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    // Check if it's a custom folder (has subfolders)
                    const subItems = fs.readdirSync(itemPath);
                    const hasSubFolders = subItems.some(subItem => {
                        const subItemPath = path.join(itemPath, subItem);
                        return fs.statSync(subItemPath).isDirectory();
                    });
                    
                    if (item === 'custom' && hasSubFolders) {
                        // Add custom subfolders
                        for (const subItem of subItems) {
                            const subItemPath = path.join(itemPath, subItem);
                            if (fs.statSync(subItemPath).isDirectory()) {
                                categories.push(`custom/${subItem}`);
                            }
                        }
                    } else if (item !== 'custom') {
                        // Add main categories
                        categories.push(item);
                    }
                }
            }
            
            return categories;
            
        } catch (error) {
            console.error('Error getting categories:', error);
            return [];
        }
    }

    // Get folder structure
    async getFolderStructure() {
        const structure = {};
        
        try {
            const items = fs.readdirSync(this.iconsDir);
            
            for (const item of items) {
                const itemPath = path.join(this.iconsDir, item);
                const stat = fs.statSync(itemPath);
                
                if (stat.isDirectory()) {
                    if (item === 'custom') {
                        // Handle custom folder structure
                        const subItems = fs.readdirSync(itemPath);
                        structure[item] = {};
                        
                        for (const subItem of subItems) {
                            const subItemPath = path.join(itemPath, subItem);
                            if (fs.statSync(subItemPath).isDirectory()) {
                                const files = fs.readdirSync(subItemPath)
                                    .filter(file => !file.startsWith('.') && this.supportedFormats.includes(path.extname(file).toLowerCase()));
                                structure[item][subItem] = files;
                            }
                        }
                    } else {
                        // Handle main categories
                        const files = fs.readdirSync(itemPath)
                            .filter(file => !file.startsWith('.') && this.supportedFormats.includes(path.extname(file).toLowerCase()));
                        structure[item] = files;
                    }
                }
            }
            
            return structure;
            
        } catch (error) {
            console.error('Error getting folder structure:', error);
            return {};
        }
    }

    // Format file size
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Commit and push to Git
    async commitAndPush(commitMessage) {
        return new Promise((resolve, reject) => {
            const commands = [
                'git add .',
                `git commit -m "${commitMessage}"`,
                'git push origin main'
            ];

            let currentCommand = 0;

            const executeCommand = () => {
                if (currentCommand >= commands.length) {
                    resolve();
                    return;
                }

                exec(commands[currentCommand], { cwd: __dirname }, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error executing: ${commands[currentCommand]}`, error);
                        reject(error);
                        return;
                    }

                    console.log(`Executed: ${commands[currentCommand]}`);
                    currentCommand++;
                    executeCommand();
                });
            };

            executeCommand();
        });
    }

    // Get file info
    async getFileInfo(fileName, category) {
        try {
            const filePath = path.join(this.iconsDir, category, fileName);
            
            if (!fs.existsSync(filePath)) {
                throw new Error(`File ${fileName} not found in ${category}`);
            }

            const stat = fs.statSync(filePath);
            
            return {
                name: fileName,
                category: category,
                size: this.formatFileSize(stat.size),
                lastModified: stat.mtime.toISOString(),
                url: `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/${category}/${fileName}`
            };

        } catch (error) {
            throw error;
        }
    }
}

module.exports = IconUploadHandler; 