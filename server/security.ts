import helmet from "helmet";
import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";
import { body, query, param, validationResult } from "express-validator";
import cors from "cors";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import type { Express, Request, Response, NextFunction } from "express";

// Security headers configuration
export function setupSecurityHeaders(app: Express) {
  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:", "data:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "ws:", "wss:", "https:", "http:"],
        mediaSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));

  // CORS configuration - allow development and production origins
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // More permissive CORS for development, strict for production
  if (isDevelopment) {
    app.use(cors({
      origin: true, // Allow all origins in development
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
  } else {
    app.use(cors({
      origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        // Allow same-origin requests and specific domains in production
        const allowedOrigins = [
          'https://udaanagencies.com.np',
          'http://udaanagencies.com.np',
          'https://www.udaanagencies.com.np',
          'http://www.udaanagencies.com.np'
        ];
        
        if (!origin || allowedOrigins.includes(origin) || origin.includes('replit.app')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));
  }

  // Prevent HTTP Parameter Pollution
  app.use(hpp());

  // Data sanitization against NoSQL injection attacks
  app.use(mongoSanitize());
}

// Rate limiting configurations
export function setupRateLimiting(app: Express) {
  // Adaptive rate limiting based on hosting environment
  const isSharedHosting = process.env.SHARED_HOSTING === 'true' || 
                         (process.env.NODE_ENV === 'production' && !process.env.VPS_MODE);
  
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isSharedHosting ? 2000 : 1000, // Much higher for shared hosting to prevent 429 errors
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for WebSocket and static file requests
      return req.url.startsWith('/ws') || 
             req.url.startsWith('/static') || 
             req.url.startsWith('/public') ||
             // Skip rate limiting for common GET endpoints in shared hosting
             (isSharedHosting && req.method === 'GET' && (
               req.url.includes('/api/health') ||
               req.url.includes('/api/testimonials') ||
               req.url.includes('/api/stats') ||
               req.url.includes('/api/jobs/featured') ||
               req.url.includes('/api/user')
             ));
    }
  });

  // Strict rate limiting for authentication endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: "Too many authentication attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Adaptive slow down for shared hosting
  const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15 minutes
    delayAfter: isSharedHosting ? 100 : 200, // More reasonable for shared hosting
    delayMs: () => isSharedHosting ? 250 : 100, // Reduced delay for shared hosting
    validate: { delayMs: false }, // Disable the warning
    skip: (req) => {
      // More aggressive skipping for shared hosting
      if (isSharedHosting) {
        return req.method === 'GET' && (
          req.url.includes('/api/health') ||
          req.url.includes('/api/stats')
        );
      }
      // Original logic for VPS/development
      return req.method === 'GET' && (
        req.url.includes('/api/testimonials') ||
        req.url.includes('/api/jobs') ||
        req.url.includes('/api/stats') ||
        req.url.includes('/api/user')
      );
    }
  });

  // Apply rate limiting
  app.use('/api/', generalLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api/register', authLimiter);
  app.use(speedLimiter);
}

// Input validation middleware
export function validateInput(validations: any[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations, filtering out any invalid ones
    const validValidations = validations.filter(validation => validation && typeof validation.run === 'function');
    await Promise.all(validValidations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation failed",
        errors: errors.array()
      });
    }

    next();
  };
}

// Common validation rules
export const validationRules = {
  email: body('email').isEmail().normalizeEmail().withMessage('Invalid email format'),
  password: body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  id: param('id').isLength({ min: 1 }).withMessage('Invalid ID format'),
  pagination: [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be 0 or greater')
  ],
  search: query('search').optional().trim().escape().isLength({ max: 100 }).withMessage('Search term too long'),
  jobFilters: [
    query('country').optional().trim().escape().isLength({ max: 50 }),
    query('industry').optional().trim().escape().isLength({ max: 50 }),
    query('category').optional().trim().escape().isLength({ max: 50 }),
    query('jobType').optional().isIn(['full-time', 'part-time', 'contract', 'temporary', 'internship']),
    query('experienceLevel').optional().isIn(['entry', 'mid', 'senior', 'executive']),
    query('remoteType').optional().isIn(['remote', 'onsite', 'hybrid']),
    query('visaSupport').optional().isBoolean()
  ]
};

// Sanitize request data
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  // Sanitize string inputs to prevent XSS
  function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      return obj.trim().replace(/[<>]/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitizeObject(obj[key]);
      }
      return sanitized;
    }
    return obj;
  }

  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  next();
}

// Environment validation
export function validateEnvironment() {
  const required = ['DATABASE_URL', 'SESSION_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate session secret strength
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    console.warn('Warning: SESSION_SECRET should be at least 32 characters long');
  }
}

// Enhanced error handling
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Log error details for monitoring
  console.error(`Error ${err.status || 500} on ${req.method} ${req.path}:`, err.message);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const status = err.status || err.statusCode || 500;
  const message = status < 500 || isDevelopment ? err.message : 'Internal Server Error';
  
  // Security headers for error responses
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block'
  });

  res.status(status).json({ 
    message,
    ...(isDevelopment && { stack: err.stack })
  });
}

// Security monitoring middleware
export function securityMonitoring(req: Request, res: Response, next: NextFunction) {
  // Log suspicious activity
  const suspiciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection attempts
    /javascript:/i,  // JavaScript injection
    /data:.*base64/i  // Data URI schemes
  ];

  const requestData = JSON.stringify({ 
    url: req.url, 
    body: req.body, 
    query: req.query 
  });

  suspiciousPatterns.forEach(pattern => {
    if (pattern.test(requestData)) {
      console.warn(`Suspicious request detected from ${req.ip}: ${req.method} ${req.path}`);
    }
  });

  next();
}