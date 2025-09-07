import express, { type Request, Response, NextFunction } from "express";
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { registerRoutes } from "./routes";
import { serveStatic, log } from "./vite";
import { fileWatcher } from "./fileWatcher";
import {
  setupSecurityHeaders,
  setupRateLimiting,
  sanitizeRequest,
  validateEnvironment,
  errorHandler,
  securityMonitoring,
} from "./security";
import { addHealthCheck, optimizeForSharedHosting } from "./shared-hosting-optimizations";
import { cleanupService } from "./cleanupService";

// Validate environment variables on startup
validateEnvironment();

const app = express();

// Security middleware - must be first
setupSecurityHeaders(app);
setupRateLimiting(app);

// Body parsing with size limits
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Request sanitization
app.use(sanitizeRequest);
app.use(securityMonitoring);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Add health check endpoint
  addHealthCheck(app);
  
  // Initialize shared hosting optimizations
  optimizeForSharedHosting();
  
  const server = await registerRoutes(app);

  // Setup WebSocket server for real-time file monitoring (only in development or VPS)
  const isSharedHosting = process.env.SHARED_HOSTING === 'true' || 
                         process.env.NODE_ENV === 'production' && !process.env.VPS_MODE;
  
  if (!isSharedHosting) {
    const wss = new WebSocketServer({ server, path: '/ws' });
    
    wss.on('connection', (ws) => {
      log('🔌 WebSocket client connected for file monitoring');
      fileWatcher.addClient(ws);
    });
    log('📡 WebSocket file monitoring enabled');
  } else {
    log('🚫 WebSocket disabled for shared hosting optimization');
  }

  // Enhanced error handling
  app.use(errorHandler);

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    const { loadViteSetup } = await import("./vite-loader");
    const setupVite = await loadViteSetup();
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);

      // Start the automatic cleanup service for expired advertisements
      cleanupService.start();
      
      // Log hosting environment
      const isSharedHosting = process.env.SHARED_HOSTING === 'true' || 
                             process.env.NODE_ENV === 'production' && !process.env.VPS_MODE;
      log(`🏠 Hosting mode: ${isSharedHosting ? 'Shared Hosting (Optimized)' : 'VPS/Development'}`);
    },
  );
})();
