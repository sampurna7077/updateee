# Deployment Guide for cPanel Hosting

Follow these steps to deploy your Udaan Agencies job portal to your cPanel hosting server.

## Prerequisites

1. **cPanel hosting account** with Node.js support
2. **PostgreSQL database** already created in cPanel (✓ Done - shown in your screenshot)
3. **Domain configured**: udaanagencies.com.np
4. **SSH access** to your hosting server (recommended)

## Step 1: Database Setup

Your PostgreSQL database is already configured:
- **Database Name**: udaanage_udaan_agencies  
- **Username**: udaanage_udaanage
- **Password**: happyhappy123
- **Host**: localhost (when on the server)

## Step 2: Download Project Files

1. **Export from Replit**:
   - Click the hamburger menu (≡) in Replit
   - Select "Export as zip" 
   - Download the zip file to your computer

2. **Extract the files**:
   - Extract the zip file
   - You'll have a folder with all your project files

## Step 3: Upload Files to cPanel

1. **Access File Manager** in cPanel
2. **Navigate to public_html** (or your domain's document root)
3. **Upload and extract** the project zip file
4. **Set proper permissions**:
   - Files: 644
   - Directories: 755
   - Make sure the uploads directory is writable: 755

## Step 4: Install Dependencies

1. **Open Terminal** in cPanel (or use SSH)
2. **Navigate to your project directory**:
   ```bash
   cd /home/yourusername/public_html
   ```
3. **Install Node.js dependencies** (use legacy peer deps to resolve version conflicts):
   ```bash
   npm install --omit=dev --legacy-peer-deps
   ```
   
   If you encounter dependency conflicts, you can also try:
   ```bash
   npm install --omit=dev --force
   ```

## Step 5: Configure Environment Variables

Create a `.env` file in your project root with:

```env
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=udaanage_udaan_agencies
DB_USER=udaanage_udaanage
DB_PASSWORD=happyhappy123

# Session Secret (CHANGE THIS!)
SESSION_SECRET=your_very_secure_session_secret_here_change_this

# Application Configuration
PORT=5000
```

**Important**: Change the SESSION_SECRET to a unique, secure value!

## Step 6: Database Migration

Run the database migration to create all necessary tables:

```bash
npm run db:push
```

If you get a data-loss warning, use:
```bash
npm run db:push --force
```

## Step 7: Build for Production

```bash
npm run build
```

This creates:
- `dist/` folder with server code
- `dist/public/` folder with frontend assets

## Step 8: Start the Application

```bash
npm start
```

Or for process management with PM2:
```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/index.js --name "udaan-agencies"

# Set PM2 to restart on server reboot
pm2 startup
pm2 save
```

## Step 9: Configure Web Server (Apache/Nginx)

### For Apache (.htaccess):
Create or update `.htaccess` in your domain root:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ http://localhost:5000/$1 [P,L]

# Security headers
Header always set X-Frame-Options "SAMEORIGIN"
Header always set X-Content-Type-Options "nosniff"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

### For Nginx:
Add to your server block:

```nginx
location / {
    try_files $uri $uri/ @nodejs;
}

location @nodejs {
    proxy_pass http://localhost:5000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## Step 10: Set Up Admin User

1. **Access your application** at https://udaanagencies.com.np
2. **Create the first admin user** by registering, then updating the database:

```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

## Step 11: SSL Certificate

If not already configured:
1. **Enable SSL** in cPanel
2. **Force HTTPS redirects** in your web server configuration
3. **Update CORS origins** if needed

## Security Checklist

- [ ] Changed SESSION_SECRET to a unique value
- [ ] Database password is secure
- [ ] SSL certificate is active
- [ ] File permissions are correct (644/755)
- [ ] Uploads directory is protected
- [ ] Rate limiting is active
- [ ] Security headers are enabled

## Troubleshooting

**If the app doesn't start**:
1. Check Node.js version (should be 18+ or 20+)
2. Verify database connection
3. Check environment variables
4. Review error logs

**If database connection fails**:
1. Verify PostgreSQL service is running
2. Check database credentials
3. Ensure database exists
4. Check firewall/port access

**If uploads don't work**:
1. Verify uploads directory exists and is writable
2. Check file size limits in your hosting
3. Ensure proper permissions

## Production Performance Tips

1. **Enable gzip compression** in your web server
2. **Set up caching headers** for static assets
3. **Monitor memory usage** with PM2
4. **Set up log rotation** for application logs
5. **Regular database backups**

Your job portal is now ready for production use!