# 🚀 Complete cPanel Deployment Guide for Udaan Agencies
## Your First-Time Setup Guide for https://udaanagencies.com.np/

---

## 📋 What You Need Before Starting

✅ **Your cPanel hosting account**  
✅ **Domain**: udaanagencies.com.np (already configured)  
✅ **Node.js support** enabled in your cPanel  
✅ **This project files** (ready to upload)  

> 💡 **Good News**: This project uses a **JSON database system**, so NO PostgreSQL setup needed!

---

## 🎯 Step-by-Step Deployment Process

### **Step 1: Download Your Project Files**

**Option A: From Replit (Recommended)**
1. In your Replit project, click the **hamburger menu (≡)**
2. Select **"Export as zip"**
3. Download the complete project zip file to your computer
4. Extract the zip file - you'll see all your project folders

**Option B: Manual Download**
If export doesn't work, manually copy these essential files:
- All files in `server/` folder
- All files in `client/` folder  
- `package.json` and `package-lock.json`
- The database folder: `06jbjz5PvFtImMG2VzFz6LHiD0Uom5E9ltYCAfKtS2sZAXCixewC4BfqBHBha5HUh328YEL2BBHEKpTe/`
- `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`
- `postcss.config.js`, `components.json`

---

### **Step 2: Access Your cPanel**

1. **Log into your cPanel** at your hosting provider
2. **Find File Manager** (usually in "Files" section)
3. **Navigate to public_html** (this is where your website files go)
4. **Make sure it's empty** or backup existing files

---

### **Step 3: Upload Project Files**

**Method 1: Using File Manager Upload**
1. In cPanel File Manager, go to `public_html`
2. Click **"Upload"** button
3. Select your project zip file
4. After upload, **right-click the zip** → **"Extract"**
5. **Move all extracted files** to the main `public_html` directory
6. **Delete the empty zip file**

**Method 2: Using cPanel File Manager Directly**
1. Create these folders in `public_html`:
   - `server/`
   - `client/`
   - `06jbjz5PvFtImMG2VzFz6LHiD0Uom5E9ltYCAfKtS2sZAXCixewC4BfqBHBha5HUh328YEL2BBHEKpTe/`
2. Upload files to their respective folders
3. Upload the JSON database files to the long folder name

---

### **Step 4: Set File Permissions**

In File Manager, select all folders and files, then:
1. **Right-click** → **"Permissions"**
2. **For Files**: Set to `644` (Read/Write for owner, Read for others)
3. **For Folders**: Set to `755` (Full access for owner, Read/Execute for others)
4. **Apply to all files and subdirectories**

**Special Permissions Needed**:
- `server/uploads/` folder: `755` (must be writable)
- `06jbjz5PvFtImMG2VzFz6LHiD0Uom5E9ltYCAfKtS2sZAXCixewC4BfqBHBha5HUh328YEL2BBHEKpTe/` folder: `755` (database files)

---

### **Step 5: Install Node.js Dependencies**

**Find Terminal in cPanel**:
- Look for **"Terminal"** in cPanel (sometimes under "Advanced" section)
- If no terminal, ask your hosting provider to enable SSH access

**Run Installation Commands**:
```bash
# Navigate to your website folder
cd /home/yourusername/public_html

# Install all required packages
npm install --legacy-peer-deps --omit=dev

# If above fails, try this:
npm install --force --omit=dev
```

> 💡 **Note**: Replace `yourusername` with your actual cPanel username

**If npm install fails**:
- Check if Node.js is enabled in cPanel
- Contact your hosting provider for Node.js support
- Verify you're in the correct directory

---

### **Step 6: Configure Environment Settings**

**Create a `.env` file** in your `public_html` directory:

```env
# Production Environment
NODE_ENV=production

# Application Settings
PORT=5000

# Security Settings (CHANGE THESE!)
SESSION_SECRET=udaan_super_secure_secret_2025_change_this
DB_ENCRYPTION_KEY=udaan_secure_db_key_2025_change_this

# Admin Settings
ADMIN_USERNAME=Admin_Udaan_7075
ADMIN_PASSWORD=udaan7075973
ADMIN_EMAIL=info.udaanagencies@gmail.com

# Domain Configuration
ALLOWED_ORIGINS=https://udaanagencies.com.np,http://localhost:3000
```

> 🔐 **SECURITY WARNING**: Change `SESSION_SECRET` and `DB_ENCRYPTION_KEY` to your own random values!

**How to create .env file**:
1. In File Manager, click **"New File"**
2. Name it `.env` (with the dot)
3. Edit the file and paste the content above
4. Save the file

---

### **Step 7: Build the Application**

In Terminal, run the build command:

```bash
# Build the frontend and backend
npm run build
```

**This creates**:
- `dist/` folder with your server code
- `dist/public/` folder with your website files

**If build fails**:
- Check for error messages
- Make sure all dependencies installed correctly
- Verify TypeScript and Vite are properly installed

---

### **Step 8: Start Your Application**

**Option A: Simple Start (for testing)**
```bash
npm start
```

**Option B: Using PM2 (Recommended for Production)**
```bash
# Install PM2 globally
npm install -g pm2

# Start your application
pm2 start dist/index.js --name "udaan-agencies"

# Make it restart automatically on server reboot
pm2 startup
pm2 save
```

> 💪 **PM2 Benefits**: Keeps your app running even if it crashes, restarts automatically

---

### **Step 9: Configure Web Server Routing**

**For Apache Hosting (Most Common)**:

Create `.htaccess` file in your `public_html`:

