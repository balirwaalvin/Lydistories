# GitHub Deployment Guide for Lydistories

## Step 1: Install Git

### Download Git
1. Go to: https://git-scm.com/download/win
2. Download "64-bit Git for Windows Setup"
3. Run the installer
4. **Important Installation Settings**:
   - ✅ Use Visual Studio Code as Git's default editor (if you have VS Code)
   - ✅ Git from the command line and also from 3rd-party software
   - ✅ Use the OpenSSL library
   - ✅ Checkout Windows-style, commit Unix-style line endings
   - ✅ Use MinTTY
   - ✅ Default (fast-forward or merge)
   - ✅ Git Credential Manager
   - ✅ Enable file system caching
5. Click "Install"
6. Click "Finish"
7. **Restart PowerShell** after installation

### Verify Installation
Open a new PowerShell window and run:
```powershell
git --version
```
You should see: `git version 2.x.x`

---

## Step 2: Configure Git

Open PowerShell and run these commands (replace with your info):

```powershell
# Set your name
git config --global user.name "Your Name"

# Set your email
git config --global user.email "your.email@example.com"

# Verify settings
git config --list
```

---

## Step 3: Create GitHub Account

1. Go to https://github.com
2. Click "Sign up"
3. Enter your email address
4. Create a password
5. Choose a username (e.g., `lydia-stories` or your name)
6. Verify you're not a robot
7. Check your email and verify your account

---

## Step 4: Create GitHub Repository

