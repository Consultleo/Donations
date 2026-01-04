#!/usr/bin/env node

/**
 * Deployment initialization script
 * This runs init-db once, then starts the server
 */

const { spawn } = require('child_process');
const fs = require('fs');

const INIT_FLAG_FILE = '/tmp/db-initialized';

async function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args, { stdio: 'inherit' });
        proc.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Command failed with code ${code}`));
            } else {
                resolve();
            }
        });
    });
}

async function main() {
    // Check if database has already been initialized
    if (!fs.existsSync(INIT_FLAG_FILE)) {
        console.log('🔧 First deployment detected - initializing database...');
        try {
            await runCommand('node', ['init-db.js']);
            // Create flag file to prevent re-initialization
            fs.writeFileSync(INIT_FLAG_FILE, new Date().toISOString());
            console.log('✅ Database initialized successfully!');
        } catch (error) {
            console.error('❌ Database initialization failed:', error.message);
            console.log('⚠️  Continuing anyway - you may need to run init-db manually');
        }
    } else {
        console.log('✅ Database already initialized, skipping init-db');
    }

    // Start the server
    console.log('🚀 Starting server...');
    await runCommand('node', ['server.js']);
}

main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
