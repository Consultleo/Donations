require('dotenv').config();
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('./db');
const { requireAuth, requireAdmin, redirectIfAuthenticated } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session setup with Postgres store
app.use(session({
  store: new pgSession({
    pool: db.pool,
    tableName: 'session'
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// ==================== ROUTES ====================

// Home - redirect to login or dashboard
app.get('/', (req, res) => {
  if (req.session && req.session.userId) {
    return res.redirect('/me');
  }
  res.redirect('/login');
});

// Login page
app.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', { error: null });
});

// Login POST
app.post('/login', redirectIfAuthenticated, async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const result = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Check password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.render('login', { error: 'Invalid email or password' });
    }

    // Set session
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.role = user.role;

    // Redirect based on role
    res.redirect('/me');
  } catch (error) {
    console.error('Login error:', error);
    res.render('login', { error: 'An error occurred. Please try again.' });
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
});

// Dashboard (protected route)
app.get('/me', requireAuth, async (req, res) => {
  try {
    // Get user info from database
    const result = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );

    if (result.rows.length === 0) {
      return res.redirect('/logout');
    }

    const user = result.rows[0];

    // Get user's donations
    const donationsResult = await db.query(
      'SELECT * FROM donations WHERE user_id = $1 ORDER BY donated_on DESC',
      [req.session.userId]
    );

    const donations = donationsResult.rows;

    res.render('dashboard', { user, donations });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// ==================== DONATION ROUTES ====================

// Show donation form
app.get('/donations/new', requireAuth, async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );

    const user = userResult.rows[0];

    // If admin, fetch all users for the dropdown
    let allUsers = null;
    if (user.role === 'admin') {
      const usersResult = await db.query(
        'SELECT id, email, role FROM users ORDER BY email ASC'
      );
      allUsers = usersResult.rows;
    }

    res.render('donation-form', { user, allUsers, error: null });
  } catch (error) {
    console.error('Error loading donation form:', error);
    res.status(500).send('Error loading form');
  }
});

// Create donation
app.post('/donations/new', requireAuth, async (req, res) => {
  const { amount, currency, donated_on, note, user_id } = req.body;

  try {
    // Get current user info
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = userResult.rows[0];

    // Get all users if admin (for re-rendering form on error)
    let allUsers = null;
    if (user.role === 'admin') {
      const usersResult = await db.query(
        'SELECT id, email, role FROM users ORDER BY email ASC'
      );
      allUsers = usersResult.rows;
    }

    // Determine target user ID
    let targetUserId;
    if (user.role === 'admin' && user_id) {
      // Admin selected a specific user
      targetUserId = user_id;
    } else if (user.role === 'admin' && !user_id) {
      // Admin didn't select a user
      return res.render('donation-form', {
        user,
        allUsers,
        error: 'Please select a user for this donation'
      });
    } else {
      // Regular user - donation for themselves
      targetUserId = req.session.userId;
    }

    // Validate input
    if (!amount || parseFloat(amount) <= 0) {
      const userResult = await db.query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [req.session.userId]
      );
      return res.render('donation-form', {
        user: userResult.rows[0],
        error: 'Please enter a valid amount'
      });
    }

    if (!donated_on) {
      const userResult = await db.query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [req.session.userId]
      );
      return res.render('donation-form', {
        user: userResult.rows[0],
        error: 'Please select a date'
      });
    }

    // Insert donation for the target user
    await db.query(
      'INSERT INTO donations (user_id, amount, currency, donated_on, note) VALUES ($1, $2, $3, $4, $5)',
      [targetUserId, amount, currency || 'EUR', donated_on, note || null]
    );

    res.redirect('/me');
  } catch (error) {
    console.error('Error creating donation:', error);
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    res.render('donation-form', {
      user: userResult.rows[0],
      error: 'An error occurred. Please try again.'
    });
  }
});

// ==================== ADMIN ROUTES ====================

// List all users (admin only)
app.get('/admin/users', requireAdmin, async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = userResult.rows[0];

    const usersResult = await db.query(
      'SELECT id, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    const users = usersResult.rows;

    res.render('admin-users', { user, users });
  } catch (error) {
    console.error('Error loading users:', error);
    res.status(500).send('Error loading users');
  }
});

// Show create user form (admin only)
app.get('/admin/users/new', requireAdmin, async (req, res) => {
  try {
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = userResult.rows[0];

    res.render('admin-create-user', { user, error: null });
  } catch (error) {
    console.error('Error loading create user form:', error);
    res.status(500).send('Error loading form');
  }
});

// Create new user (admin only)
app.post('/admin/users/new', requireAdmin, async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = userResult.rows[0];

    // Validate input
    if (!email || !password || !role) {
      return res.render('admin-create-user', {
        user,
        error: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.render('admin-create-user', {
        user,
        error: 'Password must be at least 6 characters'
      });
    }

    if (role !== 'user' && role !== 'admin') {
      return res.render('admin-create-user', {
        user,
        error: 'Invalid role'
      });
    }

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.render('admin-create-user', {
        user,
        error: 'A user with this email already exists'
      });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
      [email, passwordHash, role]
    );

    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error creating user:', error);
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    res.render('admin-create-user', {
      user: userResult.rows[0],
      error: 'An error occurred. Please try again.'
    });
  }
});

