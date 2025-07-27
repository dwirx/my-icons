// Configuration
const CONFIG = {
    repository: 'dwirx/my-icons',
    branch: 'main',
    baseUrl: 'https://cdn.jsdelivr.net/gh',
    localBaseUrl: '/icons',
    categories: ['social', 'ui', 'brands', 'flags', 'custom'],
    supportedFormats: ['.svg', '.png', '.ico', '.webp'],
    maxFileSize: 50 * 1024 * 1024 // 50MB
};

// Global variables
let icons = [];
let currentTab = 'gallery';
let useLocal = false; // Toggle between local and CDN

// DOM Elements
const elements = {
    navBtns: document.querySelectorAll('.nav-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    iconGrid: document.getElementById('iconGrid'),
    manageGrid: document.getElementById('manageGrid'),
    loading: document.getElementById('loading'),
    noIcons: document.getElementById('noIcons'),
    categoryFilter: document.getElementById('categoryFilter'),
    searchIcons: document.getElementById('searchIcons'),
    manageCategoryFilter: document.getElementById('manageCategoryFilter'),
    refreshIcons: document.getElementById('refreshIcons'),
    uploadForm: document.getElementById('uploadForm'),
    iconFile: document.getElementById('iconFile'),
    iconName: document.getElementById('iconName'),
    iconCategory: document.getElementById('iconCategory'),
    iconDescription: document.getElementById('iconDescription'),
    compressIcon: document.getElementById('compressIcon'),
    uploadPreview: document.getElementById('uploadPreview'),
    previewIcon: document.getElementById('previewIcon'),
    previewName: document.getElementById('previewName'),
    previewCategory: document.getElementById('previewCategory'),
    previewOriginalSize: document.getElementById('previewOriginalSize'),
    previewCompressedSize: document.getElementById('previewCompressedSize'),
    previewCompression: document.getElementById('previewCompression'),

    iconModal: document.getElementById('iconModal'),
    modalIcon: document.getElementById('modalIcon'),
    modalName: document.getElementById('modalName'),
    modalCategory: document.getElementById('modalCategory'),
    modalUrl: document.getElementById('modalUrl'),
    notification: document.getElementById('notification')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    loadIcons();
    initializeClipboard();
    setupCustomFolderInput();
}

// Setup custom folder input
function setupCustomFolderInput() {
    const categorySelect = document.getElementById('iconCategory');
    const customFolderContainer = document.createElement('div');
    customFolderContainer.className = 'form-group';
    customFolderContainer.id = 'customFolderContainer';
    customFolderContainer.style.display = 'none';
    
    customFolderContainer.innerHTML = `
        <label for="customFolder">Custom Folder Name:</label>
        <input type="text" id="customFolder" placeholder="e.g., tech, gaming, business" 
               pattern="[a-z0-9-]+" title="Only lowercase letters, numbers, and hyphens allowed">
        <small>Use lowercase letters, numbers, and hyphens only</small>
    `;
    
    categorySelect.parentNode.insertBefore(customFolderContainer, categorySelect.nextSibling);
    
    // Show/hide custom folder input based on selection
    categorySelect.addEventListener('change', function() {
        const customContainer = document.getElementById('customFolderContainer');
        const customInput = document.getElementById('customFolder');
        
        if (this.value === 'custom') {
            customContainer.style.display = 'block';
            customInput.required = true;
        } else {
            customContainer.style.display = 'none';
            customInput.required = false;
            customInput.value = '';
        }
    });
    
    // Add event listener for custom folder input
    const customInput = document.getElementById('customFolder');
    if (customInput) {
        customInput.addEventListener('input', function() {
            // Auto-sanitize the input
            this.value = this.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        });
    }
}

// Setup event listeners
function setupEventListeners() {
    // Navigation
    elements.navBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Gallery filters
    elements.categoryFilter.addEventListener('change', filterIcons);
    elements.searchIcons.addEventListener('input', filterIcons);

    // Manage filters
    elements.manageCategoryFilter.addEventListener('change', filterManageIcons);
    elements.refreshIcons.addEventListener('click', loadIcons);

    // Upload form
    elements.uploadForm.addEventListener('submit', handleUpload);
    elements.iconFile.addEventListener('change', handleFileSelect);
    elements.iconName.addEventListener('input', updateNamePreview);
    elements.iconCategory.addEventListener('change', updatePreviewFromInputs);
    elements.compressIcon.addEventListener('change', updatePreviewFromInputs);

    // Source toggle
    const sourceToggle = document.getElementById('sourceToggle');
    if (sourceToggle) {
        sourceToggle.addEventListener('change', handleSourceToggle);
    }

    // Modal
    const closeBtn = document.querySelector('.close');
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === elements.iconModal) {
            closeModal();
        }
    });
}

