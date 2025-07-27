// Configuration
const CONFIG = {
    repository: 'dwirx/my-icons',
    branch: 'main',
    baseUrl: 'https://cdn.jsdelivr.net/gh',
    categories: ['social', 'ui', 'brands', 'flags', 'custom'],
    supportedFormats: ['.svg', '.png', '.ico', '.webp'],
    maxFileSize: 50 * 1024 * 1024 // 50MB
};

// Global variables
let icons = [];
let currentTab = 'gallery';

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
    uploadPreview: document.getElementById('uploadPreview'),
    previewIcon: document.getElementById('previewIcon'),
    previewName: document.getElementById('previewName'),
    previewCategory: document.getElementById('previewCategory'),
    previewSize: document.getElementById('previewSize'),
    previewUrl: document.getElementById('previewUrl'),
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
    elements.iconName.addEventListener('input', updatePreview);
    elements.iconCategory.addEventListener('change', updatePreview);

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
        icons = [];
        
        // Load icons from each category
        for (const category of CONFIG.categories) {
            const categoryIcons = await loadCategoryIcons(category);
            icons.push(...categoryIcons);
        }
        
        showLoading(false);
        
        if (currentTab === 'gallery') {
            renderGallery();
        } else if (currentTab === 'manage') {
            renderManage();
        }
        
        showNotification(`Loaded ${icons.length} icons`, 'success');
        
    } catch (error) {
        console.error('Error loading icons:', error);
        showLoading(false);
        showNotification('Error loading icons', 'error');
    }
}

// Load icons from a specific category
async function loadCategoryIcons(category) {
    const categoryIcons = [];
    
    try {
        // This is a simplified approach - in a real implementation,
        // you would need to fetch the actual file list from GitHub API
        // For now, we'll use a mock approach
        
        // Check if the category folder exists and has icons
        const testUrl = `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/${category}/.gitkeep`;
        
        // For demo purposes, we'll create some mock icons
        if (category === 'social') {
            categoryIcons.push({
                name: 'github.svg',
                category: 'social',
                url: `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/social/github.svg`,
                description: 'GitHub logo',
                size: '2.1 KB',
                lastModified: new Date().toISOString()
            });
        }
        
        // Add more mock icons for demonstration
        if (category === 'ui') {
            categoryIcons.push(
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
                }
            );
        }
        
    } catch (error) {
        console.error(`Error loading ${category} icons:`, error);
    }
    
    return categoryIcons;
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
    
    const html = filteredIcons.map(icon => `
        <div class="icon-card" onclick="showIconDetail('${icon.name}', '${icon.category}')">
            <img src="${icon.url}" alt="${icon.name}" onerror="this.style.display='none'">
            <h3>${icon.name}</h3>
            <p>${icon.description || ''}</p>
            <span class="category-badge">${icon.category}</span>
        </div>
    `).join('');
    
    elements.iconGrid.innerHTML = html;
}

// Render manage view
function renderManage() {
    const filteredIcons = getFilteredIcons();
    
    const html = filteredIcons.map(icon => `
        <div class="manage-card">
            <div class="manage-card-header">
                <div class="manage-card-icon">
                    <img src="${icon.url}" alt="${icon.name}" onerror="this.style.display='none'">
                </div>
                <div class="manage-card-info">
                    <h3>${icon.name}</h3>
                    <p>${icon.category} • ${icon.size}</p>
                </div>
            </div>
            <div class="manage-card-actions">
                <button class="btn btn-primary" onclick="copyIconUrl('${icon.url}')">
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
    `).join('');
    
    elements.manageGrid.innerHTML = html;
}

// Filter icons
function getFilteredIcons() {
    let filtered = [...icons];
    
    // Category filter
    const categoryFilter = elements.categoryFilter.value || elements.manageCategoryFilter.value;
    if (categoryFilter) {
        filtered = filtered.filter(icon => icon.category === categoryFilter);
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
        validateFile(file);
        updatePreview();
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

// Update preview
function updatePreview() {
    const file = elements.iconFile.files[0];
    const name = elements.iconName.value;
    const category = elements.iconCategory.value;
    
    if (file && name && category) {
        const url = `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/${category}/${name}${getFileExtension(file.name)}`;
        
        elements.previewName.textContent = name + getFileExtension(file.name);
        elements.previewCategory.textContent = category;
        elements.previewSize.textContent = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
        elements.previewUrl.textContent = url;
        
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
        reader.readAsText(file);
        
        elements.uploadPreview.style.display = 'block';
    } else {
        elements.uploadPreview.style.display = 'none';
    }
}

// Get file extension
function getFileExtension(filename) {
    return '.' + filename.split('.').pop().toLowerCase();
}

// Handle upload
function handleUpload(event) {
    event.preventDefault();
    
    const formData = new FormData(elements.uploadForm);
    const file = elements.iconFile.files[0];
    const name = elements.iconName.value;
    const category = elements.iconCategory.value;
    
    if (!file || !name || !category) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    if (!validateFile(file)) {
        return;
    }
    
    // In a real implementation, you would upload to GitHub here
    // For now, we'll simulate the upload
    simulateUpload(file, name, category);
}

// Simulate upload (replace with actual GitHub API integration)
function simulateUpload(file, name, category) {
    showNotification('Uploading icon...', 'info');
    
    setTimeout(() => {
        // Add to local icons array
        const newIcon = {
            name: name + getFileExtension(file.name),
            category: category,
            url: `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/${category}/${name}${getFileExtension(file.name)}`,
            description: elements.iconDescription.value || '',
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            lastModified: new Date().toISOString()
        };
        
        icons.unshift(newIcon);
        
        // Reset form
        elements.uploadForm.reset();
        elements.uploadPreview.style.display = 'none';
        
        // Update views
        if (currentTab === 'gallery') {
            renderGallery();
        } else if (currentTab === 'manage') {
            renderManage();
        }
        
        showNotification('Icon uploaded successfully!', 'success');
    }, 2000);
}

// Show icon detail modal
function showIconDetail(name, category) {
    const icon = icons.find(i => i.name === name && i.category === category);
    if (!icon) return;
    
    elements.modalName.textContent = icon.name;
    elements.modalCategory.textContent = icon.category;
    elements.modalUrl.textContent = icon.url;
    
    // Load icon in modal
    const ext = getFileExtension(icon.name);
    if (ext === '.svg') {
        fetch(icon.url)
            .then(response => response.text())
            .then(svg => {
                elements.modalIcon.innerHTML = svg;
            })
            .catch(() => {
                elements.modalIcon.innerHTML = '<i class="fas fa-image" style="font-size: 3rem; color: #6c757d;"></i>';
            });
    } else {
        elements.modalIcon.innerHTML = `<img src="${icon.url}" alt="${icon.name}">`;
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
function deleteIcon(name, category) {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
        // In a real implementation, you would delete from GitHub here
        // For now, we'll simulate the deletion
        icons = icons.filter(icon => !(icon.name === name && icon.category === category));
        
        if (currentTab === 'gallery') {
            renderGallery();
        } else if (currentTab === 'manage') {
            renderManage();
        }
        
        showNotification('Icon deleted successfully!', 'success');
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

// Utility function to generate CDN URL
function generateCdnUrl(category, filename) {
    return `${CONFIG.baseUrl}/${CONFIG.repository}@${CONFIG.branch}/icons/${category}/${filename}`;
}

// Export functions for global access
window.showIconDetail = showIconDetail;
window.copyIconUrl = copyIconUrl;
window.deleteIcon = deleteIcon; 