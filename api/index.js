const http = require('http');
const fs = require('fs');
const path = require('path');
const IconUploadHandler = require('../upload-handler');
const GitHubAPI = require('../github-api');
const AutoGitManager = require('../auto-git-manager');

// Initialize handlers
const uploadHandler = new IconUploadHandler();
const githubAPI = new GitHubAPI();
const autoGitManager = new AutoGitManager();

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

// Serverless function handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // Handle API routes
    if (pathname.startsWith('/api/')) {
      await handleApiRequest(req, res, pathname);
      return;
    }

    // Handle static files
    if (pathname.startsWith('/icons/')) {
      await serveIconFile(req, res, pathname);
      return;
    }

    // Handle other static files
    await serveStaticFile(req, res, pathname);

  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle API requests
async function handleApiRequest(req, res, pathname) {
  try {
    if (pathname === '/api/icons' && req.method === 'GET') {
      const icons = await uploadHandler.listIcons();
      res.status(200).json({ success: true, icons });
    }
    else if (pathname === '/api/categories' && req.method === 'GET') {
      const categories = await uploadHandler.getCategories();
      res.status(200).json({ success: true, categories });
    }
    else if (pathname === '/api/structure' && req.method === 'GET') {
      const structure = await uploadHandler.getFolderStructure();
      res.status(200).json({ success: true, structure });
    }
    else if (pathname === '/api/repo-info' && req.method === 'GET') {
      const info = await autoGitManager.getRepositoryInfo();
      res.status(200).json({ success: true, info });
    }
    else if (pathname === '/api/sync-repo' && req.method === 'POST') {
      const result = await autoGitManager.syncWithOriginal();
      res.status(200).json({ success: true, result });
    }
    else if (pathname === '/api/upload' && req.method === 'POST') {
      await handleFileUpload(req, res);
    }
    else if (pathname === '/api/delete' && req.method === 'POST') {
      await handleFileDelete(req, res);
    }
    else {
      res.status(404).json({ error: 'API endpoint not found' });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// Handle file upload
async function handleFileUpload(req, res) {
  try {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    
    req.on('end', async () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'];
        
        if (!contentType || !contentType.includes('multipart/form-data')) {
          res.status(400).json({ success: false, error: 'Invalid content type' });
          return;
        }

        const boundary = contentType.split('boundary=')[1];
        const parts = parseMultipartData(buffer, boundary);
        
        const fileData = parts.find(part => part.name === 'file');
        const category = parts.find(part => part.name === 'category')?.value || '';
        const customFolder = parts.find(part => part.name === 'customFolder')?.value || '';
        const description = parts.find(part => part.name === 'description')?.value || '';
        const compress = parts.find(part => part.name === 'compress')?.value !== 'false';
        const customName = parts.find(part => part.name === 'customName')?.value || '';
        
        if (!fileData || !category) {
          res.status(400).json({ success: false, error: 'Missing required fields' });
          return;
        }

        const finalFilename = customName ? `${customName}${path.extname(fileData.filename)}` : fileData.filename;
        
        const result = await uploadHandler.saveFileFromBuffer(
          fileData.data, 
          finalFilename, 
          category, 
          customFolder || null, 
          compress
        );
        
        // Trigger GitHub Actions for git operations
        try {
          const githubToken = process.env.GITHUB_TOKEN;
          if (githubToken) {
            await fetch(`https://api.github.com/repos/${process.env.REPO_OWNER}/${process.env.REPO_NAME}/dispatches`, {
              method: 'POST',
              headers: {
                'Authorization': `token ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                event_type: 'vercel-upload',
                client_payload: {
                  message: `🤖 Auto-update: Add icon: ${finalFilename} to ${category}${customFolder ? '/' + customFolder : ''}`,
                  file: finalFilename,
                  category: category,
                  customFolder: customFolder
                }
              })
            });
            console.log('✅ GitHub Actions triggered for git operations');
          }
        } catch (error) {
          console.error('❌ Failed to trigger GitHub Actions:', error.message);
        }
        
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Handle file delete
async function handleFileDelete(req, res) {
  try {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(Buffer.concat(chunks).toString());
        const { fileName, category } = data;
        
        if (!fileName || !category) {
          res.status(400).json({ success: false, error: 'Missing required fields' });
          return;
        }

        const result = await uploadHandler.deleteFile(fileName, category);
        res.status(200).json(result);
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Serve icon files
async function serveIconFile(req, res, pathname) {
  try {
    const filePath = path.join(process.cwd(), pathname);
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    const content = fs.readFileSync(filePath);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.status(200).end(content);
  } catch (error) {
    res.status(500).json({ error: 'Error serving file' });
  }
}

// Serve static files
async function serveStaticFile(req, res, pathname) {
  try {
    let filePath;
    
    if (pathname === '/') {
      filePath = path.join(process.cwd(), 'index.html');
    } else {
      filePath = path.join(process.cwd(), pathname);
    }
    
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'File not found' });
      return;
    }

    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    const content = fs.readFileSync(filePath);
    res.setHeader('Content-Type', contentType);
    res.status(200).end(content);
  } catch (error) {
    res.status(500).json({ error: 'Error serving file' });
  }
}

// Parse multipart form data (simplified version)
function parseMultipartData(buffer, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from('--' + boundary);
  const endBoundaryBuffer = Buffer.from('--' + boundary + '--');
  
  let start = buffer.indexOf(boundaryBuffer);
  let end = buffer.indexOf(endBoundaryBuffer);
  
  if (start === -1 || end === -1) {
    throw new Error('Invalid multipart data');
  }
  
  const data = buffer.slice(start + boundaryBuffer.length, end);
  const partBoundary = Buffer.from('\r\n--' + boundary);
  
  let partStart = 0;
  let partEnd = data.indexOf(partBoundary);
  
  while (partEnd !== -1) {
    const partData = data.slice(partStart, partEnd);
    const part = parsePart(partData);
    if (part) parts.push(part);
    
    partStart = partEnd + partBoundary.length;
    partEnd = data.indexOf(partBoundary, partStart);
  }
  
  const lastPartData = data.slice(partStart);
  const lastPart = parsePart(lastPartData);
  if (lastPart) parts.push(lastPart);
  
  return parts;
}

// Parse individual part
function parsePart(partData) {
  const headerEnd = partData.indexOf('\r\n\r\n');
  if (headerEnd === -1) return null;
  
  const headers = partData.slice(0, headerEnd).toString();
  const data = partData.slice(headerEnd + 4);
  
  const nameMatch = headers.match(/name="([^"]+)"/);
  const filenameMatch = headers.match(/filename="([^"]+)"/);
  
  if (nameMatch) {
    return {
      name: nameMatch[1],
      filename: filenameMatch ? filenameMatch[1] : null,
      data: data,
      value: filenameMatch ? null : data.toString()
    };
  }
  
  return null;
} 