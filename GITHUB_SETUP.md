# GitHub API Setup Guide

## 🔑 Setup GitHub Personal Access Token

### 1. Create Personal Access Token
1. Go to GitHub.com and sign in
2. Click your profile picture → Settings
3. Scroll down to "Developer settings" (bottom left)
4. Click "Personal access tokens" → "Tokens (classic)"
5. Click "Generate new token" → "Generate new token (classic)"
6. Give it a name like "My Icons Bot"
7. Set expiration (recommend: 90 days)
8. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (Update GitHub Action workflows)
   - ✅ `write:packages` (Upload packages to GitHub Package Registry)
   - ✅ `delete:packages` (Delete packages from GitHub Package Registry)

### 2. Copy Token
Copy the generated token (it looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

## ⚙️ Configure Environment Variables

### 1. Update .env File
Edit the `.env` file in your project root:

```env
# GitHub API Configuration
GITHUB_TOKEN=ghp_your_actual_token_here
GITHUB_USERNAME=your_github_username
GITHUB_REPO=my-icons
GITHUB_BRANCH=main

# Repository Settings
REPO_OWNER=dwirx
REPO_NAME=my-icons
DEFAULT_BRANCH=main

# Auto-fork Settings
AUTO_FORK_ENABLED=true
FORK_PREFIX=my-icons-fork
MAX_FORK_ATTEMPTS=5

# Git Settings
GIT_AUTHOR_NAME=My Icons Bot
GIT_AUTHOR_EMAIL=bot@myicons.com
COMMIT_MESSAGE_PREFIX=🤖 Auto-update:

# Server Settings
PORT=3001
NODE_ENV=development
```

### 2. Replace Values
- `GITHUB_TOKEN`: Your personal access token from step 1
- `GITHUB_USERNAME`: Your GitHub username
- `REPO_OWNER`: Original repository owner (dwirx)
- `REPO_NAME`: Repository name (my-icons)

## 🔄 Auto-Fork Functionality

### How It Works
1. **Access Check**: System checks if you have write access to the original repository
2. **Auto-Fork**: If no access, automatically creates a fork
3. **Remote Update**: Updates local git remote to point to your fork
4. **Auto-Commit**: Automatically commits and pushes changes to your fork
5. **Pull Request**: Can create pull requests to the original repository

### Fork Scenarios

#### Scenario 1: You have write access to original repo
```
✅ Direct push to original repository
```

#### Scenario 2: You don't have write access
```
🔄 Auto-fork created: your-username/my-icons
✅ Push to your fork
🔀 Option to create pull request to original
```

#### Scenario 3: Repository is already forked
```
✅ Use existing fork
✅ Push to your fork
```

## 🚀 Features

### Automatic Git Operations
- **Auto Add**: `git add .` for all changes
- **Auto Commit**: Automatic commit with descriptive messages
- **Auto Push**: Push to your repository (original or fork)
- **Auto Sync**: Sync with original repository

### GitHub API Integration
- **Repository Info**: Get stats, stars, forks, etc.
- **File Management**: Create/update files via API
- **Pull Requests**: Create PRs to original repository
- **Fork Management**: Automatic fork creation and setup

### Error Handling
- **Token Validation**: Check if token is valid
- **Access Control**: Verify repository access
- **Fallback**: Graceful degradation if API fails
- **Retry Logic**: Multiple attempts for fork creation

## 📋 API Endpoints

### Repository Information
```bash
GET /api/repo-info
```
Returns repository statistics and fork information.

### Sync with Original
```bash
POST /api/sync-repo
```
Syncs your fork with the original repository.

### Upload with Auto-Commit
```bash
POST /api/upload
```
Uploads file and automatically commits/pushes changes.

## 🔧 Troubleshooting

### Common Issues

#### 1. "GITHUB_TOKEN not found"
**Solution**: Make sure your `.env` file exists and contains the token.

#### 2. "Repository not found"
**Solution**: Check `REPO_OWNER` and `REPO_NAME` in `.env`.

#### 3. "No write access"
**Solution**: The system will automatically create a fork.

#### 4. "Fork creation failed"
**Solution**: 
- Check if you have permission to create forks
- Verify your token has the correct scopes
- Try again (system will retry automatically)

#### 5. "Git operations failed"
**Solution**:
- Check if git is configured properly
- Verify remote URL is correct
- Check network connectivity

### Debug Mode
Enable debug logging by setting:
```env
NODE_ENV=development
```

## 🔒 Security Notes

### Token Security
- **Never commit** your `.env` file to git
- **Rotate tokens** regularly (90 days recommended)
- **Use minimal scopes** required for functionality
- **Monitor token usage** in GitHub settings

### Repository Security
- **Fork isolation**: Your changes are isolated in your fork
- **Pull request review**: Changes to original repo require PR approval
- **Access control**: Only you can push to your fork

## 📈 Monitoring

### Check Repository Status
```bash
curl http://localhost:3001/api/repo-info
```

### View Git History
```bash
git log --oneline -10
```

### Check Fork Status
```bash
git remote -v
```

## 🎯 Best Practices

### 1. Token Management
- Use environment-specific tokens
- Rotate tokens regularly
- Monitor token usage

### 2. Commit Messages
- Use descriptive commit messages
- Include file information
- Follow conventional commits

### 3. Fork Management
- Keep fork up to date
- Create pull requests for significant changes
- Clean up old branches

### 4. Error Handling
- Monitor logs for errors
- Set up alerts for failed operations
- Have fallback procedures

## 🔄 Workflow Examples

### Upload New Icon
1. User uploads icon via web interface
2. System validates and saves file
3. Auto-commit with message: "🤖 Auto-update: Add icon: icon-name.png to category"
4. Auto-push to repository (original or fork)
5. User gets success notification

### Delete Icon
1. User deletes icon via web interface
2. System removes file from filesystem
3. Auto-commit with message: "🤖 Auto-update: Delete icon: icon-name.png from category"
4. Auto-push to repository
5. User gets success notification

### Sync with Original
1. User clicks "Sync" button
2. System fetches latest changes from original
3. Merges changes into local repository
4. Pushes updated fork
5. User gets sync completion notification 