// Quick test to check if .env is being loaded correctly
require('dotenv').config();

console.log('\n🔍 Environment Variable Check:\n');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);
console.log('DATABASE_URL value:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 50) + '...' : 'NOT SET');
console.log('\nSESSION_SECRET exists:', !!process.env.SESSION_SECRET);
console.log('PORT:', process.env.PORT);
console.log('\n');