// View specific user and their donations (admin only)
app.get('/admin/users/:id', requireAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = userResult.rows[0];

    const viewedUserResult = await db.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (viewedUserResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const viewedUser = viewedUserResult.rows[0];

    const donationsResult = await db.query(
      'SELECT * FROM donations WHERE user_id = $1 ORDER BY donated_on DESC',
      [userId]
    );
    const donations = donationsResult.rows;

    res.render('admin-user-detail', { user, viewedUser, donations });
  } catch (error) {
    console.error('Error loading user details:', error);
    res.status(500).send('Error loading user details');
  }
});

// Show edit user form (admin only)
app.get('/admin/users/:id/edit', requireAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = userResult.rows[0];

    const editUserResult = await db.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (editUserResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const editUser = editUserResult.rows[0];

    res.render('admin-edit-user', { user, editUser, error: null });
  } catch (error) {
    console.error('Error loading edit user form:', error);
    res.status(500).send('Error loading form');
  }
});

// Update user (admin only)
app.post('/admin/users/:id/edit', requireAdmin, async (req, res) => {
  const userId = req.params.id;
  const { email, role, password } = req.body;

  try {
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = userResult.rows[0];

    const editUserResult = await db.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (editUserResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const editUser = editUserResult.rows[0];

    // Validate input
    if (!email || !role) {
      return res.render('admin-edit-user', {
        user,
        editUser,
        error: 'Email and role are required'
      });
    }

    if (role !== 'user' && role !== 'admin') {
      return res.render('admin-edit-user', {
        user,
        editUser,
        error: 'Invalid role'
      });
    }

    // Check if email is already taken by another user
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );

    if (existingUser.rows.length > 0) {
      return res.render('admin-edit-user', {
        user,
        editUser,
        error: 'A user with this email already exists'
      });
    }

    // Update user email and role
    await db.query(
      'UPDATE users SET email = $1, role = $2 WHERE id = $3',
      [email, role, userId]
    );

    // Update password if provided
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.render('admin-edit-user', {
          user,
          editUser: { ...editUser, email, role },
          error: 'Password must be at least 6 characters'
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, userId]
      );
    }

    res.redirect('/admin/users');
  } catch (error) {
    console.error('Error updating user:', error);
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const editUserResult = await db.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );
    res.render('admin-edit-user', {
      user: userResult.rows[0],
      editUser: editUserResult.rows[0],
      error: 'An error occurred. Please try again.'
    });
  }
});

// Show donation form for specific user (admin only)
app.get('/admin/users/:id/donations/new', requireAdmin, async (req, res) => {
  const userId = req.params.id;

  try {
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = userResult.rows[0];

    const targetUserResult = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (targetUserResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const targetUser = targetUserResult.rows[0];

    res.render('admin-donation-form', { user, targetUser, error: null });
  } catch (error) {
    console.error('Error loading donation form:', error);
    res.status(500).send('Error loading form');
  }
});

// Create donation for specific user (admin only)
app.post('/admin/users/:id/donations/new', requireAdmin, async (req, res) => {
  const userId = req.params.id;
  const { amount, currency, donated_on, note } = req.body;

  try {
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const user = userResult.rows[0];

    const targetUserResult = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (targetUserResult.rows.length === 0) {
      return res.status(404).send('User not found');
    }

    const targetUser = targetUserResult.rows[0];

    // Validate input
    if (!amount || parseFloat(amount) <= 0) {
      return res.render('admin-donation-form', {
        user,
        targetUser,
        error: 'Please enter a valid amount'
      });
    }

    if (!donated_on) {
      return res.render('admin-donation-form', {
        user,
        targetUser,
        error: 'Please select a date'
      });
    }

    // Insert donation
    await db.query(
      'INSERT INTO donations (user_id, amount, currency, donated_on, note) VALUES ($1, $2, $3, $4, $5)',
      [userId, amount, currency || 'EUR', donated_on, note || null]
    );

    res.redirect(`/admin/users/${userId}`);
  } catch (error) {
    console.error('Error creating donation:', error);
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [req.session.userId]
    );
    const targetUserResult = await db.query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );
    res.render('admin-donation-form', {
      user: userResult.rows[0],
      targetUser: targetUserResult.rows[0],
      error: 'An error occurred. Please try again.'
    });
  }
});


// Database test route
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time, version() as db_version');
    res.send(`
      <h1>Database Connection Test</h1>
      <p>✅ Connected to database!</p>
      <p><strong>Current time:</strong> ${result.rows[0].current_time}</p>
      <p><strong>Database version:</strong> ${result.rows[0].db_version}</p>
      <p><a href="/">← Back</a></p>
    `);
  } catch (error) {
    res.status(500).send(`
      <h1>Database Connection Test</h1>
      <p>❌ Database connection failed!</p>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><a href="/">← Back</a></p>
    `);
  }
});

// Start server - bind to 0.0.0.0 for Render compatibility
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
