const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const GitHubAPI = require('./github-api');
require('dotenv').config();

class AutoGitManager {
    constructor() {
        this.githubAPI = new GitHubAPI();
        this.gitAuthorName = process.env.GIT_AUTHOR_NAME || 'My Icons Bot';
        this.gitAuthorEmail = process.env.GIT_AUTHOR_EMAIL || 'bot@myicons.com';
        this.commitMessagePrefix = process.env.COMMIT_MESSAGE_PREFIX || '🤖 Auto-update:';
        this.isInitialized = false;
        this.forkInfo = null;
    }

    // Initialize git configuration
    async initialize() {
        if (this.isInitialized) return;

        try {
            // Configure git user
            await this.execGitCommand(`config user.name "${this.gitAuthorName}"`);
            await this.execGitCommand(`config user.email "${this.gitAuthorEmail}"`);
            
            // Check if we need to setup fork
            if (this.githubAPI.token) {
                const forkResult = await this.githubAPI.autoForkAndSetup();
                if (forkResult.success && forkResult.forkCreated) {
                    this.forkInfo = {
                        name: forkResult.forkName,
                        url: forkResult.forkUrl
                    };
                    console.log(`🔄 Auto-fork setup complete: ${forkResult.forkUrl}`);
                }
            }

            this.isInitialized = true;
            console.log('✅ Auto Git Manager initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Auto Git Manager:', error.message);
            throw error;
        }
    }

    // Execute git command
    execGitCommand(command) {
        return new Promise((resolve, reject) => {
            exec(`git ${command}`, { cwd: process.cwd() }, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Git command failed: git ${command}`);
                    console.error('Error:', error.message);
                    reject(error);
                } else {
                    resolve(stdout.trim());
                }
            });
        });
    }

    // Check git status
    async getGitStatus() {
        try {
            const status = await this.execGitCommand('status --porcelain');
            return status ? status.split('\n').filter(line => line.trim()) : [];
        } catch (error) {
            console.error('❌ Failed to get git status:', error.message);
            return [];
        }
    }

    // Add all changes
    async addAll() {
        try {
            console.log('📁 Adding all changes...');
            await this.execGitCommand('add .');
            console.log('✅ All changes added');
            return true;
        } catch (error) {
            console.error('❌ Failed to add changes:', error.message);
            return false;
        }
    }

    // Commit changes
    async commit(message) {
        try {
            const fullMessage = `${this.commitMessagePrefix} ${message}`;
            console.log(`💾 Committing: ${fullMessage}`);
            await this.execGitCommand(`commit -m "${fullMessage}"`);
            console.log('✅ Changes committed');
            return true;
        } catch (error) {
            console.error('❌ Failed to commit:', error.message);
            return false;
        }
    }

    // Push changes
    async push(branch = 'main') {
        try {
            console.log(`🚀 Pushing to ${branch}...`);
            await this.execGitCommand(`push origin ${branch}`);
            console.log('✅ Changes pushed successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to push:', error.message);
            return false;
        }
    }

    // Pull latest changes
    async pull(branch = 'main') {
        try {
            console.log(`📥 Pulling latest changes from ${branch}...`);
            await this.execGitCommand(`pull origin ${branch}`);
            console.log('✅ Latest changes pulled');
            return true;
        } catch (error) {
            console.error('❌ Failed to pull:', error.message);
            return false;
        }
    }

    // Auto workflow: add, commit, push
    async autoCommitAndPush(message, files = []) {
        try {
            await this.initialize();

            // Check if there are changes
            const status = await this.getGitStatus();
            if (status.length === 0) {
                console.log('ℹ️  No changes to commit');
                return { success: true, message: 'No changes to commit' };
            }

            console.log(`📋 Changes detected: ${status.length} files`);

            // Add all changes
            const addSuccess = await this.addAll();
            if (!addSuccess) {
                return { success: false, error: 'Failed to add changes' };
            }

            // Commit changes
            const commitSuccess = await this.commit(message);
            if (!commitSuccess) {
                return { success: false, error: 'Failed to commit changes' };
            }

            // Push changes
            const pushSuccess = await this.push();
            if (!pushSuccess) {
                return { success: false, error: 'Failed to push changes' };
            }

            // If we have GitHub API, also update via API
            if (this.githubAPI.token) {
                await this.updateViaGitHubAPI(files, message);
            }

            return {
                success: true,
                message: 'Changes committed and pushed successfully',
                filesChanged: status.length,
                forkInfo: this.forkInfo
            };

        } catch (error) {
            console.error('❌ Auto commit and push failed:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Update files via GitHub API
    async updateViaGitHubAPI(files, message) {
        try {
            console.log('🌐 Updating via GitHub API...');
            
            for (const file of files) {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    const result = await this.githubAPI.createOrUpdateFile(
                        file,
                        content,
                        `${this.commitMessagePrefix} ${message}`,
                        'main'
                    );
                    
                    if (result.success) {
                        console.log(`✅ Updated ${file} via GitHub API`);
                    } else {
                        console.warn(`⚠️  Failed to update ${file} via API: ${result.error}`);
                    }
                }
            }
        } catch (error) {
            console.error('❌ GitHub API update failed:', error.message);
        }
    }

    // Create pull request to original repository
    async createPullRequestToOriginal(title, body, branch = 'main') {
        try {
            if (!this.forkInfo) {
                return { success: false, error: 'No fork information available' };
            }

            console.log('🔀 Creating pull request to original repository...');
            
            const result = await this.githubAPI.createPullRequest(
                title,
                body,
                `${this.githubAPI.username}:${branch}`,
                branch
            );

            if (result.success) {
                console.log(`✅ Pull request created: ${result.url}`);
                return result;
            } else {
                return result;
            }
        } catch (error) {
            console.error('❌ Failed to create pull request:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Get repository information
    async getRepositoryInfo() {
        try {
            const stats = await this.githubAPI.getRepositoryStats();
            return {
                ...stats,
                forkInfo: this.forkInfo,
                hasToken: !!this.githubAPI.token,
                autoForkEnabled: this.githubAPI.autoForkEnabled
            };
        } catch (error) {
            console.error('❌ Failed to get repository info:', error.message);
            return { error: error.message };
        }
    }

    // Sync with original repository
    async syncWithOriginal() {
        try {
            console.log('🔄 Syncing with original repository...');
            
            // Add original repository as upstream
            await this.execGitCommand('remote add upstream https://github.com/dwirx/my-icons.git');
            
            // Fetch latest changes
            await this.execGitCommand('fetch upstream');
            
            // Merge upstream changes
            await this.execGitCommand('merge upstream/main');
            
            // Push to fork
            await this.push();
            
            console.log('✅ Synced with original repository');
            return { success: true };
        } catch (error) {
            console.error('❌ Failed to sync with original:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Get commit history
    async getCommitHistory(limit = 10) {
        try {
            const history = await this.execGitCommand(`log --oneline -${limit}`);
            return history.split('\n').filter(line => line.trim());
        } catch (error) {
            console.error('❌ Failed to get commit history:', error.message);
            return [];
        }
    }

    // Check if repository is up to date
    async isUpToDate() {
        try {
            await this.execGitCommand('fetch origin');
            const local = await this.execGitCommand('rev-parse HEAD');
            const remote = await this.execGitCommand('rev-parse origin/main');
            return local === remote;
        } catch (error) {
            console.error('❌ Failed to check if up to date:', error.message);
            return false;
        }
    }
}

module.exports = AutoGitManager; 