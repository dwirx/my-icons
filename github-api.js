const https = require('https');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class GitHubAPI {
    constructor() {
        this.token = process.env.GITHUB_TOKEN;
        this.username = process.env.GITHUB_USERNAME;
        this.repo = process.env.GITHUB_REPO;
        this.branch = process.env.GITHUB_BRANCH;
        this.owner = process.env.REPO_OWNER;
        this.repoName = process.env.REPO_NAME;
        this.autoForkEnabled = process.env.AUTO_FORK_ENABLED === 'true';
        this.forkPrefix = process.env.FORK_PREFIX;
        this.maxForkAttempts = parseInt(process.env.MAX_FORK_ATTEMPTS) || 5;
        
        if (!this.token) {
            console.warn('⚠️  GITHUB_TOKEN not found in .env file. Auto-commit and fork features will be disabled.');
        }
    }

    // Make HTTP request to GitHub API
    async makeRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.github.com',
                path: endpoint,
                method: method,
                headers: {
                    'User-Agent': 'My-Icons-Bot',
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                }
            };

            if (this.token) {
                options.headers['Authorization'] = `token ${this.token}`;
            }

            if (data) {
                const postData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(postData);
            }

            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(body);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(response);
                        } else {
                            reject(new Error(`GitHub API Error: ${res.statusCode} - ${response.message || body}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse response: ${body}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    // Check if user has write access to the repository
    async checkRepositoryAccess() {
        try {
            const response = await this.makeRequest(`/repos/${this.owner}/${this.repoName}`);
            return {
                hasAccess: true,
                isFork: response.fork,
                parentRepo: response.parent ? {
                    owner: response.parent.owner.login,
                    name: response.parent.name
                } : null
            };
        } catch (error) {
            if (error.message.includes('404')) {
                return { hasAccess: false, error: 'Repository not found' };
            } else if (error.message.includes('403')) {
                return { hasAccess: false, error: 'No write access' };
            }
            throw error;
        }
    }

    // Create a fork of the repository
    async createFork() {
        try {
            console.log(`🔄 Creating fork of ${this.owner}/${this.repoName}...`);
            const response = await this.makeRequest(`/repos/${this.owner}/${this.repoName}/forks`, 'POST');
            
            // Wait for fork to be ready
            await this.waitForFork(response.full_name);
            
            console.log(`✅ Fork created successfully: ${response.full_name}`);
            return {
                success: true,
                forkName: response.name,
                forkFullName: response.full_name,
                forkUrl: response.html_url
            };
        } catch (error) {
            console.error('❌ Failed to create fork:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Wait for fork to be ready
    async waitForFork(fullName, maxAttempts = 10) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const response = await this.makeRequest(`/repos/${fullName}`);
                if (response.fork && response.source) {
                    console.log(`✅ Fork is ready: ${fullName}`);
                    return true;
                }
            } catch (error) {
                console.log(`⏳ Waiting for fork to be ready... (${i + 1}/${maxAttempts})`);
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        throw new Error('Fork creation timeout');
    }

    // Get file content from GitHub
    async getFileContent(filePath, ref = this.branch) {
        try {
            const response = await this.makeRequest(`/repos/${this.owner}/${this.repoName}/contents/${filePath}?ref=${ref}`);
            return {
                content: Buffer.from(response.content, 'base64').toString(),
                sha: response.sha,
                exists: true
            };
        } catch (error) {
            if (error.message.includes('404')) {
                return { exists: false };
            }
            throw error;
        }
    }

    // Create or update file on GitHub
    async createOrUpdateFile(filePath, content, message, branch = this.branch) {
        try {
            // Check if file exists
            const existingFile = await this.getFileContent(filePath, branch);
            
            const data = {
                message: message,
                content: Buffer.from(content).toString('base64'),
                branch: branch
            };

            if (existingFile.exists) {
                data.sha = existingFile.sha;
            }

            const response = await this.makeRequest(
                `/repos/${this.owner}/${this.repoName}/contents/${filePath}`,
                existingFile.exists ? 'PUT' : 'POST',
                data
            );

            return {
                success: true,
                commit: response.commit,
                content: response.content
            };
        } catch (error) {
            console.error(`❌ Failed to ${existingFile.exists ? 'update' : 'create'} file:`, error.message);
            return { success: false, error: error.message };
        }
    }

    // Create a pull request
    async createPullRequest(title, body, head, base = this.branch) {
        try {
            const data = {
                title: title,
                body: body,
                head: head,
                base: base
            };

            const response = await this.makeRequest(
                `/repos/${this.owner}/${this.repoName}/pulls`,
                'POST',
                data
            );

            return {
                success: true,
                pullRequest: response,
                url: response.html_url
            };
        } catch (error) {
            console.error('❌ Failed to create pull request:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Auto-fork and setup workflow
    async autoForkAndSetup() {
        if (!this.autoForkEnabled) {
            console.log('⚠️  Auto-fork is disabled');
            return { success: false, error: 'Auto-fork disabled' };
        }

        try {
            // Check current access
            const access = await this.checkRepositoryAccess();
            
            if (access.hasAccess && !access.isFork) {
                console.log('✅ Already have write access to original repository');
                return { success: true, isOriginal: true };
            }

            if (access.hasAccess && access.isFork) {
                console.log('✅ Already have access to fork');
                return { success: true, isFork: true };
            }

            // Create fork
            const forkResult = await this.createFork();
            if (!forkResult.success) {
                return forkResult;
            }

            // Update local git remote to point to fork
            await this.updateGitRemote(forkResult.forkFullName);

            return {
                success: true,
                forkCreated: true,
                forkName: forkResult.forkName,
                forkUrl: forkResult.forkUrl
            };

        } catch (error) {
            console.error('❌ Auto-fork failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Update git remote to point to fork
    async updateGitRemote(forkFullName) {
        return new Promise((resolve, reject) => {
            const { exec } = require('child_process');
            exec(`git remote set-url origin https://github.com/${forkFullName}.git`, (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Failed to update git remote:', error);
                    reject(error);
                } else {
                    console.log('✅ Git remote updated to fork');
                    resolve();
                }
            });
        });
    }

    // Get repository statistics
    async getRepositoryStats() {
        try {
            const response = await this.makeRequest(`/repos/${this.owner}/${this.repoName}`);
            return {
                name: response.name,
                fullName: response.full_name,
                description: response.description,
                stars: response.stargazers_count,
                forks: response.forks_count,
                issues: response.open_issues_count,
                language: response.language,
                size: response.size,
                updatedAt: response.updated_at,
                isFork: response.fork,
                parentRepo: response.parent ? {
                    owner: response.parent.owner.login,
                    name: response.parent.name,
                    fullName: response.parent.full_name
                } : null
            };
        } catch (error) {
            console.error('❌ Failed to get repository stats:', error.message);
            return { error: error.message };
        }
    }
}

module.exports = GitHubAPI; 