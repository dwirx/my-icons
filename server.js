const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const IconUploadHandler = require('./upload-handler');

const PORT = process.env.PORT || 3001;

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp'
};

// Initialize upload handler
const uploadHandler = new IconUploadHandler();

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;
    
    // Handle API endpoints
    if (pathname.startsWith('/api/')) {
        handleApiRequest(req, res, parsedUrl);
        return;
    }
    
    // Handle icons folder access
    if (pathname.startsWith('/icons/')) {
        const iconPath = path.join(__dirname, pathname);
        const extname = path.extname(iconPath).toLowerCase();
        
        // Check if file exists
        if (fs.existsSync(iconPath)) {
            const contentType = mimeTypes[extname] || 'application/octet-stream';
            fs.readFile(iconPath, (err, content) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Error reading icon file');
                } else {
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(content);
                }
            });
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Icon not found');
        }
        return;
    }
    
    // Default to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Get file path
    const filePath = path.join(__dirname, pathname);
    const extname = path.extname(filePath).toLowerCase();
    
    // Set content type
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Read file
    fs.readFile(filePath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                // File not found
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>404 - Page Not Found</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #667eea; }
                        </style>
                    </head>
                    <body>
                        <h1>404 - Page Not Found</h1>
                        <p>The page you're looking for doesn't exist.</p>
                        <a href="/">Go back to home</a>
                    </body>
                    </html>
                `);
            } else {
                // Server error
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>500 - Server Error</title>
                        <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                            h1 { color: #dc3545; }
                        </style>
                    </head>
                    <body>
                        <h1>500 - Server Error</h1>
                        <p>Something went wrong on the server.</p>
                        <a href="/">Go back to home</a>
                    </body>
                    </html>
                `);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content);
        }
    });
});

// Handle API requests
function handleApiRequest(req, res, parsedUrl) {
    const pathname = parsedUrl.pathname;
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Handle different API endpoints
    if (pathname === '/api/icons' && req.method === 'GET') {
        // List all icons
        uploadHandler.listIcons()
            .then(icons => {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, icons }));
            })
            .catch(error => {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: error.message }));
            });
    }
    else if (pathname === '/api/upload' && req.method === 'POST') {
        // Handle file upload
        handleFileUpload(req, res);
    }
    else if (pathname === '/api/delete' && req.method === 'POST') {
        // Handle file deletion
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                const { fileName, category } = JSON.parse(body);
                uploadHandler.deleteFile(fileName, category)
                    .then(result => {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(result));
                    })
                    .catch(error => {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: false, error: error.message }));
                    });
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
            }
        });
    }
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'API endpoint not found' }));
    }
}

// Handle file upload
function handleFileUpload(req, res) {
    // For now, we'll use a simple multipart parser
    // In production, you should use a proper library like multer
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            // Parse multipart form data (simplified)
            const boundary = req.headers['content-type'].split('boundary=')[1];
            const parts = body.split('--' + boundary);
            
            let fileData = null;
            let category = '';
            let customFolder = '';
            let description = '';
            
            for (const part of parts) {
                if (part.includes('Content-Disposition: form-data')) {
                    if (part.includes('name="file"')) {
                        // Extract file data (simplified)
                        const fileMatch = part.match(/filename="([^"]+)"/);
                        if (fileMatch) {
                            fileData = {
                                originalname: fileMatch[1],
                                size: part.length,
                                path: '/tmp/' + fileMatch[1] // Simplified
                            };
                        }
                    } else if (part.includes('name="category"')) {
                        const match = part.match(/name="category"\r?\n\r?\n([^\r\n]+)/);
                        if (match) category = match[1];
                    } else if (part.includes('name="customFolder"')) {
                        const match = part.match(/name="customFolder"\r?\n\r?\n([^\r\n]+)/);
                        if (match) customFolder = match[1];
                    } else if (part.includes('name="description"')) {
                        const match = part.match(/name="description"\r?\n\r?\n([^\r\n]+)/);
                        if (match) description = match[1];
                    }
                }
            }
            
            if (!fileData || !category) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: 'Missing required fields' }));
                return;
            }
            
            // Save file
            uploadHandler.saveFile(fileData, category, customFolder || null)
                .then(result => {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                })
                .catch(error => {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: false, error: error.message }));
                });
                
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: error.message }));
        }
    });
}

// Start server
server.listen(PORT, () => {
    console.log(`
🚀 My Icons Website Server Started!

📍 Local: http://localhost:${PORT}
🌐 Network: http://0.0.0.0:${PORT}

📁 Serving files from: ${__dirname}
📋 Available files:
   - index.html (Main website)
   - styles.css (Styling)
   - script.js (Functionality)
   - upload-icons.js (Helper script)

🎨 Features:
   - Icon gallery with filtering
   - Upload interface (simulated)
   - Icon management
   - CDN URL generation
   - Responsive design

Press Ctrl+C to stop the server
    `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
}); 