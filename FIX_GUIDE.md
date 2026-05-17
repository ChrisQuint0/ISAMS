# Fix Guide: API Connection Errors

## Problem

The deployed Vercel app shows:

- `ERR_CONNECTION_REFUSED` errors
- "Could not retrieve authentication link"
- ⚠️ No system config found in database

## Root Causes

1. **Frontend hardcoded to localhost** - Fixed ✅
2. **System config table empty** - Needs manual fix

---

## Solution Part 1: Frontend API Configuration (✅ COMPLETED)

I've updated all frontend services to use dynamic API URLs:

- Created `/src/lib/apiConfig.js` - Auto-detects environment
- Updated all service files to use `getApiUrl()` instead of hardcoded localhost

### Changed Files:

- `src/lib/apiConfig.js` (NEW)
- `src/features/settings/services/settingsService.js`
- `src/features/thesis-archiving/services/similarityService.js`
- `src/features/thesis-archiving/services/reportService.js`
- `src/features/thesis-archiving/services/thesisService.js`
- `src/features/users/services/usersService.js`
- `src/features/users/pages/UsersPage.jsx`
- `src/features/faculty-requirements/services/*` (all files)

---

## Solution Part 2: Populate System Config in Supabase

### Step 1: Run SQL Script in Supabase

1. Go to your Supabase dashboard
2. Click **SQL Editor** in the left sidebar
3. Open the file: `supabase/migrations/populate_system_config.sql`
4. Click **Run** to execute

This will insert your Google OAuth and SendGrid credentials into the `system_config` table.

### Step 2: Verify Configuration

In Supabase SQL Editor, run:

```sql
SELECT key, SUBSTRING(value, 1, 20) || '...' as value_preview, description
FROM system_config
WHERE key IN (
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'SENDGRID_API_KEY',
  'SENDGRID_FROM_EMAIL',
  'SENDGRID_FROM_NAME'
)
ORDER BY key;
```

You should see 5 rows with your configuration.

---

## Step 3: Rebuild and Redeploy

### Option A: Redeploy on Vercel (Recommended)

```bash
# Commit the changes
git add .
git commit -m "Fix: Use dynamic API URLs and populate system config"
git push origin main

# Vercel will auto-deploy
```

### Option B: Local Build Test

```bash
# Build the frontend
npm run build

# Test locally (requires backends running)
npm run dev
```

---

## Step 4: Update Google OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** > **Credentials**
3. Click your OAuth 2.0 Client ID
4. Under **Authorized redirect URIs**, add:
   ```
   https://YOUR-APP.vercel.app/api/oauth2callback
   ```
5. Save

---

## Verification Checklist

After redeployment, test these:

- [ ] App loads without connection errors
- [ ] Settings page shows "Google Drive Status"
- [ ] Click "Connect Google Drive" opens OAuth popup
- [ ] OAuth completes successfully
- [ ] No "ERR_CONNECTION_REFUSED" in console

---

## How It Works Now

### Development Mode (localhost:5173)

```
Frontend → http://localhost:3000/api/* → Local backend servers
```

### Production Mode (Vercel)

```
Frontend → https://your-app.vercel.app/api/* → Vercel serverless functions
```

### Desktop App (Tauri)

```
Tauri → https://your-app.vercel.app → Vercel serverless functions
```

The `getApiUrl()` function automatically detects the environment!

---

## Troubleshooting

### Still seeing localhost errors?

- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check that new deployment is live on Vercel

### "No system config found"?

- Verify SQL script ran successfully in Supabase
- Check `system_config` table has 5 rows
- Redeploy to Vercel to reload configuration

### OAuth still not working?

- Verify redirect URI in Google Console matches your Vercel domain
- Check Vercel environment variables are set
- View Vercel function logs for errors

---

## Next Steps

1. ✅ Run the SQL script in Supabase
2. ✅ Commit and push changes
3. ✅ Update Google OAuth redirect URI
4. ✅ Test the deployed app
5. ✅ Build desktop installer (if needed)

Once these steps are complete, your app will work perfectly on Vercel! 🎉
