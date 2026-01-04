# Deployment Guide - Render (Free Tier)

## Why Render Instead of Vercel?

Your application uses:
- ✅ Express.js server (long-running process)
- ✅ PostgreSQL with Supabase
- ✅ Express-session (stateful sessions)

**Render** is perfect for this because:
- Free tier supports full Node.js apps
- Works seamlessly with PostgreSQL
- Handles sessions properly
- Easy GitHub integration

**Vercel** is designed for serverless/static sites and doesn't support traditional Express servers well.

---

## Step-by-Step Deployment to Render

### Prerequisites
- ✅ Your Supabase database is set up and working locally
- ✅ Your code is pushed to a GitHub repository

---

### Step 1: Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Donation Tracker"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Important**: Make sure `.env` is in your `.gitignore` (it already is!) so your secrets don't get pushed.

---

### Step 2: Create a Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started for Free"**
3. Sign up with GitHub (recommended for easy deployment)

---

### Step 3: Create a New Web Service

1. From your Render dashboard, click **"New +"** → **"Web Service"**
2. Connect your GitHub repository:
   - Click **"Connect account"** if needed
   - Select your donation tracker repository
3. Configure the service:

   **Basic Settings:**
   - **Name**: `donation-tracker` (or your preferred name)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

   **Instance Type:**
   - Select **"Free"** (this gives you 750 hours/month free)

---

### Step 4: Set Environment Variables

In the Render dashboard, scroll down to **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Supabase connection string (from `.env`) |
| `SESSION_SECRET` | A random secret key (generate a new one for production!) |
| `NODE_ENV` | `production` |

**To generate a secure SESSION_SECRET**, run locally:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Step 5: Deploy!

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Run `npm install`
   - Start your server with `npm start`
3. Wait 2-3 minutes for the build to complete

---

### Step 6: Initialize the Database

After deployment, you need to run the database initialization **once**:

**Option A: Using Render Shell (Recommended)**
1. In your Render dashboard, go to your service
2. Click **"Shell"** tab
3. Run:
   ```bash
   npm run init-db
   ```

**Option B: Temporarily modify start script**
1. In `package.json`, temporarily change:
   ```json
   "start": "node init-db.js && node server.js"
   ```
2. Push to GitHub (triggers auto-deploy)
3. After first successful deploy, change it back to:
   ```json
   "start": "node server.js"
   ```
4. Push again

---

### Step 7: Test Your Deployment

1. Render will give you a URL like: `https://donation-tracker-xxxx.onrender.com`
2. Visit the URL
3. Log in with:
   - Email: `admin@example.com`
   - Password: `admin123`
4. **Change the admin password immediately!**

---

## Important Notes

### Free Tier Limitations
- ⚠️ **Spins down after 15 minutes of inactivity**
  - First request after inactivity takes ~30 seconds to wake up
  - Subsequent requests are fast
- 750 hours/month free (enough for one always-on service)

### Auto-Deploy
- Every push to `main` branch automatically triggers a new deployment
- Great for continuous deployment!

### Custom Domain (Optional)
- You can add a custom domain in Render settings
- Free SSL certificate included

---

## Troubleshooting

### Build Fails
- Check the build logs in Render dashboard
- Ensure all dependencies are in `package.json`
- Verify `npm install` works locally

### Database Connection Issues
- Verify `DATABASE_URL` is set correctly in environment variables
- Check Supabase connection string is correct
- Ensure Supabase project is active

### App Crashes on Start
- Check the logs in Render dashboard
- Verify `PORT` is not hardcoded (Render assigns it automatically)
- Make sure `server.js` uses `process.env.PORT || 3000`

---

## Alternative: Railway

If you want another option, **Railway** is also great:
- Similar to Render
- Free tier: $5 credit/month
- Easier database management
- Visit [railway.app](https://railway.app)

---

## Why Not Vercel?

Vercel is amazing for:
- Next.js apps
- Static sites
- Serverless functions

But **not ideal** for:
- ❌ Traditional Express servers
- ❌ Long-running processes
- ❌ Stateful sessions
- ❌ WebSocket connections

Your app needs a traditional server, so Render/Railway are better choices.

---

## Next Steps After Deployment

1. ✅ Change admin password
2. ✅ Create additional users
3. ✅ Test all features
4. ✅ Share the URL with your team!

---

**Need help?** Let me know if you run into any issues during deployment!