### Option A: Via GitHub Website (Easier)
1. Login to GitHub
2. Click the "+" icon (top right) → "New repository"
3. Repository settings:
   - **Name**: `lydistories`
   - **Description**: "Online book store for Ugandan readers - browse, purchase, and read books with Mobile Money payment"
   - **Visibility**: Public (or Private if you prefer)
   - **DO NOT** initialize with README (we'll push existing code)
4. Click "Create repository"
5. **Keep this page open** - you'll need the URL

### Repository URL Format
```
https://github.com/YOUR_USERNAME/lydistories.git
```

---

## Step 5: Initialize Git in Your Project

Open PowerShell and run:

```powershell
# Navigate to your project folder
cd "C:\Users\EduScan\OneDrive\Documents\VS Code Programs\Lydiastories"

# Initialize Git repository
git init

# Check status (see all files)
git status
```

---

## Step 6: Create .gitignore File

This tells Git which files to ignore.

Create a file named `.gitignore` in your project root with this content:

```
# OS Files
.DS_Store
Thumbs.db
desktop.ini

# Editor Files
.vscode/
.idea/
*.swp
*.swo
*~

# Logs
*.log
npm-debug.log*
yarn-debug.log*

# Temporary files
*.tmp
*.temp

# Personal notes (optional)
notes.txt
TODO.md
```

---

## Step 7: Add Files to Git

In PowerShell, run:

```powershell
# Add all files to staging
git add .

# Check what's being added
git status

# Commit the files
git commit -m "Initial commit: Lydistories book store website"
```

You should see a message like:
```
[main (root-commit) abc1234] Initial commit: Lydistories book store website
 XX files changed, XXXX insertions(+)
```

---

## Step 8: Connect to GitHub

```powershell
# Add GitHub repository as remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/lydistories.git

# Verify remote was added
git remote -v
```

---

## Step 9: Push to GitHub

```powershell
# Rename branch to 'main' (GitHub's default)
git branch -M main

# Push code to GitHub
git push -u origin main
```

### If Asked for Credentials
- **Username**: Your GitHub username
- **Password**: Use a Personal Access Token (not your account password)

#### Creating Personal Access Token:
1. Go to GitHub.com
2. Click your profile picture → Settings
3. Scroll down → Developer settings
4. Personal access tokens → Tokens (classic)
5. Generate new token (classic)
6. Name: `Lydistories Deployment`
7. Expiration: 90 days (or longer)
8. Select scopes: ✅ `repo` (all repo permissions)
9. Click "Generate token"
10. **Copy the token immediately** (you won't see it again!)
11. Use this token as your password when pushing

---

## Step 10: Verify Upload

1. Go to your GitHub repository page
2. Refresh the page
3. You should see all your files!

**Your repository URL**: `https://github.com/YOUR_USERNAME/lydistories`

---

## Step 11: Future Updates (How to Push Changes)

After making changes to your code:

```powershell
# Check what changed
git status

# Add all changes
git add .

# Commit with a descriptive message
git commit -m "Description of what you changed"

# Push to GitHub
git push
```

---

## Using GitHub Desktop (Alternative - Easier)

If command line seems complicated, use GitHub Desktop:

### Install GitHub Desktop
1. Download: https://desktop.github.com/
2. Install and open
3. Sign in with your GitHub account

### Publish Your Repository
1. Click "File" → "Add local repository"
2. Choose your Lydistories folder
3. If prompted "not a Git repository", click "Create repository"
4. Fill in:
   - Name: `lydistories`
   - Description: "Online book store website"
   - Keep other defaults
5. Click "Create repository"
6. Click "Publish repository" button
7. Uncheck "Keep this code private" (or keep checked for private)
8. Click "Publish repository"

### Making Updates with GitHub Desktop
1. Make changes to your files
2. GitHub Desktop will show changes automatically
3. Write a summary in "Summary" field (e.g., "Updated contact page")
4. Click "Commit to main"
5. Click "Push origin" to upload to GitHub

---

## Troubleshooting

### Error: "fatal: not a git repository"
```powershell
# Make sure you're in the right folder
cd "C:\Users\EduScan\OneDrive\Documents\VS Code Programs\Lydiastories"

# Initialize git
git init
```

### Error: "Permission denied (publickey)"
Use HTTPS instead of SSH:
```powershell
git remote set-url origin https://github.com/YOUR_USERNAME/lydistories.git
```

### Error: "Updates were rejected"
```powershell
# Pull latest changes first
git pull origin main --rebase

# Then push
git push
```

### Files Not Showing on GitHub
```powershell
# Check if remote is set correctly
git remote -v

# Check if you pushed
git log --oneline

# Push again
git push -u origin main
```

---

## What's Next?

After your code is on GitHub, you can:

1. ✅ **Deploy to Digital Ocean App Platform**
   - Connects directly to GitHub
   - Auto-deploys when you push updates
   - Follow DIGITALOCEAN_DEPLOYMENT_GUIDE.md

2. ✅ **Share Your Code**
   - Send repository link to others
   - Collaborate with team members

3. ✅ **Version Control**
   - Track all changes
   - Revert if something breaks
   - See history of modifications

4. ✅ **Backup**
   - Your code is safely stored in the cloud
   - Never lose your work

---

## Quick Reference

```powershell
# Initialize repository
git init

# Add files
git add .

# Commit changes
git commit -m "Your message"

# Add remote
git remote add origin https://github.com/USERNAME/lydistories.git

# Push to GitHub
git push -u origin main

# Check status
git status

# View commit history
git log --oneline

# Pull latest changes
git pull
```

---

## Repository Structure

Your GitHub repository will look like this:

```
lydistories/
├── css/
│   ├── admin.css
│   ├── reader.css
│   └── style.css
├── js/
│   ├── admin-dashboard.js
│   ├── admin-login.js
│   ├── appwrite-config.js
│   ├── appwrite-service.js
│   ├── contact.js
│   ├── library.js
│   ├── main.js
│   ├── order.js
│   ├── reader.js
│   └── theme-switcher.js
├── admin-dashboard.html
├── admin-login.html
├── contact.html
├── index.html
├── library.html
├── order.html
├── reader.html
├── README.md
├── .gitignore
└── [guide files]
```

---

## Security Notes

⚠️ **Never commit sensitive data**:
- Don't commit real API keys
- Don't commit passwords
- Don't commit personal information
- Use `.gitignore` to exclude sensitive files

✅ **Safe to commit**:
- HTML, CSS, JavaScript files
- Images (book covers)
- Documentation
- Configuration templates (without real keys)

---

Once your code is on GitHub, come back and we'll deploy it to Digital Ocean! 🚀
