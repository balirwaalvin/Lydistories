# Digital Ocean Deployment Guide for Lydistories

## Overview
This guide will walk you through deploying your Lydistories website to Digital Ocean, a cloud hosting platform. We'll set up a complete production environment.

## What You'll Get
- **Live Website**: Your site accessible from anywhere
- **Custom Domain**: (optional) www.lydistories.com
- **SSL Certificate**: Automatic HTTPS encryption
- **Fast Performance**: CDN and optimized delivery
- **Automatic Backups**: Your data is protected

## Deployment Options

### Option 1: Digital Ocean App Platform (Recommended - Easiest)
- **Best for**: Static websites, automatic deployments
- **Cost**: $5-12/month
- **Setup Time**: 15 minutes
- **Difficulty**: ⭐ Easy

### Option 2: Digital Ocean Droplet (More Control)
- **Best for**: Full control, custom configuration
- **Cost**: $6-12/month
- **Setup Time**: 45 minutes
- **Difficulty**: ⭐⭐⭐ Intermediate

### Option 3: Digital Ocean Spaces (Static Hosting)
- **Best for**: Simple static hosting with CDN
- **Cost**: $5/month
- **Setup Time**: 20 minutes
- **Difficulty**: ⭐⭐ Easy-Medium

---

## OPTION 1: App Platform Deployment (Recommended)

### Step 1: Prepare Your Code

#### 1.1 Create GitHub Repository
1. Go to https://github.com
2. Sign up or login
3. Click "New Repository"
4. Name: `lydistories`
5. Keep it Public (or Private if you prefer)
6. Click "Create repository"

#### 1.2 Upload Your Code to GitHub

**Option A: Using GitHub Desktop (Easiest)**
1. Download GitHub Desktop: https://desktop.github.com/
2. Install and login
3. Click "Add" → "Add Existing Repository"
4. Select your Lydistories folder
5. Click "Publish repository"
6. Done!

**Option B: Using Git Command Line**
Open PowerShell in your project folder and run:

```powershell
# Initialize git
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit of Lydistories website"

# Add remote repository (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_USERNAME/lydistories.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 2: Create Digital Ocean Account

1. Go to https://www.digitalocean.com/
2. Click "Sign Up"
3. Use this link for **$200 free credit**: https://m.do.co/c/digital-ocean-promo
4. Verify your email
5. Add payment method (won't be charged during free trial)

### Step 3: Deploy with App Platform

1. Log into Digital Ocean Dashboard
2. Click "Create" → "Apps"
3. **Source Code**:
   - Connect to GitHub
   - Authorize Digital Ocean
   - Select `lydistories` repository
   - Branch: `main`
4. **App Settings**:
   - Name: `lydistories`
   - Region: Choose closest to Uganda (Frankfurt or London)
   - Branch: `main`
5. **Build Settings**:
   - Type: Static Site
   - Build Command: (leave empty)
   - Output Directory: `/` (root)
6. Click "Next"
7. **Plan**: Choose "Basic" ($5/month or free tier)
8. Click "Launch Basic App"
9. Wait 5-10 minutes for deployment

### Step 4: Your Site is Live!

Your site will be available at:
```
https://lydistories-xxxxx.ondigitalocean.app
```

### Step 5: Add Custom Domain (Optional)

1. Buy a domain from:
   - Namecheap: https://www.namecheap.com
   - Google Domains: https://domains.google
   - Or any registrar

2. In Digital Ocean App Platform:
   - Go to your app → Settings → Domains
   - Click "Add Domain"
   - Enter your domain: `lydistories.com`
   - Add DNS records to your domain registrar:
     ```
     Type: CNAME
     Name: www
     Value: [Digital Ocean provided value]
     
     Type: A
     Name: @
     Value: [Digital Ocean provided IP]
     ```

3. Wait 24-48 hours for DNS propagation

---

## OPTION 2: Droplet Deployment (Full Control)

### Step 1: Create Droplet

1. Login to Digital Ocean
2. Click "Create" → "Droplets"
3. **Choose Image**: Ubuntu 22.04 LTS
4. **Choose Plan**: 
   - Basic
   - Regular CPU
   - $6/month (1GB RAM, 25GB SSD)
5. **Choose Region**: Frankfurt or London (closest to Uganda)
6. **Authentication**: 
   - Select "Password"
   - Set a strong root password
7. **Hostname**: `lydistories-web`
8. Click "Create Droplet"
9. Wait 1 minute for creation

### Step 2: Connect to Your Droplet

Open PowerShell and connect via SSH:
```powershell
ssh root@YOUR_DROPLET_IP
```
Enter your password when prompted.

### Step 3: Install Web Server

Run these commands one by one:

```bash
# Update system
apt update && apt upgrade -y

