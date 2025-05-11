// Load environment variables first!
require('dotenv').config();

import { Request, Response, NextFunction } from 'express';

// Use import for modules
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import path from 'path';
import cors from 'cors';

// Local imports - Use require, path relative to current file
// Keep using require for local files unless module system is fully changed
const { supabase } = require('./src/lib/supabase'); 
const apiHandler = require('./api/index');      
const configApiHandler = require('./api/config'); // Import the new config router

// const __dirname = path.dirname(fileURLToPath(import.meta.url)); // Not needed for CJS
const isProd = process.env.NODE_ENV === 'production';

// --- Configuration ---
let allowedOrigins: string[] = []; // Initialize as empty

if (isProd) {
  // Production Origins
  allowedOrigins = [
    // Get CLIENT_URL from environment variable
    ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
    // Support for custom domains if specified
    ...(process.env.ADDITIONAL_ORIGINS ? process.env.ADDITIONAL_ORIGINS.split(',') : [])
  ];
} else {
  // Development Origins
  allowedOrigins = [
    'http://localhost:80',
    'http://localhost',
    'http://localhost:8080',
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000'  // Alt dev port
  ];
}

// Add CLIENT_URL to allowed origins if it's set and not already included
// This handles cases where CLIENT_URL might be set even in dev, or ensure it's added in prod
if (process.env.CLIENT_URL && !allowedOrigins.includes(process.env.CLIENT_URL)) {
    allowedOrigins.push(process.env.CLIENT_URL);
}

// Remove potential duplicates and filter falsy values (just in case)
allowedOrigins = [...new Set(allowedOrigins)].filter(Boolean);

const PORT = process.env.PORT || 8080; // Standardize to 8080 based on Railway logs/changelog

// --- CORS Setup ---
// REMOVED dynamic corsOptions function
/*
const corsOptions: any = (req: Request, callback: (err: Error | null, options?: any) => void) => {
  let options;
  const origin = req.header('Origin');
  if (!origin || allowedOrigins.indexOf(origin) !== -1) {
    options = { origin: true, credentials: true }; 
  } else {
    console.warn(`CORS: Blocked origin - ${origin}`);
    options = { origin: false }; 
  }
  callback(null, options); 
};
*/

// --- CSRF Token Generation ---
function generateCsrfToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

