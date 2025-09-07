import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
// import { storage } from "./storage"; // PostgreSQL storage - REMOVED
import { JSONStorageAdapter } from "./json-storage-adapter";

// Create JSON storage instance for auth
const storage = new JSONStorageAdapter();
import { User as SelectUser } from "@shared/schema";
// JSON Session Storage
import { simpleJsonDb } from "./simple-json-storage";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

// JSON-based session store
class JSONSessionStore extends session.Store {
  async get(sid: string, callback: (err?: any, session?: session.SessionData) => void) {
    try {
      const sessionData = await simpleJsonDb.findById('sessions', sid);
      if (sessionData && new Date(sessionData.expires) > new Date()) {
        callback(null, sessionData.data);
      } else {
        callback(null, null);
      }
    } catch (error) {
      callback(error);
    }
  }

  async set(sid: string, session: session.SessionData, callback?: (err?: any) => void) {
    try {
      const expires = session.cookie?.expires || new Date(Date.now() + 2 * 60 * 60 * 1000);
      await simpleJsonDb.create('sessions', {
        id: sid,
        data: session,
        expires: expires.toISOString()
      });
      callback?.();
    } catch (error) {
      // Try to update if exists
      try {
        const expires = session.cookie?.expires || new Date(Date.now() + 2 * 60 * 60 * 1000);
        await simpleJsonDb.update('sessions', sid, {
          data: session,
          expires: expires.toISOString()
        });
        callback?.();
      } catch (updateError) {
        callback?.(updateError);
      }
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await simpleJsonDb.delete('sessions', sid);
      callback?.();
    } catch (error) {
      callback?.(error);
    }
  }
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Configure JSON session store
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fallback-secret-key",
    resave: false,
    saveUninitialized: false,
    store: new JSONSessionStore(),
    cookie: {
      maxAge: 2 * 60 * 60 * 1000, // 2 hours (much shorter)
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
      sameSite: 'strict' // More secure
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "username", passwordField: "password" },
      async (username, password, done) => {
        try {
          const user = await storage.getUserByUsername(username);
          if (!user || !(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid username or password" });
          }
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    ),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error("Deserialize user error:", error);
      done(null, false);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Create user with hashed password
      const hashedPassword = await hashPassword(password);
      
      // Auto-assign admin role for specific credentials
      const isAdminUser = username === "Admin_Udaan_7075" && 
                         password === "udaan7075973" && 
                         email === "info.udaanagencies@gmail.com";
      
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: isAdminUser ? "admin" : "user",
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return next(loginErr);
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      // Destroy the session completely
      req.session.destroy((destroyErr) => {
        if (destroyErr) {
          console.error("Session destroy error:", destroyErr);
        }
        // Clear the session cookie
        res.clearCookie('connect.sid');
        res.status(200).json({ message: "Logged out successfully" });
      });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { password: _, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
}

// Middleware to check if user is authenticated
export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user has admin privileges
export const isAdmin = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && (req.user.role === "admin" || req.user.role === "editor")) {
    return next();
  }
  res.status(403).json({ message: "Insufficient privileges" });
};

export { hashPassword, comparePasswords };