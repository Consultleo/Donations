# 🚀 Quick Deploy Checklist

## Before You Deploy

- [ ] Supabase database is set up and working
- [ ] App runs locally without errors
- [ ] `.env` file is in `.gitignore` (✅ already done)
- [ ] Code is committed to Git

---

## Deploy to Render (5 minutes)

### 1️⃣ Push to GitHub
```bash
git init
git add .
git commit -m "Ready for deployment"
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2️⃣ Create Render Account
- Go to [render.com](https://render.com)
- Sign up with GitHub

### 3️⃣ Create Web Service
- Click **New +** → **Web Service**
- Connect your GitHub repo
- Settings:
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Instance Type**: Free

### 4️⃣ Add Environment Variables
```
DATABASE_URL = (your Supabase connection string)
SESSION_SECRET = (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NODE_ENV = production
```

### 5️⃣ Deploy & Initialize
- Click **Create Web Service**
- Wait for build to complete
- Open Shell tab and run: `npm run init-db`

### 6️⃣ Test
- Visit your Render URL
- Login with `admin@example.com` / `admin123`
- Change password immediately!

---

## Your Deployment URLs

**Render**: `https://donation-tracker-xxxx.onrender.com`

---

## Generate SESSION_SECRET

Run this locally to generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `SESSION_SECRET` in Render.

---

## Troubleshooting

**Build fails?**
- Check Render logs
- Verify `package.json` has all dependencies

**Can't connect to database?**
- Verify `DATABASE_URL` in Render environment variables
- Check Supabase connection string

**App won't start?**
- Check Render logs
- Verify `npm start` works locally

---

## Free Tier Notes

⚠️ **Render Free Tier**:
- Spins down after 15 min of inactivity
- First request after sleep takes ~30 seconds
- 750 hours/month free

💡 **Tip**: Upgrade to paid tier ($7/month) for always-on service

---

**Full guide**: See `DEPLOYMENT_GUIDE.md`
