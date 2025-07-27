# My Icons - Icon Hosting via GitHub + jsDelivr

A simple and efficient way to host and serve icons using GitHub as storage and jsDelivr as a CDN.

## 🚀 Quick Start

### Using Icons

All icons are served via jsDelivr CDN. Use the following URL pattern:

```
https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/[category]/[filename]
```

**Examples:**
- `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/social/github.svg`
- `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/ui/arrow-right.png`
- `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/brands/facebook.svg`

### Available Categories

- `social/` - Social media icons
- `ui/` - User interface icons
- `brands/` - Brand logos
- `flags/` - Country flags
- `custom/` - Custom icons

## 📁 Repository Structure

```
my-icons/
├── icons/
│   ├── social/
│   ├── ui/
│   ├── brands/
│   ├── flags/
│   └── custom/
├── docs/
│   └── icon-gallery.md
└── README.md
```

## 🔧 How to Add Icons

### Method 1: Direct Upload via GitHub Web Interface

1. Navigate to the appropriate category folder in your repository
2. Click "Add file" → "Upload files"
3. Drag and drop your icon files
4. Commit the changes

### Method 2: Using Git Commands

```bash
# Clone the repository
git clone https://github.com/dwirx/my-icons.git
cd my-icons

# Add your icons to the appropriate folder
# Example: icons/social/my-icon.svg

# Commit and push
git add .
git commit -m "Add new icons"
git push origin main
```

## 📋 Icon Guidelines

### Supported Formats
- **SVG** (recommended) - Scalable, small file size
- **PNG** - For complex icons or when SVG isn't suitable
- **ICO** - For favicon purposes
- **WebP** - Modern format with good compression

### Naming Convention
- Use lowercase letters
- Separate words with hyphens: `my-icon.svg`
- Be descriptive but concise
- Include size in filename if multiple sizes: `icon-16.png`, `icon-32.png`

### File Organization
- Group related icons in subfolders
- Use consistent naming patterns
- Keep file sizes reasonable (< 100KB for PNG, < 10KB for SVG)

## 🌐 CDN Benefits

### jsDelivr Features
- **Global CDN** - Fast loading worldwide
- **Automatic optimization** - Compressed delivery
- **Version control** - Use specific commits or tags
- **HTTPS by default** - Secure delivery
- **No rate limits** - Unlimited requests

### URL Patterns

**Latest version (main branch):**
```
https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/[path]
```

**Specific version (commit hash):**
```
https://cdn.jsdelivr.net/gh/dwirx/my-icons@[commit-hash]/icons/[path]
```

**Minified version (for production):**
```
https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/[path]
```

## 💻 Usage Examples

### HTML
```html
<!-- SVG Icon -->
<img src="https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/social/github.svg" alt="GitHub">

<!-- PNG Icon -->
<img src="https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/ui/arrow-right.png" alt="Arrow Right">
```

### CSS
```css
.social-icon {
    background-image: url('https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/social/twitter.svg');
    background-size: contain;
    background-repeat: no-repeat;
}
```

### JavaScript
```javascript
// Dynamic icon loading
function loadIcon(category, filename) {
    const url = `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/${category}/${filename}`;
    return fetch(url).then(response => response.text());
}
```

## 🔄 Workflow

1. **Upload** icons to appropriate category folders
2. **Commit** changes to GitHub
3. **Access** via jsDelivr CDN immediately
4. **Update** existing icons by replacing files with same names

## 📊 Performance Tips

- Use SVG format when possible for scalability
- Optimize SVG files before uploading
- Use descriptive filenames for better organization
- Group related icons in subfolders
- Consider creating different sizes for complex icons

## 🤝 Contributing

1. Fork the repository
2. Add your icons to the appropriate category
3. Follow the naming conventions
4. Submit a pull request

## 📝 License

This repository is open source. Please ensure you have the rights to use any icons you upload.

## 🔗 Useful Links

- [jsDelivr Documentation](https://www.jsdelivr.com/)
- [GitHub File Upload Guide](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository)
- [SVG Optimization Tools](https://github.com/svg/svgo)

---

**Last Updated:** $(date)
**Total Icons:** [Auto-updated count] 