# Install Nginx (web server)
apt install nginx -y

# Start Nginx
systemctl start nginx
systemctl enable nginx

# Install Certbot (for SSL)
apt install certbot python3-certbot-nginx -y
```

### Step 4: Upload Your Website

**Option A: Using FileZilla (Easiest)**
1. Download FileZilla: https://filezilla-project.org/
2. Install and open
3. Connect:
   - Host: `sftp://YOUR_DROPLET_IP`
   - Username: `root`
   - Password: Your droplet password
   - Port: `22`
4. Navigate to `/var/www/html/`
5. Delete default files
6. Upload all your Lydistories files

**Option B: Using SCP (Command Line)**
In PowerShell on your local machine:
```powershell
# Go to your project folder
cd "C:\Users\EduScan\OneDrive\Documents\VS Code Programs\Lydistories"

# Upload all files
scp -r * root@YOUR_DROPLET_IP:/var/www/html/
```

### Step 5: Configure Nginx

On your droplet, create Nginx config:
```bash
nano /etc/nginx/sites-available/lydistories
```

Paste this configuration:
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;
    
    root /var/www/html;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    # Enable gzip compression
    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
    
    # Cache static files
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Save and exit (Ctrl+X, Y, Enter)

Enable the site:
```bash
ln -s /etc/nginx/sites-available/lydistories /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### Step 6: Setup SSL Certificate (HTTPS)

If you have a domain:
```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Follow the prompts. Choose option 2 to redirect HTTP to HTTPS.

### Step 7: Your Site is Live!

Visit: `http://YOUR_DROPLET_IP` or `https://yourdomain.com`

---

## OPTION 3: Digital Ocean Spaces (CDN Hosting)

### Step 1: Create a Space

1. Login to Digital Ocean
2. Click "Create" → "Spaces"
3. **Settings**:
   - Region: Frankfurt or London
   - Enable CDN: Yes
   - Name: `lydistories`
   - Restrict File Listing: No
4. Click "Create Space"

### Step 2: Upload Files

1. In your Space, click "Upload Files"
2. Select all files from your Lydistories folder
3. Wait for upload (may take 5-10 minutes)
4. Keep folder structure intact

### Step 3: Configure for Website Hosting

1. Go to your Space → Settings
2. Click "Add" under CORS configurations
3. Add these origins:
   ```
   *
   ```
4. Save

### Step 4: Set Index Page

1. In Settings, find "Index Document"
2. Set to: `index.html`
3. Set Error Document to: `index.html`

### Step 5: Your Site is Live!

Your URL will be:
```
https://lydistories.fra1.cdn.digitaloceanspaces.com
```

Or with CDN:
```
https://lydistories.fra1.digitaloceanspaces.com
```

---

## Post-Deployment Setup

### 1. Update Theme Switcher

The theme switcher will work automatically across your deployed site.

### 2. Update Mobile Money Integration

For production, you'll need to integrate real payment APIs:
- **MTN Mobile Money API**: https://momodeveloper.mtn.com/
- **Airtel Money API**: https://developers.airtel.africa/

### 3. Setup Analytics (Optional)

Add Google Analytics to track visitors:
1. Go to https://analytics.google.com
2. Create account and property
3. Get tracking code
4. Add to all HTML pages before `</head>`

### 4. Setup Contact Form Email

Since you're using localStorage for messages, consider:
- **EmailJS**: https://www.emailjs.com/ (free tier)
- **Formspree**: https://formspree.io/
- **SendGrid**: https://sendgrid.com/

