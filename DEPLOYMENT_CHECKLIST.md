# 📋 cPanel Deployment Checklist - Udaan Agencies

## Essential Files to Upload

### **Core Application Files**
- [ ] `package.json` - Dependencies list
- [ ] `package-lock.json` - Dependency lock file  
- [ ] `tsconfig.json` - TypeScript configuration
- [ ] `vite.config.ts` - Build tool configuration
- [ ] `tailwind.config.ts` - CSS framework config
- [ ] `postcss.config.js` - CSS processing
- [ ] `components.json` - UI component configuration

### **Server Files (server/ folder)**
- [ ] `server/index.ts` - Main server application
- [ ] `server/routes.ts` - API endpoints
- [ ] `server/fileWatcher.ts` - Real-time auto-refresh system
- [ ] `server/json-database.ts` - Database engine  
- [ ] `server/simple-json-storage.ts` - Storage adapter
- [ ] `server/auth.ts` - Authentication system
- [ ] `server/security.ts` - Security middleware
- [ ] `server/encryption.ts` - Data encryption
- [ ] `server/cleanupService.ts` - Maintenance tasks
- [ ] `server/vite.ts` - Development server integration
- [ ] `server/uploads/` - File upload directory (create if missing)

### **Client Files (client/ folder)**
- [ ] `client/src/App.tsx` - Main React application
- [ ] `client/src/index.css` - Global styles
- [ ] `client/src/components/` - UI components folder
- [ ] `client/src/hooks/` - React hooks folder
- [ ] `client/src/lib/` - Utilities folder
- [ ] `client/src/pages/` - Page components folder
- [ ] `client/public/` - Static assets folder
- [ ] `client/index.html` - HTML template

### **JSON Database Files**
- [ ] `06jbjz5PvFtImMG2VzFz6LHiD0Uom5E9ltYCAfKtS2sZAXCixewC4BfqBHBha5HUh328YEL2BBHEKpTe/` folder
  - [ ] `testimonials.json`
  - [ ] `jobs.json`  
  - [ ] `companies.json`
  - [ ] `users.json`
  - [ ] `form_submissions.json`
  - [ ] `advertisements.json`
  - [ ] `resources.json`
  - [ ] `job_applications.json`
  - [ ] `saved_jobs.json`
  - [ ] `sessions.json`

### **Additional Assets**
- [ ] `attached_assets/` - User uploaded files
- [ ] `logo.ico` - Website favicon
- [ ] `loading.mp4` - Loading animation video

## Configuration Files to Create

### **Environment Configuration (.env)**
```env
NODE_ENV=production
PORT=5000
SESSION_SECRET=your_secure_secret_here
DB_ENCRYPTION_KEY=your_encryption_key_here
ADMIN_USERNAME=Admin_Udaan_7075
ADMIN_PASSWORD=udaan7075973
ADMIN_EMAIL=info.udaanagencies@gmail.com
ALLOWED_ORIGINS=https://udaanagencies.com.np
```

### **Apache Configuration (.htaccess)**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]

# Force HTTPS
RewriteCond %{HTTPS} !=on
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security Headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set X-XSS-Protection "1; mode=block"
```

## Commands to Run

### **Installation**
```bash
cd /home/yourusername/public_html
npm install --legacy-peer-deps --omit=dev
```

### **Build Process**  
```bash
npm run build
```

### **Start Application**
```bash
# Simple start (testing)
npm start

# Production with PM2 (recommended)
npm install -g pm2
pm2 start dist/index.js --name "udaan-agencies"
pm2 startup
pm2 save
```

## File Permissions

### **Standard Permissions**
- **Files**: `644` (read/write owner, read others)
- **Directories**: `755` (full owner, read/execute others)

### **Special Permissions**
- `server/uploads/`: `755` (writable for file uploads)
- Database folder: `755` (writable for JSON files)
- `.env` file: `600` (owner read/write only)

## Testing Checklist

### **Basic Functionality**
- [ ] Website loads at https://udaanagencies.com.np
- [ ] Homepage displays correctly
- [ ] Jobs page shows listings  
- [ ] Testimonials page works
- [ ] Contact forms submit successfully
- [ ] File uploads work (testimonials, resources)

### **Admin Functions**
- [ ] Admin login works (Admin_Udaan_7075 / udaan7075973)
- [ ] Admin panel accessible at /admin
- [ ] Can manage jobs, testimonials, companies
- [ ] Can view form submissions
- [ ] File watcher shows status
- [ ] Real-time updates work

### **Performance & Security**
- [ ] HTTPS certificate active
- [ ] Pages load quickly (< 3 seconds)
- [ ] File upload limits working
- [ ] Security headers present
- [ ] Auto-refresh system active
- [ ] No console errors

## Quick Troubleshooting

### **App Won't Start**
```bash
# Check Node.js version
node --version  # Should be 18+

# Check for errors
pm2 logs udaan-agencies --lines 50

# Restart application
pm2 restart udaan-agencies
```

### **Website Not Loading**
1. Check if app is running: `pm2 status`
2. Verify .htaccess file exists and is correct
3. Check Apache/Nginx configuration
4. Contact hosting provider

### **Database Issues**
1. Check JSON files exist in database folder
2. Verify folder permissions (755)
3. Check file permissions (644)
4. Look for JSON syntax errors

### **File Upload Problems**
1. Create `server/uploads/` folder if missing
2. Set permissions: `chmod 755 server/uploads`
3. Check hosting file size limits
4. Verify disk space available

## Success Indicators

✅ **PM2 Status**: App shows "online"  
✅ **Website Access**: https://udaanagencies.com.np loads  
✅ **Admin Access**: Can login to /admin  
✅ **Database**: JSON files read/write correctly  
✅ **Auto-refresh**: Real-time updates working  
✅ **SSL**: HTTPS active and forced  
✅ **Performance**: Pages load under 3 seconds  

## Backup Strategy

### **Daily Backups** (Automated)
```bash
# Add to cron job
tar -czf /home/yourusername/backups/udaan-$(date +%Y%m%d).tar.gz /home/yourusername/public_html/06jbjz5PvFtImMG2VzFz6LHiD0Uom5E9ltYCAfKtS2sZAXCixewC4BfqBHBha5HUh328YEL2BBHEKpTe/
```

### **Before Updates**
1. Backup JSON database folder
2. Export current PM2 configuration
3. Save .env file
4. Document current working state

---

**🎯 Use this checklist every time you deploy or update your Udaan Agencies website!**