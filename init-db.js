// Database initialization script
// Run this once to set up your database tables and create an admin user

require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('./db');

async function initDatabase() {
    console.log('🔧 Initializing database...\n');

    try {
        // Create users table
        console.log('Creating users table...');
        await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'user')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Users table created');

        // Create donations table
        console.log('Creating donations table...');
        await db.query(`
      CREATE TABLE IF NOT EXISTS donations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
        currency VARCHAR(3) DEFAULT 'EUR',
        donated_on DATE NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Donations table created');

        // Create indexes
        console.log('Creating indexes...');
        await db.query(`
      CREATE INDEX IF NOT EXISTS idx_donations_user_id ON donations(user_id)
    `);
        await db.query(`
      CREATE INDEX IF NOT EXISTS idx_donations_donated_on ON donations(donated_on)
    `);
        console.log('✅ Indexes created');

        // Create session table
        console.log('Creating session table...');
        await db.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        PRIMARY KEY (sid)
      )
    `);
        await db.query(`
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session(expire)
    `);
        console.log('✅ Session table created');

        // Create default admin user
        console.log('\nCreating default admin user...');
        const adminEmail = 'admin@example.com';
        const adminPassword = 'admin123';
        const passwordHash = await bcrypt.hash(adminPassword, 10);

        await db.query(`
      INSERT INTO users (email, password_hash, role) 
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO NOTHING
    `, [adminEmail, passwordHash, 'admin']);

        console.log('✅ Admin user created');
        console.log('\n📧 Admin credentials:');
        console.log('   Email: admin@example.com');
        console.log('   Password: admin123');
        console.log('   ⚠️  Change this password after first login!\n');

        console.log('🎉 Database initialization complete!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing database:', error);
        process.exit(1);
    }
}

initDatabase();
