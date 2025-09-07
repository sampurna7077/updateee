# Complete Server Setup Guide for Uddan Application 🚀
*A super detailed guide that even an 8th grader can follow!*

## 📚 What You'll Learn
By the end of this guide, you'll have:
- Your own web server running on Ubuntu
- Your domain pointing to your server
- Your Uddan application live on the internet
- SSL certificate for HTTPS security
- Automatic backups and monitoring

---

## 🛠️ Prerequisites (What You Need Before Starting)

### Physical Requirements:
- ✅ An old laptop/computer with at least 4GB RAM
- ✅ A stable internet connection (at least 10 Mbps upload speed)
- ✅ A domain name you own (like `yoursite.com`)
- ✅ Ubuntu installed on your laptop (Windows removed)

### Knowledge Requirements:
- Basic understanding of copy-pasting commands
- Patience (this will take 2-3 hours)
- Willingness to read error messages carefully

---

## 📋 Table of Contents
1. [Domain Management](#1-domain-management)
2. [Ubuntu Server Setup](#2-ubuntu-server-setup)
3. [Network Configuration](#3-network-configuration)
4. [Application Deployment](#4-application-deployment)
5. [Web Server Setup](#5-web-server-setup)
6. [Domain Connection](#6-domain-connection)
7. [SSL Certificate](#7-ssl-certificate)
8. [Process Management](#8-process-management)
9. [Testing Everything](#9-testing-everything)
10. [Troubleshooting Guide](#10-troubleshooting-guide)

---

## 1. Domain Management 🌐

### Step 1.1: Remove Domain from Current Hosting

**What this means:** Right now, your domain is pointing to your shared hosting. We need to "disconnect" it so we can point it to your new server.

**Detailed Steps:**
1. **Find your domain registrar**
   - This is where you bought your domain (GoDaddy, Namecheap, Google Domains, etc.)
   - Check your email for the purchase receipt if you forgot

2. **Login to your domain account**
   - Go to your registrar's website
   - Click "Sign In" or "Login"
   - Use your email and password

3. **Find DNS or Nameserver settings**
   - Look for buttons like:
     - "DNS Management"
     - "Nameservers"
     - "Domain Settings"
     - "Manage Domain"

4. **Write down current settings** (IMPORTANT!)
   ```
   Current Nameservers:
   ns1.yoursharedhost.com
   ns2.yoursharedhost.com
   ```
   **Why:** In case something goes wrong, you can restore these settings

5. **Don't change anything yet!** We'll come back to this later.

### ❌ Possible Errors and Solutions:

**Error:** "Can't find my domain registrar"
- **Solution:** Check your email for domain purchase confirmation
- **Alternative:** Use `whois yourdomain.com` in terminal to find registrar

**Error:** "Forgot login credentials"
- **Solution:** Use "Forgot Password" on registrar website
- **Alternative:** Contact registrar support with domain proof

---

## 2. Ubuntu Server Setup 💻

### Step 2.1: Update Your System

**What this means:** We're making sure Ubuntu has all the latest security updates and fixes.

**Commands to run:**
```bash
sudo apt update && sudo apt upgrade -y
```

**Step-by-step breakdown:**
1. Open Terminal (Ctrl + Alt + T)
2. Type the command above
3. Press Enter
4. If asked for password, type your Ubuntu password (you won't see characters while typing - this is normal!)
5. Press Enter
6. Wait 5-15 minutes for updates to complete

### ❌ Possible Errors and Solutions:

**Error:** `sudo: command not found`
- **Cause:** You're not using Ubuntu or sudo isn't installed
- **Solution:** Make sure you have Ubuntu properly installed

**Error:** `E: Could not get lock /var/lib/apt/lists/lock`
- **Cause:** Another update process is running
- **Solution:** 
  ```bash
  sudo killall apt apt-get
  sudo rm /var/lib/apt/lists/lock
  sudo rm /var/cache/apt/archives/lock
  sudo rm /var/lib/dpkg/lock*
  sudo apt update
  ```

**Error:** `Connection failed` or `Unable to fetch`
- **Cause:** No internet connection or DNS issues
- **Solution:** 
  1. Check internet: `ping google.com`
  2. If no internet, fix your connection first
  3. Try again after fixing internet

### Step 2.2: Install Essential Tools

**What this means:** We're installing all the software tools needed to run a web server.

**Command:**
```bash
sudo apt install -y curl wget git build-essential software-properties-common ufw nginx certbot python3-certbot-nginx htop tree
```

**What each tool does:**
- `curl` & `wget`: Download files from internet
- `git`: Download your application code
- `build-essential`: Compile software if needed
- `ufw`: Firewall for security
- `nginx`: Web server (like Apache)
- `certbot`: Gets free SSL certificates
- `htop`: Monitor server performance
- `tree`: View folder structure nicely

**Expected time:** 3-5 minutes

### ❌ Possible Errors and Solutions:

**Error:** `E: Unable to locate package [package-name]`
- **Cause:** Package repositories not updated
- **Solution:** 
  ```bash
  sudo apt update
  sudo apt install -y curl wget git build-essential software-properties-common ufw nginx certbot python3-certbot-nginx
  ```

**Error:** `dpkg: error processing package`
- **Cause:** Broken package installation
- **Solution:**
  ```bash
  sudo apt --fix-broken install
  sudo dpkg --configure -a
  sudo apt update && sudo apt upgrade
  ```

### Step 2.3: Install Node.js (The JavaScript Runtime)

**What this means:** Your application is built with JavaScript, so we need Node.js to run it.

**Commands:**
```bash
# Download and install Node.js 20 (Latest stable version)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# Check if installation worked
node --version
npm --version
```

**Expected output:**
```
v20.x.x
10.x.x
```

### ❌ Possible Errors and Solutions:

**Error:** `curl: command not found`
- **Cause:** curl wasn't installed properly
- **Solution:** 
  ```bash
  sudo apt install curl -y
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  ```

**Error:** `node: command not found` after installation
- **Cause:** PATH not updated or installation failed
- **Solution:**
  ```bash
  # Check if node is installed but not in PATH
  whereis node
  
  # If found, add to PATH
  echo 'export PATH=$PATH:/usr/bin' >> ~/.bashrc
  source ~/.bashrc
  
  # If not found, reinstall
  sudo apt remove nodejs npm -y
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

**Error:** Version shows very old Node.js (like v12 or v14)
- **Cause:** Ubuntu's default repositories have old versions
- **Solution:** Remove old version and reinstall:
  ```bash
  sudo apt remove nodejs npm -y
  sudo apt autoremove -y
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### Step 2.4: Install PM2 (Process Manager)

**What this means:** PM2 keeps your application running even if it crashes, and restarts it automatically when the server reboots.

**Command:**
```bash
sudo npm install -g pm2
```

**Check installation:**
```bash
pm2 --version
```

### ❌ Possible Errors and Solutions:

**Error:** `npm: command not found`
- **Cause:** npm wasn't installed with Node.js
- **Solution:** Reinstall Node.js following Step 2.3

**Error:** `Permission denied` during PM2 installation
- **Cause:** npm permissions issue
- **Solution:**
  ```bash
  # Fix npm permissions
  mkdir ~/.npm-global
  npm config set prefix '~/.npm-global'
  echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
  source ~/.bashrc
  npm install -g pm2
  ```

**Error:** `gyp ERR!` or compilation errors
- **Cause:** Missing build tools
- **Solution:**
  ```bash
  sudo apt install build-essential -y
  sudo npm install -g pm2
  ```

---

## 3. Network Configuration 🌐

### Step 3.1: Find Your Server's Public IP Address

**What this means:** Every device on the internet has a unique address (IP address). We need to find yours so people can reach your server from anywhere in the world.

**Command:**
```bash
curl ifconfig.me
```

**Example output:**
```
123.45.67.89
```

**IMPORTANT:** Write this IP address down! You'll need it multiple times.

```
My Server's Public IP: ___________________
```

### ❌ Possible Errors and Solutions:

**Error:** `curl: (6) Could not resolve host: ifconfig.me`
- **Cause:** No internet connection or DNS issues
- **Solutions to try:**
  ```bash
  # Try alternative services
  curl ipinfo.io/ip
  curl icanhazip.com
  wget -qO- ifconfig.me
  
  # If all fail, check internet
  ping google.com
  ```

**Error:** Command returns nothing or hangs
- **Cause:** Firewall blocking or poor connection
- **Solution:**
  ```bash
  # Try with timeout
  timeout 10 curl ifconfig.me
  
  # Or use dig command
  dig +short myip.opendns.com @resolver1.opendns.com
  ```

### Step 3.2: Configure Your Router (VERY IMPORTANT!)

**What this means:** Your router acts like a security guard. By default, it blocks all incoming internet traffic. We need to tell it to allow people to reach your server.

**Step-by-step router configuration:**

1. **Find your router's IP address:**
   ```bash
   ip route | grep default
   ```
   **Example output:** `default via 192.168.1.1` (your router IP)

2. **Open your web browser and go to your router's IP:**
   - Type `http://192.168.1.1` in address bar (use your actual router IP)
   - Press Enter

3. **Login to your router:**
   - **Common usernames/passwords:**
     - admin/admin
     - admin/password
     - admin/(blank)
     - Check sticker on your router for default login

4. **Find Port Forwarding section:**
   - Look for: "Port Forwarding", "Virtual Servers", "NAT", or "Advanced"

5. **Find your Ubuntu laptop's local IP:**
   ```bash
   hostname -I | awk '{print $1}'
   ```
   **Example output:** `192.168.1.100`

6. **Add these port forwarding rules:**

   **Rule 1 - HTTP:**
   - Service Name: `HTTP`
   - External Port: `80`
   - Internal IP: `192.168.1.100` (your laptop's IP)
   - Internal Port: `80`
   - Protocol: `TCP`

   **Rule 2 - HTTPS:**
   - Service Name: `HTTPS`
   - External Port: `443`
   - Internal IP: `192.168.1.100` (your laptop's IP)
   - Internal Port: `443`
   - Protocol: `TCP`

   **Rule 3 - SSH (Optional, for remote access):**
   - Service Name: `SSH`
   - External Port: `22`
   - Internal Port: `22`
   - Internal IP: `192.168.1.100` (your laptop's IP)
   - Protocol: `TCP`

7. **Save settings and reboot router**

### ❌ Possible Errors and Solutions:

**Error:** Can't access router IP (192.168.1.1)
- **Cause:** Wrong router IP or not connected to router
- **Solutions:**
  ```bash
  # Find correct router IP
  route -n | grep 'UG'
  # Or
  cat /proc/net/route | grep 00000000
  
  # Make sure you're connected to your WiFi/Ethernet
  ip addr show
  ```

**Error:** Router login doesn't work
- **Solutions:**
  1. Check router sticker for default password
  2. Try common combinations: admin/admin, admin/password, admin/(empty)
  3. Google your router model + "default password"
  4. Reset router to factory settings (press reset button for 10 seconds)

**Error:** Can't find Port Forwarding option
- **Different router brands use different names:**
  - D-Link: "Virtual Server"
  - TP-Link: "Forwarding" → "Virtual Servers"
  - Netgear: "Dynamic DNS" → "Port Forwarding"
  - Linksys: "Security" → "Apps and Gaming"
  - Google your router model + "port forwarding setup"

### Step 3.3: Test Port Forwarding

**Command to test from outside your network:**
```bash
# Ask a friend to run this, or use your phone's mobile data
telnet YOUR_PUBLIC_IP 80
```

**Expected result:** Connection should work (even if it closes immediately)

---

## 4. Application Deployment 🚀

### Step 4.1: Create Application Directory

**What this means:** We're creating a folder where your application will live.

**Commands:**
```bash
cd /home/$(whoami)
mkdir -p websites
cd websites
```

**Check where you are:**
```bash
pwd
```
**Expected output:** `/home/yourusername/websites`

### Step 4.2: Download Your Application

**Option A: From GitHub (Recommended)**
```bash
git clone YOUR_GITHUB_REPO_URL uddan-app
cd uddan-app
```

**Option B: Upload files manually**
If you don't have GitHub, you can copy files:
1. Create folder: `mkdir uddan-app && cd uddan-app`
2. Copy all your project files here using USB drive or SCP

### ❌ Possible Errors and Solutions:

**Error:** `git: command not found`
- **Solution:** 
  ```bash
  sudo apt install git -y
  git clone YOUR_REPO_URL uddan-app
  ```

**Error:** `Permission denied (publickey)` for private repos
- **Solutions:**
  1. **Use HTTPS instead of SSH:**
     ```bash
     # Instead of: git@github.com:user/repo.git
     # Use: https://github.com/user/repo.git
     git clone https://github.com/yourusername/your-repo.git uddan-app
     ```
  
  2. **For private repos, create access token:**
     - Go to GitHub → Settings → Developer settings → Personal access tokens
     - Generate new token with repo permissions
     - Use: `git clone https://TOKEN@github.com/user/repo.git`

**Error:** `Repository not found`
- **Cause:** Wrong URL or private repository
- **Solution:** Double-check the repository URL, make sure it's public or you have access

### Step 4.3: Install Application Dependencies

**What this means:** Your application needs various software libraries to work. This command downloads and installs all of them.

**Commands:**
```bash
# Make sure you're in the right directory
cd /home/$(whoami)/websites/uddan-app

# Install dependencies
npm install
```

**Expected time:** 2-5 minutes
**Expected output:** Should see progress bars and package installations

### ❌ Possible Errors and Solutions:

**Error:** `npm: command not found`
- **Cause:** Node.js not installed properly
- **Solution:** Go back to Step 2.3 and reinstall Node.js

**Error:** `package.json not found`
- **Cause:** You're in the wrong directory or files didn't download properly
- **Solution:**
  ```bash
  # Check if you're in the right place
  ls -la
  # Should see package.json file
  
  # If not there, check parent directory
  cd ..
  ls -la
  
  # Find the correct directory with package.json
  find . -name "package.json" -type f
  ```

**Error:** `npm ERR! peer dep missing`
- **Cause:** Dependency conflicts
- **Solution:**
  ```bash
  # Clear npm cache and try again
  npm cache clean --force
  rm -rf node_modules package-lock.json
  npm install
  ```

**Error:** `EACCES: permission denied`
- **Cause:** npm permissions issue
- **Solution:**
  ```bash
  # Fix npm permissions
  sudo chown -R $(whoami) ~/.npm
  sudo chown -R $(whoami) ./node_modules
  npm install
  ```

**Error:** `network timeout` or `connection refused`
- **Cause:** Internet connection issues or npm registry problems
- **Solution:**
  ```bash
  # Try different registry
  npm install --registry https://registry.npmjs.org/
  
  # Or increase timeout
  npm install --timeout=60000
  ```

### Step 4.4: Create Environment Configuration

**What this means:** Your application needs certain settings (like passwords and secrets) to run. We store these in a special file.

**Create the environment file:**
```bash
nano .env
```

**Add this content (replace YOUR_DOMAIN with your actual domain):**
```env
NODE_ENV=production
SESSION_SECRET=your_super_secure_secret_key_at_least_32_characters_long_like_this_one_12345
DATABASE_URL=json://./data
PORT=3000
DOMAIN=yourdomain.com
```

**To save and exit nano:**
1. Press `Ctrl + X`
2. Press `Y` to confirm
3. Press `Enter` to save

### ❌ Possible Errors and Solutions:

**Error:** `nano: command not found`
- **Solution:** Use a different editor:
  ```bash
  # Try vim
  vim .env
  # Press 'i' to edit, type content, press Esc, type ':wq', press Enter
  
  # Or try gedit (if GUI available)
  gedit .env
  
  # Or create with echo
  cat > .env << 'EOF'
  NODE_ENV=production
  SESSION_SECRET=your_super_secure_secret_key_at_least_32_characters_long_like_this_one_12345
  DATABASE_URL=json://./data
  PORT=3000
  DOMAIN=yourdomain.com
  EOF
  ```

**Error:** Confused about SESSION_SECRET
- **What it is:** A random string used to encrypt user sessions
- **Requirements:** At least 32 characters long
- **Generator:** You can use online generators or:
  ```bash
  openssl rand -base64 32
  ```

### Step 4.5: Create Data Directory and Set Permissions

**What this means:** Your application stores data in JSON files. We need to create the folder and make sure the application can read/write to it.

**Commands:**
```bash
# Create data directory
mkdir -p data

# Set proper permissions
chmod 755 data
sudo chown -R $(whoami):$(whoami) data

# If you have existing data files, copy them here
# Example: cp /path/to/your/existing/data/*.json ./data/
```

**Check if it worked:**
```bash
ls -la data/
```

### Step 4.6: Build the Application

**What this means:** This command compiles your application code and prepares it for production use.

**Command:**
```bash
npm run build
```

**Expected time:** 2-3 minutes
**Expected output:** Should see build process and success message

### ❌ Possible Errors and Solutions:

**Error:** `npm ERR! missing script: build`
- **Cause:** Your package.json doesn't have a build script
- **Solution:** Check if the script exists:
  ```bash
  cat package.json | grep -A 5 "scripts"
  ```
  If no build script, you might skip this step or use:
  ```bash
  npm run compile
  # or
  npm run prod
  ```

**Error:** TypeScript compilation errors
- **Cause:** Code errors or missing dependencies
- **Solutions:**
  ```bash
  # Install TypeScript globally
  sudo npm install -g typescript
  
  # Try building with more memory
  NODE_OPTIONS="--max-old-space-size=4096" npm run build
  
  # Check for specific errors and fix them
  npm run check  # if available
  ```

**Error:** `out of memory` during build
- **Cause:** Your server doesn't have enough RAM
- **Solution:**
  ```bash
  # Create swap file for more memory
  sudo fallocate -l 2G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  
  # Make swap permanent
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
  
  # Try building again
  npm run build
  ```

### Step 4.7: Test the Application Locally

**What this means:** Before we set up the web server, let's make sure your application actually works.

**Command:**
```bash
npm start
```

**Expected output:**
```
serving on port 3000
```

**Test it:**
```bash
# In another terminal (Ctrl+Alt+T)
curl http://localhost:3000
```

**Expected result:** Should return HTML content from your application

**Stop the test:**
Press `Ctrl + C` in the terminal running npm start

### ❌ Possible Errors and Solutions:

**Error:** `EADDRINUSE: address already in use :::3000`
- **Cause:** Another process is using port 3000
- **Solution:**
  ```bash
  # Find what's using port 3000
  sudo lsof -i :3000
  
  # Kill the process (replace PID with actual process ID)
  sudo kill -9 PID
  
  # Or use a different port temporarily
  PORT=3001 npm start
  ```

**Error:** `Error: Cannot find module`
- **Cause:** Missing dependencies or build files
- **Solution:**
  ```bash
  # Reinstall dependencies
  rm -rf node_modules
  npm install
  
  # Rebuild
  npm run build
  
  # Try again
  npm start
  ```

**Error:** Database or file permission errors
- **Cause:** Application can't read/write to data files
- **Solution:**
  ```bash
  # Fix permissions
  sudo chown -R $(whoami):$(whoami) .
  chmod -R 755 .
  chmod -R 777 data/
  
  # Create missing directories
  mkdir -p logs temp uploads
  ```

---

## 5. Web Server Setup (Nginx) 🌐

### Step 5.1: Configure Nginx

**What this means:** Nginx is like a traffic director. It receives requests from the internet and forwards them to your application. It also handles security and performance.

**Create Nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/uddan
```

**Add this content (replace yourdomain.com with your actual domain):**
```nginx
# HTTP Server Block (will redirect to HTTPS later)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Main application proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout       60s;
        proxy_send_timeout          60s;
        proxy_read_timeout          60s;
    }

    # WebSocket support for real-time features
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Security: Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ ^/(\.env|\.git|node_modules|server) {
        deny all;
    }
}
```

**Save and exit:** `Ctrl + X`, then `Y`, then `Enter`

### Step 5.2: Enable the Site

**Commands:**
```bash
# Create symbolic link to enable the site
sudo ln -s /etc/nginx/sites-available/uddan /etc/nginx/sites-enabled/

# Remove default site (optional but recommended)
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Restart Nginx:**
```bash
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### ❌ Possible Errors and Solutions:

**Error:** `nginx: [emerg] could not build server_names_hash`
- **Cause:** Domain name too long or configuration issue
- **Solution:**
  ```bash
  # Add to nginx.conf
  sudo nano /etc/nginx/nginx.conf
  
  # Find the 'http' block and add:
  # server_names_hash_bucket_size 64;
  
  sudo nginx -t
  sudo systemctl restart nginx
  ```

**Error:** `nginx: [emerg] bind() to 0.0.0.0:80 failed (98: Address already in use)`
- **Cause:** Another service is using port 80
- **Solution:**
  ```bash
  # Find what's using port 80
  sudo lsof -i :80
  
  # If it's Apache, stop it
  sudo systemctl stop apache2
  sudo systemctl disable apache2
  
  # Start nginx
  sudo systemctl start nginx
  ```

**Error:** `403 Forbidden` when accessing site
- **Cause:** Permission issues or incorrect document root
- **Solution:**
  ```bash
  # Check nginx error logs
  sudo tail -f /var/log/nginx/error.log
  
  # Common fixes:
  sudo chown -R www-data:www-data /var/www/
  sudo chmod -R 755 /var/www/
  ```

**Error:** `502 Bad Gateway`
- **Cause:** Your application (port 3000) is not running
- **Solution:**
  ```bash
  # Check if your app is running
  curl localhost:3000
  
  # If not, start it
  cd /home/$(whoami)/websites/uddan-app
  npm start
  ```

### Step 5.3: Configure Firewall

**What this means:** Ubuntu has a built-in firewall. We need to tell it to allow web traffic and SSH access.

**Commands:**
```bash
# Allow SSH (so you can access remotely)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS traffic
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
```

**Type `y` when prompted**

**Check firewall status:**
```bash
sudo ufw status
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
OpenSSH (v6)               ALLOW       Anywhere (v6)
Nginx Full (v6)            ALLOW       Anywhere (v6)
```

### ❌ Possible Errors and Solutions:

**Error:** `ufw: command not found`
- **Solution:**
  ```bash
  sudo apt install ufw -y
  sudo ufw allow OpenSSH
  sudo ufw allow 'Nginx Full'
  sudo ufw enable
  ```

**Error:** Can't SSH after enabling firewall
- **Cause:** SSH port blocked
- **Solution:**
  ```bash
  # If you can still access locally
  sudo ufw allow 22/tcp
  sudo ufw reload
  
  # If locked out, you need physical access to disable firewall
  sudo ufw disable
  ```

---

## 6. Domain Connection 🌍

### Step 6.1: Update DNS Records

**What this means:** We're telling the internet "when someone types your domain name, send them to your server's IP address."

**Go to your domain registrar and set these DNS records:**

**A Record:**
- **Type:** `A`
- **Name:** `@` (or leave blank)
- **Value:** `YOUR_SERVER_PUBLIC_IP` (from Step 3.1)
- **TTL:** `300` (5 minutes)

**CNAME Record:**
- **Type:** `CNAME`
- **Name:** `www`
- **Value:** `yourdomain.com`
- **TTL:** `300`

**Example for domain `mysite.com` with IP `123.45.67.89`:**
```
Type: A     | Name: @   | Value: 123.45.67.89 | TTL: 300
Type: CNAME | Name: www | Value: mysite.com    | TTL: 300
```

### Step 6.2: Wait for DNS Propagation

**What this means:** It takes time for the internet to learn about your new DNS settings. This is called "propagation."

**Check DNS propagation:**
```bash
# Check your domain
nslookup yourdomain.com

# Check www version
nslookup www.yourdomain.com
```

**Expected output:**
```
Non-authoritative answer:
Name:    yourdomain.com
Address: 123.45.67.89
```

**If DNS isn't working yet:**
- Wait 5-60 minutes (can take up to 24 hours in rare cases)
- Check online DNS checkers: `whatsmydns.net`

### ❌ Possible Errors and Solutions:

**Error:** `nslookup: command not found`
- **Solution:**
  ```bash
  sudo apt install dnsutils -y
  nslookup yourdomain.com
  ```

**Error:** DNS returns wrong IP or no result
- **Causes and solutions:**
  1. **Too soon:** Wait longer, DNS changes take time
  2. **Wrong IP:** Double-check the IP you entered in DNS settings
  3. **Typo in domain:** Verify domain spelling
  4. **Old nameservers:** Make sure you're using the right nameservers

**Error:** Domain points to old hosting
- **Cause:** DNS still cached or wrong nameservers
- **Solutions:**
  ```bash
  # Clear local DNS cache
  sudo systemctl flush-dns
  
  # Try from different location
  # Use online tools like whatsmydns.net
  ```

### Step 6.3: Test Domain Access

**Once DNS is working, test your domain:**

**From your server:**
```bash
curl http://yourdomain.com
```

**From another computer/phone:**
- Open web browser
- Go to `http://yourdomain.com`
- Should see your application

---

## 7. SSL Certificate (HTTPS Security) 🔒

### Step 7.1: Install SSL Certificate

**What this means:** SSL certificates encrypt the connection between your website and users, making it secure. This changes your site from HTTP to HTTPS.

**Important:** Your domain must be working (Step 6) before doing this!

**Command:**
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

**Follow the prompts:**
1. Enter email address (for urgent renewal notices)
2. Type `A` to agree to terms
3. Type `N` for sharing email with partners (recommended)
4. Select option `2` to redirect HTTP to HTTPS (recommended)

**Expected output:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/yourdomain.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### ❌ Possible Errors and Solutions:

**Error:** `The requested nginx plugin does not appear to be installed`
- **Solution:**
  ```bash
  sudo apt install python3-certbot-nginx -y
  sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
  ```

**Error:** `Domain: yourdomain.com Type: unauthorized`
- **Cause:** Domain not pointing to your server yet
- **Solutions:**
  1. **Wait longer for DNS:** Check `nslookup yourdomain.com`
  2. **Verify nginx is running:** `sudo systemctl status nginx`
  3. **Check firewall:** `sudo ufw status`
  4. **Test domain manually:**
     ```bash
     curl -I http://yourdomain.com
     ```

**Error:** `timeout during connect`
- **Cause:** Port 80 blocked or not forwarded
- **Solutions:**
  1. **Check router port forwarding** (Step 3.2)
  2. **Check firewall:** `sudo ufw allow 'Nginx Full'`
  3. **Test port 80:**
     ```bash
     sudo netstat -tulpn | grep :80
     ```

**Error:** `too many requests`
- **Cause:** Let's Encrypt rate limiting (5 failures per hour)
- **Solution:** Wait 1 hour and try again

**Error:** `nginx configuration invalid`
- **Cause:** Syntax error in nginx config
- **Solution:**
  ```bash
  sudo nginx -t
  # Fix any errors shown
  sudo nano /etc/nginx/sites-available/uddan
  sudo systemctl reload nginx
  ```

### Step 7.2: Test SSL Certificate

**Check if HTTPS is working:**
```bash
curl -I https://yourdomain.com
```

**Expected output:**
```
HTTP/2 200
server: nginx
```

**Test in browser:**
- Go to `https://yourdomain.com`
- Should see a lock icon in address bar
- Should automatically redirect from HTTP to HTTPS

### Step 7.3: Set Up Auto-Renewal

**What this means:** SSL certificates expire every 90 days. We're setting up automatic renewal so you don't have to remember to do it manually.

**Commands:**
```bash
# Test auto-renewal
sudo certbot renew --dry-run

# Enable auto-renewal service
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Check renewal timer status
sudo systemctl status certbot.timer
```

**Expected dry-run output:**
```
Congratulations, all simulated renewals succeeded
```

---

## 8. Process Management (PM2) ⚙️

### Step 8.1: Create PM2 Configuration

**What this means:** PM2 will keep your application running 24/7, restart it if it crashes, and automatically start it when the server reboots.

**Create PM2 config file:**
```bash
cd /home/$(whoami)/websites/uddan-app
nano ecosystem.config.js
```

**Add this content:**
```javascript
module.exports = {
  apps: [{
    name: 'uddan-app',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

**Save:** `Ctrl + X`, `Y`, `Enter`

### Step 8.2: Create Logs Directory

```bash
mkdir -p logs
chmod 755 logs
```

### Step 8.3: Start Application with PM2

**Commands:**
```bash
# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up auto-start on system boot
pm2 startup
```

**Follow the instructions from `pm2 startup` command.** It will give you a command to copy and run with sudo.

**Example output:**
```
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u yourusername --hp /home/yourusername
```

**Copy and run that command!**

### ❌ Possible Errors and Solutions:

**Error:** `script not found: dist/index.js`
- **Cause:** Application not built properly or wrong script path
- **Solutions:**
  ```bash
  # Check if build files exist
  ls -la dist/
  
  # If no dist folder, check for other entry points
  ls -la
  
  # Update ecosystem.config.js with correct path
  nano ecosystem.config.js
  # Change script to: 'server/index.ts' or 'index.js' or whatever exists
  ```

**Error:** `permission denied` when creating logs
- **Solution:**
  ```bash
  mkdir -p logs
  chmod 755 logs
  chown $(whoami):$(whoami) logs
  ```

**Error:** `pm2: command not found`
- **Cause:** PM2 not installed or not in PATH
- **Solution:**
  ```bash
  # Reinstall PM2
  sudo npm install -g pm2
  
  # Check PATH
  echo $PATH
  
  # Add npm global bin to PATH if needed
  echo 'export PATH=$PATH:/usr/bin' >> ~/.bashrc
  source ~/.bashrc
  ```

### Step 8.4: Monitor Your Application

**Useful PM2 commands:**

```bash
# Check application status
pm2 status

# View logs in real-time
pm2 logs uddan-app

# View application details
pm2 show uddan-app

# Restart application
pm2 restart uddan-app

# Stop application
pm2 stop uddan-app

# Delete application from PM2
pm2 delete uddan-app

# Monitor with dashboard
pm2 monit
```

**Expected `pm2 status` output:**
```
┌─────┬────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name       │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ uddan-app  │ default     │ 1.0.0   │ fork    │ 1234     │ 5m     │ 0    │ online    │ 0%       │ 50.0mb   │ user     │ disabled │
└─────┴────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

---

## 9. Testing Everything 🧪

### Step 9.1: Complete Website Test

**Test your website from multiple places:**

1. **From your server:**
   ```bash
   curl -I https://yourdomain.com
   ```

2. **From another computer/phone:**
   - Open browser
   - Go to `https://yourdomain.com`
   - Check that it loads properly

3. **Check HTTP redirect:**
   - Go to `http://yourdomain.com`
   - Should automatically redirect to HTTPS

4. **Check www version:**
   - Go to `https://www.yourdomain.com`
   - Should work same as non-www

### Step 9.2: Test Application Features

**Test these features:**
- User registration/login
- Data saving and loading
- Real-time updates (if applicable)
- Admin panel (if you have admin access)

### Step 9.3: Performance Testing

**Check website speed:**
```bash
# Test response time
curl -o /dev/null -s -w "%{time_total}\n" https://yourdomain.com
```

**Use online tools:**
- Google PageSpeed Insights: `pagespeed.web.dev`
- GTmetrix: `gtmetrix.com`

### Step 9.4: Security Testing

**Check SSL rating:**
- Go to: `ssllabs.com/ssltest/`
- Enter your domain
- Should get A or A+ rating

---

## 10. Troubleshooting Guide 🔧

### 10.1: Website Won't Load

**Symptoms:** Browser shows "This site can't be reached" or "Connection timed out"

**Diagnosis steps:**
```bash
# 1. Check if domain resolves
nslookup yourdomain.com

# 2. Check if server responds
curl -I http://YOUR_PUBLIC_IP

# 3. Check nginx status
sudo systemctl status nginx

# 4. Check application status
pm2 status

# 5. Check firewall
sudo ufw status
```

**Common fixes:**
1. **DNS not propagated:** Wait longer or check DNS settings
2. **Nginx not running:** `sudo systemctl start nginx`
3. **Application not running:** `pm2 restart uddan-app`
4. **Port forwarding:** Check router configuration
5. **Firewall blocking:** `sudo ufw allow 'Nginx Full'`

### 10.2: SSL Certificate Issues

**Symptoms:** Browser shows "Not secure" or certificate errors

**Diagnosis:**
```bash
# Check certificate status
sudo certbot certificates

# Check nginx SSL configuration
sudo nginx -t

# Test SSL manually
openssl s_client -connect yourdomain.com:443
```

**Common fixes:**
1. **Certificate expired:** `sudo certbot renew`
2. **Wrong nginx config:** Check SSL configuration in nginx
3. **Mixed content:** Make sure all resources use HTTPS

### 10.3: Application Errors

**Symptoms:** 500 Internal Server Error or application doesn't work properly

**Diagnosis:**
```bash
# Check application logs
pm2 logs uddan-app

# Check nginx error logs
sudo tail -f /var/log/nginx/error.log

# Check system resources
htop
df -h
```

**Common fixes:**
1. **Application crashed:** `pm2 restart uddan-app`
2. **Out of disk space:** Clean up logs and temporary files
3. **Database issues:** Check file permissions on data directory
4. **Memory issues:** Add swap space or upgrade server

### 10.4: Performance Issues

**Symptoms:** Website loads slowly

**Diagnosis:**
```bash
# Check server resources
htop
iostat 1 5
free -h

# Check disk space
df -h

# Check network
speedtest-cli
```

**Common fixes:**
1. **High CPU:** Optimize application code or upgrade server
2. **Low memory:** Add swap space or reduce memory usage
3. **Disk full:** Clean up logs: `pm2 flush`
4. **Network issues:** Contact ISP

### 10.5: Security Issues

**Common security improvements:**

```bash
# Regular security updates
sudo apt update && sudo apt upgrade -y

# Check for failed login attempts
sudo grep "Failed password" /var/log/auth.log

# Monitor application logs for suspicious activity
pm2 logs uddan-app | grep -i error

# Check firewall logs
sudo ufw status verbose
```

### 10.6: Emergency Recovery

**If everything breaks:**

1. **Check if server is accessible:**
   ```bash
   ping YOUR_PUBLIC_IP
   ```

2. **Try SSH access:**
   ```bash
   ssh yourusername@YOUR_PUBLIC_IP
   ```

3. **If can't access remotely, use physical access:**
   - Connect monitor and keyboard to your laptop
   - Login locally

4. **Emergency fixes:**
   ```bash
   # Disable firewall
   sudo ufw disable
   
   # Stop all services
   pm2 stop all
   sudo systemctl stop nginx
   
   # Check system status
   sudo systemctl status
   
   # Restart services one by one
   sudo systemctl start nginx
   pm2 start all
   ```

---

## 11. Maintenance and Monitoring 📊

### Step 11.1: Regular Maintenance Tasks

**Daily (automated):**
```bash
# Create maintenance script
nano ~/maintenance.sh
```

**Add this content:**
```bash
#!/bin/bash
# Daily maintenance script

echo "=== Daily Maintenance Report $(date) ==="

# Check application status
echo "Application Status:"
pm2 status

# Check disk space
echo "Disk Space:"
df -h

# Check memory usage
echo "Memory Usage:"
free -h

# Check system load
echo "System Load:"
uptime

# Rotate PM2 logs
pm2 flush

# Check for Ubuntu updates
echo "Available Updates:"
apt list --upgradable 2>/dev/null | wc -l

echo "=== End Report ==="
```

**Make it executable and run daily:**
```bash
chmod +x ~/maintenance.sh
crontab -e
# Add: 0 6 * * * /home/yourusername/maintenance.sh >> /home/yourusername/maintenance.log 2>&1
```

**Weekly tasks:**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Check SSL certificate expiry
sudo certbot certificates

# Backup data
tar -czf backup_$(date +%Y%m%d).tar.gz ~/websites/uddan-app/data
```

### Step 11.2: Monitoring Setup

**Install monitoring tools:**
```bash
sudo apt install htop iotop nethogs -y
```

**Monitor in real-time:**
```bash
# System resources
htop

# Disk I/O
sudo iotop

# Network usage
sudo nethogs

# Application logs
pm2 logs uddan-app --lines 50
```

### Step 11.3: Backup Strategy

**Create backup script:**
```bash
nano ~/backup.sh
```

**Add this content:**
```bash
#!/bin/bash
# Backup script for Uddan application

BACKUP_DIR="/home/$(whoami)/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/$(whoami)/websites/uddan-app"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application data
tar -czf $BACKUP_DIR/uddan_data_$DATE.tar.gz $APP_DIR/data

# Backup nginx configuration
sudo cp /etc/nginx/sites-available/uddan $BACKUP_DIR/nginx_config_$DATE

# Backup PM2 configuration
cp $APP_DIR/ecosystem.config.js $BACKUP_DIR/pm2_config_$DATE.js

# Backup environment file
cp $APP_DIR/.env $BACKUP_DIR/env_config_$DATE

# Keep only last 30 backups
find $BACKUP_DIR -name "uddan_*" -mtime +30 -delete

echo "Backup completed: $BACKUP_DIR/uddan_data_$DATE.tar.gz"
```

**Make executable and schedule:**
```bash
chmod +x ~/backup.sh
crontab -e
# Add: 0 2 * * * /home/yourusername/backup.sh
```

---

## 12. Common Issues and Quick Fixes 🚨

### Issue: "502 Bad Gateway"
**Quick fix:**
```bash
pm2 restart uddan-app
sudo systemctl restart nginx
```

### Issue: "Site can't be reached"
**Quick fix:**
```bash
# Check DNS
nslookup yourdomain.com

# Check if nginx is running
sudo systemctl status nginx
sudo systemctl start nginx

# Check firewall
sudo ufw status
sudo ufw allow 'Nginx Full'
```

### Issue: "Application not responding"
**Quick fix:**
```bash
# Check application logs
pm2 logs uddan-app --lines 20

# Restart application
pm2 restart uddan-app

# If still not working, check resources
htop
df -h
```

### Issue: "SSL certificate error"
**Quick fix:**
```bash
# Check certificate status
sudo certbot certificates

# Renew if needed
sudo certbot renew

# Restart nginx
sudo systemctl restart nginx
```

### Issue: "Out of disk space"
**Quick fix:**
```bash
# Check disk usage
df -h

# Clean up logs
pm2 flush
sudo rm /var/log/nginx/*.log.1
sudo apt autoremove -y
sudo apt autoclean

# Remove old backups
find ~/backups -mtime +7 -delete
```

---

## 🎉 Congratulations!

If you've followed all these steps, you now have:

✅ **Your own web server** running Ubuntu  
✅ **Your domain** pointing to your server  
✅ **Your application** running 24/7  
✅ **HTTPS security** with automatic renewal  
✅ **Monitoring and backups** set up  
✅ **Professional hosting** that you control completely  

### Next Steps:
1. **Monitor your server** regularly using the maintenance scripts
2. **Keep everything updated** with regular system updates
3. **Scale up** if you get more traffic (upgrade server hardware)
4. **Learn more** about server administration and security

### Support Resources:
- **PM2 Documentation:** `pm2.keymetrics.io`
- **Nginx Documentation:** `nginx.org/en/docs/`
- **Let's Encrypt Documentation:** `letsencrypt.org/docs/`
- **Ubuntu Server Guide:** `ubuntu.com/server/docs`

### Emergency Contacts:
- **Your Domain Registrar Support**
- **Your Internet Service Provider**
- **Ubuntu Community Forums**

**Remember:** You now own and control your entire web hosting stack. This gives you complete freedom but also complete responsibility. Keep learning and stay secure! 🚀

---

*This guide was created to be as comprehensive as possible. If you encounter any issues not covered here, don't panic! Every problem has a solution. Document the error message, search for it online, and you'll find the fix.*