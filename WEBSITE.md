# My Icons Website

Website untuk mengelola dan menampilkan icon repository dengan fitur upload, delete, dan preview icon terbaru.

## 🚀 Cara Menjalankan Website

### 1. Menggunakan Node.js Server

```bash
# Install dependencies (jika ada)
npm install

# Jalankan website
npm start
# atau
npm run dev
# atau
npm run website
```

Website akan berjalan di: http://localhost:3000

### 2. Menggunakan Live Server (VS Code)

1. Install extension "Live Server" di VS Code
2. Klik kanan pada file `index.html`
3. Pilih "Open with Live Server"

### 3. Menggunakan Python Server

```bash
# Python 3
python -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

### 4. Menggunakan PHP Server

```bash
php -S localhost:3000
```

## 🎨 Fitur Website

### 📱 Gallery Tab
- **Tampilan Grid**: Icon ditampilkan dalam grid yang responsif
- **Filter Kategori**: Filter berdasarkan kategori (social, ui, brands, flags, custom)
- **Search**: Pencarian icon berdasarkan nama atau deskripsi
- **Preview**: Klik icon untuk melihat detail dan CDN URL

### 📤 Upload Tab
- **Form Upload**: Interface untuk upload icon baru
- **Validasi File**: Validasi format dan ukuran file
- **Preview**: Preview icon sebelum upload
- **Kategori**: Pilihan kategori untuk organisasi
- **Drag & Drop**: Support drag and drop file

### ⚙️ Manage Tab
- **Daftar Icon**: Tampilan semua icon dengan informasi detail
- **Copy URL**: Tombol untuk copy CDN URL
- **Delete**: Tombol untuk hapus icon
- **Refresh**: Refresh daftar icon

### ℹ️ Info Tab
- **Quick Start**: Panduan cepat penggunaan
- **Usage Examples**: Contoh penggunaan dalam HTML/CSS
- **Categories**: Penjelasan kategori
- **Helper Script**: Dokumentasi script command line

## 🛠️ Teknologi yang Digunakan

- **HTML5**: Struktur website
- **CSS3**: Styling modern dengan gradient dan animasi
- **JavaScript (ES6+)**: Fungsionalitas interaktif
- **Font Awesome**: Icon library
- **Clipboard.js**: Copy to clipboard functionality
- **Node.js**: Server untuk development

## 📁 Struktur File

```
my-icons/
├── index.html          # Halaman utama website
├── styles.css          # Styling CSS
├── script.js           # JavaScript functionality
├── server.js           # Node.js server
├── upload-icons.js     # Helper script
├── package.json        # Node.js configuration
├── icons/              # Folder icon
│   ├── social/
│   ├── ui/
│   ├── brands/
│   ├── flags/
│   └── custom/
└── docs/               # Dokumentasi
```

## 🎯 Fitur Utama

### 1. Icon Gallery
- Grid layout responsif
- Filter dan search
- Modal preview
- Copy CDN URL

### 2. Upload System
- Form validation
- File preview
- Category selection
- Simulated upload (demo)

### 3. Management
- Icon listing
- Delete functionality
- URL copying
- Refresh capability

### 4. Responsive Design
- Mobile-friendly
- Tablet support
- Desktop optimized
- Touch gestures

## 🔧 Konfigurasi

### Mengubah Repository
Edit file `script.js` dan ubah konfigurasi:

```javascript
const CONFIG = {
    repository: 'your-username/your-repo',  // Ganti dengan repo Anda
    branch: 'main',
    baseUrl: 'https://cdn.jsdelivr.net/gh',
    // ...
};
```

### Menambah Kategori
1. Edit `CONFIG.categories` di `script.js`
2. Update HTML select options
3. Tambah folder di `icons/`

### Custom Styling
Edit file `styles.css` untuk mengubah:
- Warna tema
- Layout
- Animasi
- Responsive breakpoints

## 🚀 Deployment

### GitHub Pages
1. Push code ke repository
2. Enable GitHub Pages di settings
3. Set source ke branch main
4. Website akan tersedia di: `https://username.github.io/repo-name`

### Netlify
1. Connect repository ke Netlify
2. Set build command: `npm start`
3. Set publish directory: `.`
4. Deploy otomatis

### Vercel
1. Import repository ke Vercel
2. Set framework preset: Other
3. Deploy

## 🔒 Keamanan

- File validation
- Size limits
- Format restrictions
- XSS protection
- CSRF protection (untuk production)

## 📊 Performance

- Lazy loading icons
- Optimized images
- Minified CSS/JS
- CDN delivery
- Caching headers

## 🐛 Troubleshooting

### Icon tidak muncul
- Cek URL CDN
- Pastikan file ada di repository
- Refresh cache browser

### Upload tidak berfungsi
- Cek format file
- Pastikan ukuran < 50MB
- Cek console untuk error

### Server tidak start
- Pastikan Node.js terinstall
- Cek port 3000 tidak digunakan
- Cek file permissions

## 🤝 Contributing

1. Fork repository
2. Buat feature branch
3. Commit changes
4. Push ke branch
5. Buat Pull Request

## 📝 License

MIT License - lihat file LICENSE untuk detail.

---

**Dibuat dengan ❤️ untuk memudahkan pengelolaan icon repository** 