### 5. Regular Backups

**For Droplet:**
```bash
# Create backup script
nano /root/backup.sh
```

Add:
```bash
#!/bin/bash
tar -czf /root/backups/lydistories-$(date +%Y%m%d).tar.gz /var/www/html/
```

Make executable and schedule:
```bash
chmod +x /root/backup.sh
mkdir -p /root/backups
crontab -e
```

Add this line:
```
0 2 * * * /root/backup.sh
```

**For App Platform & Spaces:**
Automatic backups are handled by Digital Ocean.

---

## Cost Breakdown

| Service | Monthly Cost | Best For |
|---------|--------------|----------|
| App Platform | $5-12 | Easy deployment, auto-updates |
| Droplet (Basic) | $6 | Full control, custom config |
| Spaces + CDN | $5 | Static hosting, fast global delivery |
| Domain (optional) | $10-15/year | Professional URL |

**Free Credit**: $200 for 60 days (covers 3-4 months)

---

## Maintenance & Updates

### Updating Your Site

**App Platform (GitHub):**
1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update website"
   git push
   ```
3. App Platform auto-deploys in 2-3 minutes

**Droplet:**
```powershell
# Upload changed files
scp changed-file.html root@YOUR_IP:/var/www/html/
```

**Spaces:**
1. Upload new files via Digital Ocean dashboard
2. Overwrite existing files

---

## Troubleshooting

### Site Not Loading
1. Check Nginx status: `systemctl status nginx`
2. Check error logs: `tail -f /var/log/nginx/error.log`
3. Verify files in `/var/www/html/`

### SSL Certificate Issues
```bash
# Renew certificate
certbot renew
```

### 502 Bad Gateway
```bash
# Restart Nginx
systemctl restart nginx
```

### File Permission Issues
```bash
# Fix permissions
chmod -R 755 /var/www/html/
chown -R www-data:www-data /var/www/html/
```

---

## Security Best Practices

### 1. Firewall Setup (Droplet)
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 2. Change SSH Port (Droplet)
```bash
nano /etc/ssh/sshd_config
# Change Port 22 to Port 2222
systemctl restart sshd
```

### 3. Create Non-Root User (Droplet)
```bash
adduser lydiadmin
usermod -aG sudo lydiadmin
```

### 4. Keep System Updated
```bash
apt update && apt upgrade -y
```

---

## Monitoring & Performance

### 1. Setup Uptime Monitoring
- **UptimeRobot**: https://uptimerobot.com/ (free)
- **Pingdom**: https://www.pingdom.com/

### 2. Performance Optimization

**Enable Gzip** (already in Nginx config above)

**Optimize Images**: Use https://tinypng.com/ before uploading

**Minify CSS/JS**: Use https://www.minifier.org/

### 3. Monitor Server Resources (Droplet)
```bash
# Check CPU/RAM usage
htop

# Check disk space
df -h

# Check bandwidth
vnstat
```

---

## Support & Resources

- **Digital Ocean Docs**: https://docs.digitalocean.com/
- **Community Tutorials**: https://www.digitalocean.com/community/tutorials
- **Support Tickets**: Available in dashboard
- **YouTube**: Search "Digital Ocean deployment tutorial"

---

## Next Steps

1. ✅ Choose deployment option (I recommend Option 1: App Platform)
2. ✅ Create Digital Ocean account
3. ✅ Upload code to GitHub (if using App Platform)
4. ✅ Deploy following the steps above
5. ✅ Test your live site
6. ✅ (Optional) Setup custom domain
7. ✅ (Optional) Integrate payment APIs
8. ✅ Share your site with the world!

---

## Quick Start Commands Summary

**Droplet Setup:**
```bash
# After SSH into droplet
apt update && apt upgrade -y
apt install nginx certbot python3-certbot-nginx -y
systemctl start nginx
# Upload files to /var/www/html/
certbot --nginx -d yourdomain.com
```

**Local Git Setup:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/lydistories.git
git push -u origin main
```

Your Lydistories website will be live and accessible worldwide! 🚀