```apache
RewriteEngine On

# Handle Node.js application
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]

# Security Headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"

# Enable Compression
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/plain
    AddOutputFilterByType DEFLATE text/html
    AddOutputFilterByType DEFLATE text/xml
    AddOutputFilterByType DEFLATE text/css
    AddOutputFilterByType DEFLATE application/xml
    AddOutputFilterByType DEFLATE application/xhtml+xml
    AddOutputFilterByType DEFLATE application/rss+xml
    AddOutputFilterByType DEFLATE application/javascript
    AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>

# Cache Static Files
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/ico "access plus 1 year"
    ExpiresByType image/icon "access plus 1 year"
    ExpiresByType text/plain "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 year"
    ExpiresByType text/html "access plus 1 hour"
</IfModule>
```

---

### **Step 10: Test Your Website**

1. **Visit your website**: https://udaanagencies.com.np
2. **Check if it loads** properly
3. **Test key features**:
   - Homepage loads
   - Jobs page shows listings
   - Testimonials display
   - Forms work
   - Admin login works

**If website doesn't load**:
- Check if Node.js app is running: `pm2 status`
- Check error logs: `pm2 logs udaan-agencies`
- Verify .htaccess is correct
- Contact hosting support

---

### **Step 11: Setup Admin Access**

Your admin account is pre-configured:
- **Username**: Admin_Udaan_7075
- **Password**: udaan7075973
- **Email**: info.udaanagencies@gmail.com

**To access admin panel**:
1. Go to https://udaanagencies.com.np/auth
2. Login with above credentials
3. Navigate to https://udaanagencies.com.np/admin

---

### **Step 12: SSL Certificate Setup**

**Enable HTTPS** (Usually free with hosting):
1. In cPanel, find **"SSL/TLS"** section
2. Enable **"Let's Encrypt"** SSL (free)
3. Or upload your own SSL certificate
4. **Force HTTPS redirects** in cPanel

**Update .htaccess for HTTPS redirect**:
```apache
# Force HTTPS
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 📊 Your JSON Database Files

Your website data is stored in these JSON files:
- `testimonials.json` - Customer reviews
- `jobs.json` - Job listings  
- `companies.json` - Company information
- `users.json` - User accounts
- `form_submissions.json` - Contact form data
- `advertisements.json` - Ad management
- `resources.json` - Educational content

> 📁 **Location**: `06jbjz5PvFtImMG2VzFz6LHiD0Uom5E9ltYCAfKtS2sZAXCixewC4BfqBHBha5HUh328YEL2BBHEKpTe/`

**Benefits of JSON Database**:
- ✅ **No database server needed**
- ✅ **Easy to backup** (just copy folder)  
- ✅ **Simple to edit** manually if needed
- ✅ **Fast performance** with built-in caching
- ✅ **Auto-refresh** system updates frontend in real-time

---

## 🛠️ Troubleshooting Common Issues

### **Website Shows "Application Error"**
```bash
# Check if app is running
pm2 status

# Restart the app
pm2 restart udaan-agencies

# Check error logs
pm2 logs udaan-agencies --lines 50
```

### **"Cannot find module" Error**
```bash
# Reinstall dependencies
npm install --legacy-peer-deps --omit=dev

# Rebuild the application
npm run build
```

### **File Upload Not Working**
1. Check `server/uploads/` folder exists
2. Set permissions to 755: `chmod 755 server/uploads`
3. Check hosting file size limits

### **JSON Database Not Working**
1. Verify the long folder name exists with JSON files
2. Check folder permissions: `chmod 755 06jbjz5PvFt...`
3. Ensure JSON files have 644 permissions

### **Admin Panel Not Accessible**
1. Verify admin user exists in `users.json`
2. Check if `/admin` route is working
3. Clear browser cache and try again

---

## 🚀 Performance Optimization

### **Enable Caching**
Add to .htaccess:
```apache
# Enable Browser Caching
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
</IfModule>
```

### **Monitor Performance**
```bash
# Check app status
pm2 status

# View resource usage
pm2 monit

# Check logs for errors
pm2 logs udaan-agencies --lines 100
```

### **Backup Your Data**
```bash
# Create backup of JSON database
cd /home/yourusername/public_html
tar -czf udaan-backup-$(date +%Y%m%d).tar.gz 06jbjz5PvFtImMG2VzFz6LHiD0Uom5E9ltYCAfKtS2sZAXCixewC4BfqBHBha5HUh328YEL2BBHEKpTe/
```

---

## 📞 Getting Help

**If you get stuck**:
1. **Check PM2 logs**: `pm2 logs udaan-agencies`
2. **Contact your hosting provider** for Node.js support
3. **Check cPanel error logs** in "Error Logs" section
4. **Verify all files uploaded** correctly

**Common Hosting Requirements**:
- Node.js 18+ or 20+
- npm or yarn package manager
- SSH/Terminal access
- Apache or Nginx web server
- SSL certificate support

---

## 🎉 Success Checklist

- [ ] Files uploaded to `public_html`
- [ ] Permissions set correctly (644/755)
- [ ] Dependencies installed (`npm install`)
- [ ] Environment file created (`.env`)
- [ ] Application built (`npm run build`)
- [ ] App started with PM2
- [ ] Web server routing configured (`.htaccess`)
- [ ] SSL certificate enabled
- [ ] Website loads at https://udaanagencies.com.np
- [ ] Admin panel accessible
- [ ] JSON database working
- [ ] File uploads working

**🎯 Your Udaan Agencies job portal is now live and ready for business!**

---

> 💡 **Pro Tip**: Keep this guide bookmarked for future updates and maintenance. Your JSON database system makes management much easier than traditional databases!