// Tab switching
function switchTab(tabName) {
    currentTab = tabName;
    
    // Update navigation
    elements.navBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update content
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
    
    // Load content based on tab
    if (tabName === 'gallery') {
        renderGallery();
    } else if (tabName === 'manage') {
        renderManage();
    }
}

// Load icons from repository
async function loadIcons() {
    showLoading(true);
    
    try {
        // Load icons from API
        const response = await fetch('/api/icons');
        const data = await response.json();
        
        if (data.success) {
            icons = data.icons;
        } else {
            // Fallback to mock data if API fails
            icons = await loadMockIcons();
        }
        
        // Update category filters with actual folders
        await updateCategoryFilters();
        
        showLoading(false);
        
        if (currentTab === 'gallery') {
            renderGallery();
        } else if (currentTab === 'manage') {
            renderManage();
        }
        
        showNotification(`Loaded ${icons.length} icons`, 'success');
        
    } catch (error) {
        console.error('Error loading icons:', error);
        // Fallback to mock data
        icons = await loadMockIcons();
        showLoading(false);
        
        if (currentTab === 'gallery') {
            renderGallery();
        } else if (currentTab === 'manage') {
            renderManage();
        }
        
        showNotification('Loaded icons (fallback mode)', 'info');
    }
}

// Update category filters with actual folders
async function updateCategoryFilters() {
    try {
        const response = await fetch('/api/categories');
        const data = await response.json();
        
        if (data.success) {
            const categories = data.categories;
            
            // Update gallery filter
            updateSelectOptions(elements.categoryFilter, categories);
            
            // Update manage filter
            updateSelectOptions(elements.manageCategoryFilter, categories);
            
            // Update upload form category
            updateSelectOptions(elements.iconCategory, categories);
        }
    } catch (error) {
        console.error('Error updating category filters:', error);
    }
}

// Update select options
function updateSelectOptions(selectElement, categories) {
    if (!selectElement) return;
    
    // Keep the first option (All Categories or Select Category)
    const firstOption = selectElement.options[0];
    selectElement.innerHTML = '';
    selectElement.appendChild(firstOption);
    
    // Add category options
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = getCategoryDisplayName(category);
        selectElement.appendChild(option);
    });
}

// Get display name for category
function getCategoryDisplayName(category) {
    if (category.startsWith('custom/')) {
        return `Custom: ${category.split('/')[1]}`;
    }
    return category.charAt(0).toUpperCase() + category.slice(1);
}

// Load mock icons as fallback
async function loadMockIcons() {
    const mockIcons = [];
    
    // Add mock icons for demonstration
    mockIcons.push(
        {
            name: 'github.svg',
            category: 'social',
            url: `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/social/github.svg`,
            description: 'GitHub logo',
            size: '2.1 KB',
            lastModified: new Date().toISOString()
        },
        {
            name: 'arrow-right.svg',
            category: 'ui',
            url: `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/ui/arrow-right.svg`,
            description: 'Right arrow icon',
            size: '1.8 KB',
            lastModified: new Date().toISOString()
        },
        {
            name: 'menu.svg',
            category: 'ui',
            url: `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/ui/menu.svg`,
            description: 'Hamburger menu icon',
            size: '1.5 KB',
            lastModified: new Date().toISOString()
        },
        {
            name: 'apple.svg',
            category: 'brands',
            url: `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/brands/apple.svg`,
            description: 'Apple logo',
            size: '3.2 KB',
            lastModified: new Date().toISOString()
        }
    );
    
    return mockIcons;
}



