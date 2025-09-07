# Shared Hosting Deployment Guide

## Quick Setup for Shared Hosting

Your application is now optimized for shared hosting environments! Here's how to deploy it:

### 1. Environment Configuration

Copy the shared hosting environment file:
```bash
cp .env.shared-hosting .env
```

Edit `.env` and update:
- `SESSION_SECRET` - Use a secure 32+ character random string
- `PORT` - Use the port your hosting provider assigns
- `DOMAIN` - Your actual domain name

### 2. Install Dependencies

```bash
npm install --production
```

### 3. Build for Production

```bash
npm run build
```

### 4. Start the Application

```bash
npm start
```

## Optimizations for Shared Hosting

### ✅ Enabled Optimizations

**Rate Limiting:**
- Conservative limits (50 requests per 15 minutes)
- Automatic slowdown after 20 requests
- Health check endpoint exempted

**Caching:**
- 5-minute API response caching
- Automatic cache cleanup every 10 minutes
- Memory-based cache for faster responses

**Resource Management:**
- Disabled WebSocket connections
- Polling fallback every 5 minutes
- Memory monitoring and cleanup
- Garbage collection optimization

**File Operations:**
- Safe file writing with backups
- Better error handling for permission issues
- Reduced concurrent file access

### 🚫 Disabled Features

**Real-time Features:**
- WebSocket file watching → Polling every 5 minutes
- Live updates → Manual refresh every 5 minutes
- Instant notifications → Delayed notifications

### 📊 Monitoring

**Health Check Endpoint:**
Visit `/api/health` to see:
- Server status and uptime
- Memory usage
- Cache statistics
- Hosting environment type

### 🔧 Troubleshooting

**Common Issues:**

1. **429 Too Many Requests:**
   - Wait 15 minutes for rate limit reset
   - Check if hitting API endpoints too frequently
   - Verify cache is working: `/api/health`

2. **File Permission Errors:**
   - Ensure data directory is writable: `chmod 777 data/`
   - Check file ownership matches web server user

3. **Memory Issues:**
   - Monitor memory at `/api/health`
   - Cache automatically clears at 150MB usage
   - Consider upgrading hosting plan if frequent issues

4. **Slow Performance:**
   - Enable caching by setting `SHARED_HOSTING=true`
   - Verify cache hit rate at `/api/health`
   - Consider CDN for static assets

### 📈 Performance Tips

1. **Enable All Optimizations:**
   ```bash
   # In .env
   SHARED_HOSTING=true
   NODE_ENV=production
   ```

2. **Monitor Resource Usage:**
   ```bash
   curl https://yourdomain.com/api/health
   ```

3. **Cache Headers:**
   - Static files automatically cached
   - API responses cached for 5 minutes
   - Health check never cached

## Comparison: Shared Hosting vs VPS

| Feature | Shared Hosting | VPS/Own Server |
|---------|----------------|----------------|
| WebSocket | ❌ Disabled | ✅ Enabled |
| Real-time Updates | ⏱️ 5-min polling | ⚡ Instant |
| Rate Limits | 🔒 Conservative | 🔓 Generous |
| Caching | 💾 Aggressive | 🚀 Minimal |
| File Watching | ❌ Disabled | ✅ Enabled |
| Memory Usage | 📊 Monitored | 🔧 Unlimited |

## Migration to VPS

When ready to upgrade to VPS/own server:

1. Change environment:
   ```bash
   # In .env
   VPS_MODE=true
   SHARED_HOSTING=false
   ```

2. Restart application:
   ```bash
   npm restart
   ```

3. Features automatically enabled:
   - WebSocket connections
   - Real-time file watching
   - Higher rate limits
   - Reduced caching

Your application is now fully optimized for both shared hosting and VPS environments! 🎉