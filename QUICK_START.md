# Quick Start Checklist

## ✅ Pre-Deployment Checklist

- [ ] Have Vercel account ready
- [ ] Have Supabase project URL and keys
- [ ] Google OAuth credentials in Supabase `system_config` table
- [ ] SendGrid API key in Supabase `system_config` table
- [ ] Code pushed to GitHub (recommended)

## 🚀 Deployment Steps

### 1. Deploy to Vercel (5 minutes)

**Option A: Via Vercel Dashboard**

```
1. Go to vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
5. Click "Deploy"
```

**Option B: Via CLI**

```bash
npm install -g vercel
vercel login
vercel
# Follow prompts
```

### 2. Update Google OAuth (2 minutes)

```
1. Go to console.cloud.google.com
2. APIs & Services > Credentials
3. Edit OAuth 2.0 Client
4. Add redirect URI:
   https://YOUR-APP.vercel.app/api/oauth2callback
5. Save
```

### 3. Test Your Deployment (5 minutes)

Visit: `https://YOUR-APP.vercel.app`

Test:

- [ ] Login works
- [ ] Google OAuth works
- [ ] File uploads work
- [ ] All modules accessible

### 4. Create Desktop App (10 minutes)

1. Open `src-tauri/tauri.conf.json`
2. Replace these values:
   ```json
   {
     "build": {
       "devUrl": "https://YOUR-APP.vercel.app",
       "beforeDevCommand": "",
       "beforeBuildCommand": ""
     },
     "app": {
       "windows": [
         {
           "url": "https://YOUR-APP.vercel.app"
         }
       ]
     },
     "bundle": {
       "resources": []
     }
   }
   ```
3. Build installer:
   ```bash
   npm run tauri build
   ```
4. Find installer in `src-tauri/target/release/bundle/`

## 🎯 What Changed

### Modified Files

- `server.js` - Exports app for serverless
- `thesis_backend.js` - Exports app for serverless
- `submission_backend.js` - Exports app for serverless
- `hte_backend.js` - Exports app for serverless
- `vite.config.js` - Removed local proxy

### New Files

- `api/index.js` - Main API handler
- `api/thesis/[...path].js` - Thesis API handler
- `api/submission/[...path].js` - Submission API handler
- `api/hte/[...path].js` - HTE API handler
- `vercel.json` - Vercel configuration
- `.vercelignore` - Deployment exclusions
- `.env.example` - Environment template
- `VERCEL_DEPLOYMENT.md` - Full deployment guide
- `DESKTOP_APP_WRAPPER.md` - Desktop app guide
- `DEPLOYMENT_SUMMARY.md` - Architecture overview

## 💡 Key Points

1. **Your code still works locally** - Just run `npm run dev`
2. **Backends are dual-mode** - Work standalone AND serverless
3. **API keys stay in Supabase** - Secure by default
4. **Desktop app becomes tiny** - From 500MB+ to ~5-10MB
5. **Updates are instant** - Deploy to Vercel, everyone gets it

## 🆘 Getting Help

If something doesn't work:

1. Check Vercel function logs (dashboard > Functions)
2. Check browser console for errors
3. Verify environment variables are set
4. Review `VERCEL_DEPLOYMENT.md` for detailed troubleshooting

## 📊 Expected Results

After deployment:

- ✅ Web app accessible at `https://YOUR-APP.vercel.app`
- ✅ Desktop installer ~5-10MB (vs 500MB+ before)
- ✅ Google OAuth working properly
- ✅ All features functional
- ✅ Fast global CDN delivery

## 🎉 You're Done!

When all checkboxes are ticked, you have:

- ✅ Web app deployed on Vercel
- ✅ Desktop app as lightweight wrapper
- ✅ Simplified architecture
- ✅ Easy updates workflow

---

**Total Time Estimate: ~25 minutes**

Ready to deploy? Start with Step 1! 🚀