// Render gallery
function renderGallery() {
    const filteredIcons = getFilteredIcons();
    
    if (filteredIcons.length === 0) {
        elements.iconGrid.innerHTML = '';
        elements.noIcons.style.display = 'block';
        return;
    }
    
    elements.noIcons.style.display = 'none';
    
    const html = filteredIcons.map(icon => {
        const iconUrl = generateIconUrl(icon.category, icon.name);
        const ext = getFileExtension(icon.name);
        
        // Create icon HTML based on format
        let iconHtml = '';
        if (ext === '.svg') {
            iconHtml = `<img src="${iconUrl}" alt="${icon.name}" onerror="this.style.display='none'">`;
        } else {
            iconHtml = `<img src="${iconUrl}" alt="${icon.name}" onerror="this.style.display='none'">`;
        }
        
        return `
            <div class="icon-card" onclick="showIconDetail('${icon.name}', '${icon.category}')">
                <div class="icon-preview">
                    ${iconHtml}
                </div>
                <div class="icon-info">
                    <h3>${icon.name}</h3>
                    <p>${icon.description || ''}</p>
                    <span class="category-badge">${icon.category}</span>
                    <small>${icon.size}${icon.originalSize ? ` (was ${icon.originalSize})` : ''}</small>
                </div>
            </div>
        `;
    }).join('');
    
    elements.iconGrid.innerHTML = html;
}

// Render manage view
function renderManage() {
    const filteredIcons = getFilteredIcons();
    
    const html = filteredIcons.map(icon => {
        const iconUrl = generateIconUrl(icon.category, icon.name);
        return `
            <div class="manage-card">
                <div class="manage-card-header">
                    <div class="manage-card-icon">
                        <img src="${iconUrl}" alt="${icon.name}" onerror="this.style.display='none'">
                    </div>
                    <div class="manage-card-info">
                        <h3>${icon.name}</h3>
                        <p>${icon.category} • ${icon.size}${icon.originalSize ? ` (was ${icon.originalSize})` : ''}</p>
                    </div>
                </div>
                <div class="manage-card-actions">
                    <button class="btn btn-primary" onclick="copyIconUrl('${iconUrl}')">
                        <i class="fas fa-copy"></i> Copy URL
                    </button>
                    <button class="btn btn-secondary" onclick="showIconDetail('${icon.name}', '${icon.category}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-danger" onclick="deleteIcon('${icon.name}', '${icon.category}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    elements.manageGrid.innerHTML = html;
}

// Filter icons
function getFilteredIcons() {
    let filtered = [...icons];
    
    // Category filter
    const categoryFilter = elements.categoryFilter.value || elements.manageCategoryFilter.value;
    if (categoryFilter) {
        if (categoryFilter === 'custom') {
            filtered = filtered.filter(icon => icon.category.startsWith('custom/'));
        } else {
            filtered = filtered.filter(icon => icon.category === categoryFilter);
        }
    }
    
    // Search filter
    const searchTerm = elements.searchIcons.value.toLowerCase();
    if (searchTerm) {
        filtered = filtered.filter(icon => 
            icon.name.toLowerCase().includes(searchTerm) ||
            (icon.description && icon.description.toLowerCase().includes(searchTerm))
        );
    }
    
    return filtered;
}

// Filter icons for gallery
function filterIcons() {
    renderGallery();
}

// Filter icons for manage view
function filterManageIcons() {
    renderManage();
}

// Handle file selection
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        const isValid = validateFile(file);
        if (isValid) {
            // Show live preview
            showLivePreview(file);
        }
    }
}

// Validate file
function validateFile(file) {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!CONFIG.supportedFormats.includes(ext)) {
        showNotification(`Unsupported format: ${ext}`, 'error');
        elements.iconFile.value = '';
        return false;
    }
    
    if (file.size > CONFIG.maxFileSize) {
        showNotification(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Max: ${CONFIG.maxFileSize / (1024 * 1024)}MB`, 'error');
        elements.iconFile.value = '';
        return false;
    }
    
    return true;
}