// --- Server Creation ---
async function createServer() {
  const app = express();

  // --- Core Middleware --- ORDER ADJUSTED
  
  // 1. Trust Proxy (Important for rate limiting/logging behind a proxy)
  app.set('trust proxy', 1); 
  
  // 2. CORS (Allow cross-origin requests early)
  // When experiencing CORS issues, temporarily try the simpler configuration
  if (isProd && process.env.DISABLE_CORS === 'true') {
    // Simplified CORS for debugging
    app.use(cors());
    console.log('⚠️ Running with ALL CORS origins enabled for debugging');
  } else {
    app.use(cors({ 
      origin: allowedOrigins, 
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token-Header'],
      exposedHeaders: ['X-CSRF-Token-Value']
    }));
    console.log(`CORS configured with specific origins: ${allowedOrigins.join(', ')}`);
  }
  
  // 3. Helmet (Set security headers)
  // Temporarily disable Helmet to test if it's causing issues
  if (isProd && process.env.DISABLE_HELMET === 'true') {
    console.log('⚠️ Running without Helmet security headers for debugging');
  } else {
    app.use(helmet({ 
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            connectSrc: [
              "'self'", 
              `http://localhost:${PORT}`,
              isProd ? 'https://*.supabase.co' : 'http://localhost:*', 
              isProd ? 'wss://*.supabase.co' : 'ws://localhost:*',
              'https://api.stripe.com',
              'https://*.stripe.com',
              'https://*.googleapis.com',
              ...allowedOrigins 
            ],
            scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com', 'https://*.googleapis.com'],
            frameSrc: ["'self'", 'https://js.stripe.com', 'https://*.stripe.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            imgSrc: ["'self'", 'data:', 'blob:', 'https://*.stripe.com', 'https://*.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: isProd ? [] : null, 
            baseUri: ["'self'"],
            formAction: ["'self'"],
            pluginTypes: null,
          },
        },
        hsts: isProd ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
        frameguard: { action: 'deny' },
        noSniff: true,
        xssFilter: true,
        crossOriginEmbedderPolicy: false, 
        crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, 
        referrerPolicy: { policy: 'no-referrer-when-downgrade' },
        permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    }));
  }
  
  // 4. Cookie Parser
  app.use(cookieParser());

  // 5. Stripe Webhook Raw Body Parser (Specific to route)
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

  // 5.5 Middleware to copy raw body buffer to req.rawBody for the webhook handler
  app.use('/api/webhooks/stripe', (req: Request, res: Response, next: NextFunction) => {
    if (Buffer.isBuffer(req.body)) {
      (req as any).rawBody = req.body;
      // console.log('Webhook raw body copied to req.rawBody.');
    } else {
      console.warn('Webhook: req.body was not a buffer after express.raw ran.');
      (req as any).rawBody = req.body || null;
    }
    next();
  });

  // 6. Standard JSON and URL-encoded body parsers (Global)
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // 7. CSRF Protection (AFTER body/cookie parsing)
  // Temporarily disable CSRF for debugging if needed
  if (isProd && process.env.DISABLE_CSRF === 'true') {
    // --- LOGGING FOR DISABLED CSRF --- (Keep this)
    console.log('⚠️ Running without CSRF protection for debugging');
    // --- Add a dummy middleware if disabled to avoid breaking chain --- 
    app.use((req: Request, res: Response, next: NextFunction) => { next(); });
  } else {
    // --- Setup CSRF Protection Middleware ---
    app.use((req: Request, res: Response, next: NextFunction) => {
      const cookieName = 'csrf_token_cookie'; // New cookie name
      const headerName = 'x-csrf-token-header'; // New custom request header name
      const responseHeaderName = 'x-csrf-token-value'; // Custom response header name

      let csrfToken = req.cookies[cookieName];

      // If no token cookie exists, generate one and set the cookie
      if (!csrfToken) {
         csrfToken = generateCsrfToken();
         // console.log(`CSRF Middleware: Generated new token: ${csrfToken}`);
         res.cookie(cookieName, csrfToken, {
          httpOnly: true,
          secure: isProd, // false in dev (localhost HTTP), true in prod (HTTPS required)
          sameSite: isProd ? 'none' : 'lax', // 'none' for cross-domain in prod, 'lax' for dev
          path: '/',
          domain: isProd ? process.env.COOKIE_DOMAIN : undefined // Use environment variable
        });
         // console.log(`CSRF Middleware: Set HttpOnly cookie.`);
       }

      // --- ALWAYS set the response header --- 
      // This ensures the frontend can always grab the current token value
      res.setHeader(responseHeaderName, csrfToken);
      // Optional: Reduce noise by only logging if different from previous?
      // console.log(`CSRF Middleware: Ensuring ${responseHeaderName} header is set: ${csrfToken}`); 

      // Skip CSRF check for safe methods and specific paths
      if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || 
          req.path === '/health' ||
          req.path.startsWith('/api/webhooks/')) { 
        return next();
      }
      
      // Verify token for unsafe methods
      const headerToken = req.headers[headerName];
      const cookieToken = req.cookies[cookieName]; // Read from the HttpOnly cookie

      // Remove or comment out debug logging
      // console.log(`CSRF Debug: Cookie=${cookieToken}, Header=${headerToken}, Path=${req.path}, Method=${req.method}, Origin=${req.header('Origin')}`);
      
      if (!cookieToken || !headerToken || cookieToken !== headerToken) {
        console.warn(`CSRF Failed (Double Submit): path=${req.path}, method=${req.method}, origin=${req.header('Origin')}`); 
        return res.status(403).json({ error: 'CSRF token validation failed (Double Submit)' });
      }
      
      // console.log(`CSRF Check PASSED (Double Submit) for ${req.method} ${req.path}`); // Debugging
      next();
    });
  }
  
  // 8. Rate Limiting (AFTER potentially parsing identifying info like IP/auth)
  // Temporarily disable rate limiting for debugging if needed
  if (isProd && process.env.DISABLE_RATE_LIMIT === 'true') {
    console.log('⚠️ Running without rate limiting for debugging');
  } else {
    const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, standardHeaders: 'draft-6', legacyHeaders: false });
    const apiLimiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 100, standardHeaders: 'draft-6', legacyHeaders: false });
    app.use('/api/auth', authLimiter); 
    app.use('/api', apiLimiter);
  }

  // --- API Routes ---
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
  });

  // Mount the main API handler 
  app.use('/api/config', configApiHandler); // Mount the MORE SPECIFIC config routes FIRST
  app.use('/api', apiHandler); // Mount the main handler LAST for fallback

  // --- Error Handling --- (Must be last)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error("💥 Central Error:", err.name, err.message);
    if (!isProd) {
        console.error(err.stack);
    }
    const statusCode = err.statusCode || err.status || 500;
    const message = err.expose || !isProd ? err.message : 'Internal Server Error';
    res.status(statusCode).json({ error: message });
  });

  // --- Start Server ---
  app.listen(PORT, () => {
    console.log(`✅ API Server running in ${isProd ? 'production' : 'development'} mode on port ${PORT}`);
    console.log(`Allowed Origins: ${allowedOrigins.join(', ')}`);
  });
}

// --- Run Server ---
createServer().catch(err => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
}); 