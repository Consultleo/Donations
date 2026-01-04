# Donation Tracker

A simple donation tracking web app with admin and user roles.

## Tech Stack
- **Backend**: Node.js + Express
- **Views**: EJS templates
- **Database**: Supabase Postgres
- **Auth**: bcrypt + express-session
- **Deployment**: Render

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Set up Supabase Database

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project**
3. **Get your connection string**:
   - Go to Project Settings → Database
   - Copy the "Connection string" (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`

### 3. Configure Environment Variables

1. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and add your Supabase connection string:
   ```
   DATABASE_URL=postgresql://postgres:your-password@db.xxx.supabase.co:5432/postgres
   SESSION_SECRET=your-random-secret-key-here
   PORT=3000
   ```

### 4. Initialize Database

Run the initialization script to create tables and admin user:
```bash
npm run init-db
```

This will:
- Create `users`, `donations`, and `session` tables
- Create a default admin user:
  - **Email**: `admin@example.com`
  - **Password**: `admin123`
  - ⚠️ **Change this password after first login!**

### 5. Run the Application

```bash
npm run dev
```

### 6. Test It

1. Visit http://localhost:3000
2. Click "Test Database Connection" to verify Supabase is connected

## Deployment (Render)

Instructions coming soon...