// Sanitize file name
function sanitizeFileName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
        .replace(/-+/g, '-')          // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

// Sanitize folder name
function sanitizeFolderName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')  // Replace invalid chars with hyphens
        .replace(/-+/g, '-')          // Replace multiple hyphens with single
        .replace(/^-|-$/g, '');       // Remove leading/trailing hyphens
}

// Get file extension
function getFileExtension(filename) {
    return '.' + filename.split('.').pop().toLowerCase();
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Check if format is compressible
function isCompressibleFormat(ext) {
    return ['.png', '.jpg', '.jpeg', '.webp'].includes(ext.toLowerCase());
}

// Estimate compressed size
function estimateCompressedSize(originalSize, ext) {
    const extLower = ext.toLowerCase();
    let compressionRatio = 1;
    
    if (extLower === '.png') {
        compressionRatio = 0.6; // 40% reduction
    } else if (extLower === '.jpg' || extLower === '.jpeg') {
        compressionRatio = 0.7; // 30% reduction
    } else if (extLower === '.webp') {
        compressionRatio = 0.5; // 50% reduction
    }
    
    return Math.round(originalSize * compressionRatio);
}

// Get compression badge
function getCompressionBadge(percent) {
    if (percent >= 50) {
        return '<span class="compression-badge excellent">Excellent</span>';
    } else if (percent >= 20) {
        return '<span class="compression-badge good">Good</span>';
    } else {
        return '<span class="compression-badge minimal">Minimal</span>';
    }
}

// Show live preview of selected file
function showLivePreview(file) {
    const name = elements.iconName.value || file.name.replace(/\.[^/.]+$/, "");
    const category = elements.iconCategory.value;
    const customFolder = document.getElementById('customFolder')?.value;
    const compress = elements.compressIcon.checked;
    
    // Update preview elements
    const finalName = sanitizeFileName(name);
    const fileExt = getFileExtension(file.name);
    const finalFileName = finalName + fileExt;
    elements.previewName.textContent = finalFileName;
    elements.previewCategory.textContent = category === 'custom' && customFolder ? `custom/${customFolder}` : category;
    elements.previewOriginalSize.textContent = formatFileSize(file.size);
    
    // Show preview icon
    const reader = new FileReader();
    reader.onload = function(e) {
        const ext = getFileExtension(file.name);
        if (ext === '.svg') {
            elements.previewIcon.innerHTML = e.target.result;
        } else {
            elements.previewIcon.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        }
    };
    
    if (getFileExtension(file.name) === '.svg') {
        reader.readAsText(file);
    } else {
        reader.readAsDataURL(file);
    }
    
    // Estimate compressed size
    if (compress && isCompressibleFormat(getFileExtension(file.name))) {
        const estimatedCompressedSize = estimateCompressedSize(file.size, getFileExtension(file.name));
        elements.previewCompressedSize.textContent = formatFileSize(estimatedCompressedSize);
        
        const compressionPercent = ((file.size - estimatedCompressedSize) / file.size * 100).toFixed(1);
        const compressionBadge = getCompressionBadge(compressionPercent);
        elements.previewCompression.innerHTML = `${compressionPercent}% smaller ${compressionBadge}`;
    } else {
        elements.previewCompressedSize.textContent = 'No compression';
        elements.previewCompression.textContent = 'Not applicable';
    }
    
    // Show preview
    elements.uploadPreview.style.display = 'block';
}

// Update name preview in real-time
function updateNamePreview() {
    const name = elements.iconName.value;
    const file = elements.iconFile.files[0];
    
    if (name && file) {
        const finalName = sanitizeFileName(name);
        const fileExt = getFileExtension(file.name);
        const finalFileName = finalName + fileExt;
        
        const namePreview = document.getElementById('namePreview');
        if (namePreview) {
            namePreview.textContent = finalFileName;
        }
    }
    
    // Also update live preview if it's visible
    if (file && elements.uploadPreview.style.display !== 'none') {
        showLivePreview(file);
    }
}

// Update preview when inputs change
function updatePreviewFromInputs() {
    const file = elements.iconFile.files[0];
    if (file && elements.uploadPreview.style.display !== 'none') {
        showLivePreview(file);
    }
}

// Upload file directly without preview
async function uploadFileDirectly(file) {
    // Generate a name from the file name if not provided
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const name = elements.iconName.value || fileName;
    const category = elements.iconCategory.value;
    const customFolder = document.getElementById('customFolder')?.value;
    
    if (!category) {
        showNotification('Please select a category', 'error');
        return;
    }
    
    if (category === 'custom' && !customFolder) {
        showNotification('Please enter a custom folder name', 'error');
        return;
    }
    
    // Upload the file
    await uploadFile(file, name, category, customFolder);
    
    // Reset file input
    elements.iconFile.value = '';
}

// Handle upload
function handleUpload(event) {
    event.preventDefault();
    
    const formData = new FormData(elements.uploadForm);
    const file = elements.iconFile.files[0];
    const name = elements.iconName.value;
    const category = elements.iconCategory.value;
    const customFolder = document.getElementById('customFolder')?.value;
    
    if (!file || !name || !category) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (category === 'custom' && !customFolder) {
        showNotification('Please enter a custom folder name', 'error');
        return;
    }
    
    if (!validateFile(file)) {
        return;
    }
    
    // Hide preview and upload
    elements.uploadPreview.style.display = 'none';
    
    // Upload the file
    uploadFile(file, name, category, customFolder);
}

// Upload file to icons folder
async function uploadFile(file, name, category, customFolder) {
    showNotification('Uploading icon...', 'info');
    
    try {
        const finalName = sanitizeFileName(name);
        const finalCategory = category === 'custom' && customFolder ? `custom/${sanitizeFolderName(customFolder)}` : category;
        
        // Create FormData for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', finalCategory);
        formData.append('description', elements.iconDescription.value || '');
        formData.append('compress', elements.compressIcon.checked);
        formData.append('customName', finalName); // Send the custom name to server
        
        // Upload to server
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Add to local icons array
            const newIcon = {
                name: result.fileName,
                category: result.category,
                url: result.url,
                description: elements.iconDescription.value || '',
                size: (result.compressedSize / (1024 * 1024)).toFixed(2) + ' MB',
                originalSize: result.originalSize ? (result.originalSize / (1024 * 1024)).toFixed(2) + ' MB' : null,
                lastModified: new Date().toISOString()
            };
            
            icons.unshift(newIcon);
            
            // Reset form
            elements.uploadForm.reset();
            
            // Hide preview
            elements.uploadPreview.style.display = 'none';
            
            // Hide custom folder input
            const customContainer = document.getElementById('customFolderContainer');
            if (customContainer) {
                customContainer.style.display = 'none';
            }
            
            // Reload icons and update filters
            await loadIcons();
            
            // Show compression info if file was compressed
            let notificationMessage = 'Icon uploaded successfully!';
            if (result.originalSize && result.compressedSize < result.originalSize) {
                const savedPercent = ((result.originalSize - result.compressedSize) / result.originalSize * 100).toFixed(1);
                notificationMessage = `Icon uploaded successfully! Compressed: ${savedPercent}% smaller`;
            }
            showNotification(notificationMessage, 'success');
        } else {
            throw new Error(result.error || 'Upload failed');
        }
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Error uploading icon: ' + error.message, 'error');
    }
}

