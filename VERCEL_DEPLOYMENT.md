# Vercel Deployment Guide

## 🚀 Deploy ke Vercel

Sistem My Icons dapat di-deploy ke Vercel dengan beberapa penyesuaian untuk platform serverless.

## 📋 Prerequisites

### 1. Vercel Account
- Daftar di [vercel.com](https://vercel.com)
- Install Vercel CLI: `npm i -g vercel`

### 2. GitHub Repository
- Pastikan repository sudah di-push ke GitHub
- Repository harus public atau Vercel Pro untuk private

### 3. Environment Variables
- GitHub token harus dikonfigurasi di Vercel

## ⚙️ Setup Environment Variables di Vercel

### Via Vercel Dashboard:
1. Buka project di Vercel Dashboard
2. Go to Settings → Environment Variables
3. Tambahkan variables berikut:

```env
GITHUB_TOKEN=ghp_your_token_here
GITHUB_USERNAME=bangundwir
GITHUB_REPO=my-icons
GITHUB_BRANCH=main
REPO_OWNER=dwirx
REPO_NAME=my-icons
DEFAULT_BRANCH=main
AUTO_FORK_ENABLED=true
FORK_PREFIX=my-icons-fork
MAX_FORK_ATTEMPTS=5
GIT_AUTHOR_NAME=My Icons Bot
GIT_AUTHOR_EMAIL=bot@myicons.com
COMMIT_MESSAGE_PREFIX=🤖 Auto-update:
NODE_ENV=production
```

### Via Vercel CLI:
```bash
vercel env add GITHUB_TOKEN
vercel env add GITHUB_USERNAME
vercel env add REPO_OWNER
vercel env add REPO_NAME
# ... tambahkan semua environment variables
```

## 🔧 Deployment Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Deploy ke Vercel
```bash
# Login ke Vercel
vercel login

# Deploy
vercel

# Atau deploy production
vercel --prod
```

### 3. Setup Custom Domain (Optional)
```bash
vercel domains add your-domain.com
```

## 📁 File Structure untuk Vercel

```
my-icons/
├── api/
│   └── index.js          # Serverless function handler
├── icons/                # Icon files
├── index.html            # Main website
├── styles.css            # Styling
├── script.js             # Frontend logic
├── upload-handler.js     # File upload logic
├── github-api.js         # GitHub API integration
├── auto-git-manager.js   # Git operations
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
└── .env                  # Local environment (not deployed)
```

## 🔄 Perbedaan dengan Local Development

### ✅ Yang Berfungsi di Vercel:
- **Static file serving** (HTML, CSS, JS)
- **API endpoints** (/api/*)
- **Icon serving** (/icons/*)
- **GitHub API integration**
- **File upload & compression**
- **Repository info**

### ⚠️ Yang Tidak Berfungsi di Vercel:
- **Local file system writes** (Vercel read-only)
- **Git operations** (tidak ada git di serverless)
- **Auto commit & push** (perlu alternative approach)

## 🛠️ Alternative untuk Git Operations di Vercel

### Option 1: GitHub Actions (Recommended)
```yaml
# .github/workflows/auto-commit.yml
name: Auto Commit from Vercel
on:
  repository_dispatch:
    types: [vercel-upload]

jobs:
  commit-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Commit and Push
        run: |
          git config user.name "My Icons Bot"
          git config user.email "bot@myicons.com"
          git add .
          git commit -m "🤖 Auto-update: ${{ github.event.client_payload.message }}"
          git push origin main
```

### Option 2: Webhook to External Service
```javascript
// Di api/index.js, setelah upload berhasil
const webhookUrl = process.env.WEBHOOK_URL;
if (webhookUrl) {
  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'upload',
      file: fileName,
      category: category
    })
  });
}
```

## 🌐 URL Structure di Vercel

### Production URLs:
- **Website:** `https://your-project.vercel.app`
- **API:** `https://your-project.vercel.app/api/*`
- **Icons:** `https://your-project.vercel.app/icons/*`

### CDN URLs (tetap sama):
- **jsDelivr:** `https://cdn.jsdelivr.net/gh/dwirx/my-icons@main/icons/*`

## 🔒 Security Considerations

### Environment Variables:
- ✅ Token disimpan aman di Vercel
- ✅ Tidak terekspos di client-side
- ✅ Enkripsi otomatis oleh Vercel

### File Upload:
- ✅ Validasi file type dan size
- ✅ Compression untuk optimasi
- ✅ Sanitasi nama file

## 📊 Monitoring & Logs

### Vercel Dashboard:
- Function logs
- Performance metrics
- Error tracking

### Custom Logging:
```javascript
// Di api/index.js
console.log('Upload successful:', fileName);
console.error('Upload failed:', error);
```

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Vercel CLI installed
- [ ] Repository pushed to GitHub
- [ ] vercel.json configured
- [ ] API routes working
- [ ] Static files serving
- [ ] GitHub integration tested
- [ ] Custom domain configured (optional)

## 🔧 Troubleshooting

### Common Issues:

#### 1. Environment Variables Not Found
```bash
# Check in Vercel Dashboard
# Or via CLI
vercel env ls
```

#### 2. Function Timeout
```json
// vercel.json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  }
}
```

#### 3. File Upload Size Limit
```json
// vercel.json
{
  "functions": {
    "api/index.js": {
      "maxDuration": 30
    }
  }
}
```

#### 4. CORS Issues
```javascript
// Already handled in api/index.js
res.setHeader('Access-Control-Allow-Origin', '*');
```

## 📈 Performance Optimization

### 1. Image Optimization
- ✅ Sharp compression
- ✅ WebP conversion
- ✅ Size reduction

### 2. Caching
- ✅ Static assets cached
- ✅ CDN for icons
- ✅ Browser caching

### 3. Bundle Size
- ✅ Minimal dependencies
- ✅ Tree shaking
- ✅ Code splitting

## 🎯 Next Steps After Deployment

1. **Test Upload Functionality**
2. **Verify GitHub Integration**
3. **Setup Custom Domain**
4. **Configure GitHub Actions** (untuk git operations)
5. **Monitor Performance**
6. **Setup Analytics**

---

**Status:** ✅ Ready for Vercel deployment  
**Recommended:** Use GitHub Actions for git operations  
**Alternative:** Webhook-based approach for file management 