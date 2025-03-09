
// Simple Express server with auth and API endpoints
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const path = require('path');
const { Pool } = require('pg');
// Use import() for node-fetch as it's an ESM module
let fetch;
(async () => {
  const module = await import('node-fetch');
  fetch = module.default;
})();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/securenum'
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Password hashing functions
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${derivedKey.toString('hex')}.${salt}`);
    });
  });
}

async function comparePasswords(supplied, stored) {
  if (!stored || !stored.includes('.')) {
    return false;
  }
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");

  return new Promise((resolve, reject) => {
    crypto.scrypt(supplied, salt, 64, (err, buf) => {
      if (err) reject(err);
      resolve(crypto.timingSafeEqual(hashedBuf, Buffer.from(buf)));
    });
  });
}

// Set up Passport strategy
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = rows[0];
    if (!user || !(await comparePasswords(password, user.password))) {
      return done(null, false);
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { rows } = await pool.query('SELECT id, username FROM users WHERE id = $1', [id]);
    done(null, rows[0] || false);
  } catch (err) {
    done(err);
  }
});

// reCAPTCHA verification
async function verifyRecaptcha(token) {
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`
    });

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return false;
  }
}

// Auth middleware
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Unauthorized' });
}

// Auth routes
app.post('/api/register', async (req, res, next) => {
  try {
    const { username, password, recaptchaToken } = req.body;
    
    if (!recaptchaToken) {
      return res.status(400).send("reCAPTCHA verification required");
    }

    const isRecaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!isRecaptchaValid) {
      return res.status(400).send("reCAPTCHA verification failed");
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length > 0) {
      return res.status(400).send("Username already exists");
    }
    
    const hashedPassword = await hashPassword(password);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username',
      [username, hashedPassword]
    );
    
    const user = result.rows[0];
    
    req.login(user, (err) => {
      if (err) return next(err);
      return res.status(201).json(user);
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/login', (req, res, next) => {
  const { recaptchaToken } = req.body;
    
  if (!recaptchaToken) {
    return res.status(400).send("reCAPTCHA verification required");
  }

  verifyRecaptcha(recaptchaToken).then(isRecaptchaValid => {
    if (!isRecaptchaValid) {
      return res.status(400).send("reCAPTCHA verification failed");
    }

    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Invalid credentials" });

      req.login(user, (err) => {
        if (err) return next(err);
        return res.status(200).json(user);
      });
    })(req, res, next);
  }).catch(err => next(err));
});

app.post('/api/logout', (req, res) => {
  req.logout(function(err) {
    if (err) return res.status(500).json({ message: 'Error logging out' });
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

// API routes
app.get('/api/numbers', isAuthenticated, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM numbers WHERE user_id = $1 ORDER BY id',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching numbers' });
  }
});

app.post('/api/numbers', isAuthenticated, async (req, res) => {
  try {
    const { value } = req.body;
    if (typeof value !== 'number') {
      return res.status(400).json({ message: 'Value must be a number' });
    }
    
    const { rows } = await pool.query(
      'INSERT INTO numbers (value, user_id) VALUES ($1, $2) RETURNING *',
      [value, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Error creating number' });
  }
});

app.delete('/api/numbers/:id', isAuthenticated, async (req, res) => {
  try {
    const numberId = parseInt(req.params.id);
    if (isNaN(numberId)) {
      return res.status(400).json({ message: 'Invalid number ID' });
    }
    
    await pool.query(
      'DELETE FROM numbers WHERE id = $1 AND user_id = $2',
      [numberId, req.user.id]
    );
    res.status(200).json({ message: 'Number deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting number' });
  }
});

// AI chat simulation
app.post('/api/chat', isAuthenticated, (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ message: 'Message is required' });
  }
  
  // Simple response based on keywords
  const lowerMessage = message.toLowerCase();
  let response = 'I\'m here to help you with managing your numbers. What would you like to know?';
  
  if (lowerMessage.includes('help')) {
    response = 'I can help you manage your numbers. Try asking about adding, viewing, or deleting numbers.';
  } else if (lowerMessage.includes('add') || lowerMessage.includes('create')) {
    response = 'To add a new number, use the form at the top of the page. Enter any number and click "Add Number".';
  } else if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
    response = 'To delete a number, find it in your list and click the trash icon next to it.';
  } else if (lowerMessage.includes('view') || lowerMessage.includes('see') || lowerMessage.includes('list')) {
    response = 'Your numbers are displayed in the list below the input form. They\'re automatically updated when you add or delete numbers.';
  }
  
  res.json({ message: response });
});

// Serve static files
app.use(express.static(path.resolve(__dirname, 'public')));
app.use(express.static('.'));

// Fall through to index.html
app.use('*', (_req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Create tables if they don't exist
async function initializeDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS numbers (
        id SERIAL PRIMARY KEY,
        value INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    console.log('Database initialized');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initializeDatabase();