// Show icon detail modal
function showIconDetail(name, category) {
    const icon = icons.find(i => i.name === name && i.category === category);
    if (!icon) return;
    
    const iconUrl = generateIconUrl(category, name);
    const cdnUrl = generateCdnUrl(category, name);
    const localUrl = generateLocalUrl(category, name);
    
    elements.modalName.textContent = icon.name;
    elements.modalCategory.textContent = icon.category;
    
    // Show current URL and both options
    elements.modalUrl.innerHTML = `
        <div class="url-options">
            <div class="current-url">
                <strong>Current (${useLocal ? 'Local' : 'CDN'}):</strong><br>
                <code>${iconUrl}</code>
            </div>
            <div class="url-alternatives">
                <div class="url-option">
                    <strong>CDN URL:</strong><br>
                    <code>${cdnUrl}</code>
                </div>
                <div class="url-option">
                    <strong>Local URL:</strong><br>
                    <code>${localUrl}</code>
                </div>
            </div>
        </div>
    `;
    
    // Load icon in modal
    const ext = getFileExtension(icon.name);
    if (ext === '.svg') {
        fetch(iconUrl)
            .then(response => response.text())
            .then(svg => {
                elements.modalIcon.innerHTML = svg;
            })
            .catch(() => {
                elements.modalIcon.innerHTML = '<i class="fas fa-image" style="font-size: 3rem; color: #6c757d;"></i>';
            });
    } else {
        elements.modalIcon.innerHTML = `<img src="${iconUrl}" alt="${icon.name}">`;
    }
    
    elements.iconModal.style.display = 'block';
}

