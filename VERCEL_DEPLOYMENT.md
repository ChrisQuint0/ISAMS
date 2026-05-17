# ISAMS - Vercel Deployment Guide

## Prerequisites

1. Vercel account
2. Supabase project configured
3. Google OAuth credentials (stored in Supabase `system_config` table)
4. SendGrid API key (stored in Supabase `system_config` table)

## Environment Variables

Set these in your Vercel project settings:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Deployment Steps

### 1. Install Vercel CLI (optional)

```bash
npm install -g vercel
```

### 2. Deploy via GitHub (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure environment variables
6. Deploy!

### 3. Deploy via CLI

```bash
vercel
# Follow prompts to link project and set environment variables
```

## Google OAuth Redirect URI

After deployment, update your Google OAuth redirect URI:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services > Credentials
3. Edit your OAuth 2.0 Client
4. Add authorized redirect URI: `https://your-app.vercel.app/api/oauth2callback`

## Local Development

For local development, run all backends:

```bash
npm run dev
```

This starts:

- Frontend (Vite) on port 5173
- Main backend on port 3000
- Thesis backend on port 3001
- Submission backend on port 3002
- HTE backend on port 3003

## Vercel Configuration

The project uses:

- **Serverless Functions** for API routes (`/api/*`)
- **Static Site** for frontend (React + Vite)
- **60-second timeout** for API functions
- **1024MB memory** for API functions
- **Singapore region** (sin1) for optimal performance

## Troubleshooting

### Issue: API routes returning 404

- Check that all backends export their apps properly
- Verify `vercel.json` rewrites are correct

### Issue: OAuth not working

- Ensure redirect URI in Google Console matches your Vercel domain
- Check that `system_config` table has correct Google credentials

### Issue: Functions timing out

- Check function logs in Vercel dashboard
- May need to optimize long-running operations

## Architecture

```
Frontend (Static) ──> Vercel Edge Network
                      ↓
API Routes (/api/*) ──> Serverless Functions
                      ↓
                   Supabase (Database + Auth)
                      ↓
                   Google Drive API
```

## Cost Estimation

Vercel Free Tier:

- ✅ 100GB bandwidth
- ✅ Unlimited static sites
- ✅ Serverless function executions

Vercel Pro ($20/month):

- ✅ 1TB bandwidth
- ✅ 60-second function timeout
- ✅ Team collaboration

## Next Steps

1. Deploy to Vercel
2. Test all features
3. Update Google OAuth redirect URIs
4. Monitor function logs
5. Set up custom domain (optional)
