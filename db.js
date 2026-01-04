const { Pool } = require('pg');

// Create a connection pool to Supabase Postgres
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Supabase
    }
});

// Test connection
pool.on('connect', () => {
    console.log('✅ Connected to Supabase database');
});

pool.on('error', (err) => {
    console.error('❌ Unexpected database error:', err);
});

// Helper function to query the database
async function query(text, params) {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Executed query', { text, duration, rows: res.rowCount });
        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}

// Helper to get a client from the pool (for transactions)
async function getClient() {
    const client = await pool.connect();
    return client;
}

module.exports = {
    query,
    getClient,
    pool
};