// Close modal
function closeModal() {
    elements.iconModal.style.display = 'none';
}

// Copy icon URL
function copyIconUrl(url) {
    navigator.clipboard.writeText(url).then(() => {
        showNotification('URL copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy URL', 'error');
    });
}

// Delete icon
async function deleteIcon(name, category) {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
        try {
            const response = await fetch('/api/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fileName: name, category: category })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Reload icons and update filters
                await loadIcons();
                
                showNotification('Icon deleted successfully!', 'success');
            } else {
                throw new Error(result.error || 'Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Error deleting icon: ' + error.message, 'error');
        }
    }
}

// Show/hide loading
function showLoading(show) {
    elements.loading.style.display = show ? 'block' : 'none';
    if (show) {
        elements.iconGrid.innerHTML = '';
        elements.manageGrid.innerHTML = '';
        elements.noIcons.style.display = 'none';
    }
}

// Show notification
function showNotification(message, type = 'info') {
    elements.notification.textContent = message;
    elements.notification.className = `notification ${type}`;
    elements.notification.classList.add('show');
    
    setTimeout(() => {
        elements.notification.classList.remove('show');
    }, 3000);
}

// Initialize clipboard.js
function initializeClipboard() {
    if (typeof ClipboardJS !== 'undefined') {
        new ClipboardJS('.copy-btn');
    }
}

// Handle source toggle
function handleSourceToggle() {
    useLocal = document.getElementById('sourceToggle').checked;
    const toggleLabel = document.getElementById('toggleLabel');
    
    if (useLocal) {
        toggleLabel.textContent = 'Local';
        showNotification('Switched to Local files', 'info');
    } else {
        toggleLabel.textContent = 'CDN';
        showNotification('Switched to CDN', 'info');
    }
    
    // Re-render current view
    if (currentTab === 'gallery') {
        renderGallery();
    } else if (currentTab === 'manage') {
        renderManage();
    }
}

// Generate URL based on current source setting
function generateIconUrl(category, filename) {
    if (useLocal) {
        return `${CONFIG.localBaseUrl}/${category}/${filename}`;
    } else {
        return `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/${category}/${filename}`;
    }
}

// Utility function to generate CDN URL
function generateCdnUrl(category, filename) {
    return `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/${category}/${filename}`;
}

// Utility function to generate Local URL
function generateLocalUrl(category, filename) {
    return `${CONFIG.localBaseUrl}/${category}/${filename}`;
}

// Export functions for global access
window.showIconDetail = showIconDetail;
window.copyIconUrl = copyIconUrl;
window.deleteIcon = deleteIcon; 