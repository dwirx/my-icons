# Icon Upload Workflow

This document explains the step-by-step process for uploading and hosting icons using this repository.

## 🚀 Quick Workflow

### 1. Prepare Your Icons

- **Format**: Prefer SVG format for scalability
- **Size**: Keep files under 100KB
- **Naming**: Use lowercase with hyphens (e.g., `my-icon.svg`)
- **Optimization**: Compress SVG files using tools like SVGO

### 2. Choose Category

Organize your icons into these categories:

- **`social/`** - Social media platform icons
- **`ui/`** - User interface elements (arrows, buttons, etc.)
- **`brands/`** - Company and brand logos
- **`flags/`** - Country flags
- **`custom/`** - Custom or miscellaneous icons

### 3. Upload Methods

#### Method A: GitHub Web Interface (Recommended for beginners)

1. Navigate to your repository: https://github.com/dwirx/my-icons
2. Click on the appropriate category folder (e.g., `icons/social/`)
3. Click "Add file" → "Upload files"
4. Drag and drop your icon files
5. Add a descriptive commit message
6. Click "Commit changes"

#### Method B: Git Commands (For advanced users)

```bash
# Clone the repository
git clone https://github.com/dwirx/my-icons.git
cd my-icons

# Add your icons to the appropriate folder
cp /path/to/your/icon.svg icons/social/

# Commit and push
git add .
git commit -m "Add new social media icons"
git push origin main
```

#### Method C: Using the Helper Script

```bash
# Initialize the repository structure
npm run init

# Validate an icon before uploading
npm run validate path/to/icon.svg

# Generate CDN URL for an icon
npm run url social github.svg

# Generate usage examples
npm run examples social github.svg
```

### 4. Access via CDN

Once uploaded, your icons are immediately available via jsDelivr CDN:

```
https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/[category]/[filename]
```

**Example:**
- File: `icons/social/github.svg`
- CDN URL: `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/social/github.svg`

## 📋 Best Practices

### File Organization

```
icons/
├── social/
│   ├── github.svg
│   ├── twitter.svg
│   └── facebook.svg
├── ui/
│   ├── arrow-right.svg
│   ├── menu.svg
│   └── close.svg
└── brands/
    ├── apple.svg
    └── microsoft.svg
```

### Naming Conventions

- ✅ `github.svg` - Good
- ✅ `arrow-right.svg` - Good
- ✅ `menu-icon.svg` - Good
- ❌ `GitHub.svg` - Bad (uppercase)
- ❌ `arrow_right.svg` - Bad (underscore)
- ❌ `my icon.svg` - Bad (spaces)

### File Size Guidelines

- **SVG**: < 10KB (preferred)
- **PNG**: < 100KB
- **WebP**: < 50KB
- **ICO**: < 20KB

## 🔧 Advanced Features

### Version Control

You can access specific versions using commit hashes:

```
https://cdn.jsdelivr.net/gh/dwirx/my-icons@[commit-hash]/icons/[path]
```

### Multiple Sizes

For icons that need different sizes, use descriptive filenames:

```
icons/ui/
├── arrow-right-16.svg
├── arrow-right-24.svg
└── arrow-right-32.svg
```

### Icon Sets

Group related icons in subfolders:

```
icons/brands/
├── tech/
│   ├── apple.svg
│   └── microsoft.svg
└── social/
    ├── facebook.svg
    └── twitter.svg
```

## 🛠️ Tools and Resources

### SVG Optimization

- **SVGO**: Command-line SVG optimizer
- **Online tools**: SVGOMG, SVG Optimizer
- **Design software**: Export optimized SVGs from Figma, Sketch, etc.

### Validation Tools

- Use the included helper script: `npm run validate`
- Check file sizes before uploading
- Validate SVG syntax with online validators

### CDN Testing

Test your CDN URLs:
1. Open the URL in a browser
2. Check response headers for caching
3. Verify the icon displays correctly

## 📊 Monitoring and Analytics

### jsDelivr Statistics

- Visit: https://www.jsdelivr.com/
- Check your repository's usage statistics
- Monitor CDN performance

### GitHub Insights

- View repository traffic in GitHub Insights
- Track download statistics
- Monitor contributor activity

## 🔄 Update Process

### Updating Existing Icons

1. Upload a new file with the same name
2. Commit the changes
3. The CDN will serve the updated version immediately

### Deprecating Icons

1. Move old icons to a `deprecated/` folder
2. Update documentation
3. Notify users of the change

## 🆘 Troubleshooting

### Common Issues

**Icon not loading:**
- Check the file path is correct
- Verify the file exists in the repository
- Ensure the filename matches exactly (case-sensitive)

**CDN cache issues:**
- jsDelivr caches files for performance
- Changes may take a few minutes to propagate
- Use commit hash URLs for immediate updates

**File size too large:**
- Optimize SVG files
- Compress PNG files
- Consider using WebP format

### Getting Help

- Check the [README.md](../README.md) for basic usage
- Review the [icon gallery](icon-gallery.md) for examples
- Open an issue on GitHub for bugs or questions

---

*This workflow ensures consistent, organized, and efficient icon hosting for your projects.* 