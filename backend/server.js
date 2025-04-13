const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const db = new sqlite3.Database('./database.sqlite');
const PORT = process.env.PORT || 3001;
const SECRET = 'c33c591ce7fc4b1b2495fc383eac573bbd3812a46f3db3c99ec46ac31bf51171';

app.use(cors());
app.use(express.json());

// =================== DATABASE INIT =================== //
db.serialize(() => {
  // Users
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT CHECK(role IN ('systemadmin', 'normaluser', 'storeowner')) NOT NULL,
      address TEXT
    )
  `);

  // Stores
  db.run(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      address TEXT,
      image TEXT,
      owner_id INTEGER,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    )
  `);

  // Ratings
  db.run(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      store_id INTEGER,
      rating INTEGER CHECK(rating >= 1 AND rating <= 5),
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(store_id) REFERENCES stores(id)
    )
  `);
});

// =================== AUTH =================== //
app.post('/api/auth/signup', async (req, res) => {
  const { username, email, password, role, address } = req.body;

  if (!['systemadmin', 'normaluser', 'storeowner'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO users (username, email, password, role, address) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, role, address],
      function (err) {
        if (err) return res.status(400).json({ message: 'User already exists or invalid data.' });
        res.status(201).json({ message: 'User registered successfully.' });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password, role } = req.body;

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ message: 'Invalid credentials.' });
    if (user.role !== role) return res.status(403).json({ message: `This account is not registered as ${role}.` });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '1h' });
    res.json({ message: 'Login successful', token, role: user.role, userId: user.id });
  });
});

// =================== MIDDLEWARE =================== //
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// =================== ADMIN ROUTES =================== //
app.get('/api/admin/summary', authenticateToken, (req, res) => {
  if (req.user.role !== 'systemadmin') return res.sendStatus(403);

  db.get('SELECT COUNT(*) as total_users FROM users', (err1, userRow) => {
    db.get('SELECT COUNT(*) as total_stores FROM stores', (err2, storeRow) => {
      db.get('SELECT COUNT(*) as total_ratings FROM ratings', (err3, ratingRow) => {
        if (err1 || err2 || err3) return res.status(500).json({ error: 'Summary fetch failed' });
        res.json({
          total_users: userRow.total_users,
          total_stores: storeRow.total_stores,
          total_ratings: ratingRow.total_ratings
        });
      });
    });
  });
});

app.get('/api/admin/users', authenticateToken, (req, res) => {
  if (req.user.role !== 'systemadmin') return res.sendStatus(403);
  const { name = '', email = '', address = '', role = '' } = req.query;

  db.all(`
    SELECT * FROM users
    WHERE username LIKE ? AND email LIKE ? AND address LIKE ? AND role LIKE ?
  `, [`%${name}%`, `%${email}%`, `%${address}%`, `%${role}%`], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Users fetch failed' });
    res.json(rows);
  });
});

app.get('/api/admin/stores', authenticateToken, (req, res) => {
  if (req.user.role !== 'systemadmin') return res.sendStatus(403);

  db.all(`
    SELECT s.*, AVG(r.rating) as average_rating
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    GROUP BY s.id
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: 'Store list failed' });
    res.json(rows);
  });
});

// Add store (admin)
app.post('/api/admin/add-store', authenticateToken, (req, res) => {
  if (req.user.role !== 'systemadmin') return res.sendStatus(403);
  const { name, email, address, image, owner_id } = req.body;

  db.run(`
    INSERT INTO stores (name, email, address, image, owner_id)
    VALUES (?, ?, ?, ?, ?)
  `, [name, email, address, image, owner_id], function (err) {
    if (err) return res.status(500).json({ error: 'Add store failed' });
    res.json({ success: true, id: this.lastID });
  });
});

// =================== NORMAL USER ROUTES =================== //
app.get('/api/user/stores', authenticateToken, (req, res) => {
  if (req.user.role !== 'normaluser') return res.sendStatus(403);

  db.all(`
    SELECT s.*, AVG(r.rating) as average_rating,
      (SELECT rating FROM ratings WHERE user_id = ? AND store_id = s.id) as user_rating
    FROM stores s
    LEFT JOIN ratings r ON s.id = r.store_id
    GROUP BY s.id
  `, [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Store fetch failed' });
    res.json(rows);
  });
});

app.post('/api/user/rate', authenticateToken, (req, res) => {
  if (req.user.role !== 'normaluser') return res.sendStatus(403);
  const { store_id, rating } = req.body;

  db.get('SELECT * FROM ratings WHERE user_id = ? AND store_id = ?', [req.user.id, store_id], (err, existing) => {
    if (existing) {
      db.run('UPDATE ratings SET rating = ? WHERE id = ?', [rating, existing.id], function (err) {
        if (err) return res.status(500).json({ error: 'Update failed' });
        res.json({ updated: true });
      });
    } else {
      db.run('INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)', [req.user.id, store_id, rating], function (err) {
        if (err) return res.status(500).json({ error: 'Insert failed' });
        res.json({ success: true });
      });
    }
  });
});

// =================== STORE OWNER ROUTES =================== //
app.get('/api/store/my-store', authenticateToken, (req, res) => {
  if (req.user.role !== 'storeowner') return res.sendStatus(403);

  db.get('SELECT * FROM stores WHERE owner_id = ?', [req.user.id], (err, store) => {
    if (err || !store) return res.status(404).json({ error: 'Store not found' });

    db.all(`
      SELECT u.username, r.rating FROM ratings r
      JOIN users u ON r.user_id = u.id
      WHERE r.store_id = ?
    `, [store.id], (err, ratings) => {
      if (err) return res.status(500).json({ error: 'Rating fetch failed' });

      const average = ratings.length
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
        : 0;

      res.json({ store, ratings, average });
    });
  });
});

// Change password endpoint for store owner
app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword) return res.status(400).json({ message: 'New password is required.' });

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id], function (err) {
      if (err) return res.status(500).json({ message: 'Failed to update password.' });
      res.json({ message: 'Password updated successfully.' });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// Submit or modify a rating for a store
app.post('/api/ratings/:storeId', authenticateToken, async (req, res) => {
  const { rating } = req.body;
  const { storeId } = req.params;

  if (rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be between 1 and 5.' });

  // Check if the user has already rated this store
  const userId = req.user.id;
  const existingRating = await db.get('SELECT * FROM ratings WHERE user_id = ? AND store_id = ?', [userId, storeId]);

  if (existingRating) {
    // Update existing rating
    await db.run('UPDATE ratings SET rating = ? WHERE id = ?', [rating, existingRating.id]);
  } else {
    // Add a new rating
    await db.run('INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)', [userId, storeId, rating]);
  }

  res.status(200).json({ message: 'Rating submitted successfully.' });
});

// Get all stores
app.get('/api/store/all', async (req, res) => {
  const stores = await db.all('SELECT * FROM stores');
  res.json({ stores });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
