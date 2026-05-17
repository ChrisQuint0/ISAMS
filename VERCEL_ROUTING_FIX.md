# Vercel API Routing Fix

## Problem

When deploying to Vercel, API endpoints were returning **404 errors** despite the handlers existing. The root cause was **Vercel's serverless function routing limitations with catch-all routes**.

### Symptoms
- ✅ `/api/thesis/advisers` worked (simple route)
- ❌ `/api/thesis/download/FILE_ID` failed with 404 (path parameter)
- ❌ `/api/thesis/upload` failed (POST to catch-all)
- ❌ Other thesis operations failed

### Root Cause

Vercel's file-based routing system doesn't reliably handle:
1. **Path parameters in nested catch-all routes** (e.g., `api/thesis/[...path].js` handling `/api/thesis/download/:fileId`)
2. **Dynamic route segment parsing** from `req.query.path` arrays
3. **Nested operation routing** within catch-all handlers

## Solution

### Strategy: Direct File-Based Routing

Instead of using catch-all routes with path-based operations, create **dedicated handler files** for each API endpoint that Vercel can route to directly.

### Implementation

#### Before (❌ Failed on Vercel)
```
api/
  thesis/
    [...path].js  ← Catch-all handler trying to route everything
```

Called as: `/api/thesis/download/FILE_ID`

#### After (✅ Works on Vercel)
```
api/
  thesis/
    download.js      ← Direct handler for downloads
    upload.js        ← Direct handler for uploads
    create.js        ← Direct handler for create
    update.js        ← Direct handler for update
    delete.js        ← Direct handler for delete
    advisers.js      ← Direct handler for advisers
    categories.js    ← Direct handler for categories
    data.js          ← Direct handler for combined data
    [...path].js     ← Kept as fallback (still works for /advisers, /categories)
```

Called as: `/api/thesis/download?fileId=FILE_ID` (query params)

### Key Changes

#### 1. Download Route - Query Parameters Instead of Path Parameters

**Before:**
```javascript
// Frontend
getApiUrl(`/api/thesis/download/${fileId}`)

// Handler (trying to parse from [...path].js)
const fileId = pathSegments[1]; // Unreliable on Vercel
```

**After:**
```javascript
// Frontend (src/features/thesis-archiving/services/thesisService.js)
getApiUrl(`/api/thesis/download?fileId=${fileId}`)

// Handler (api/thesis/download.js)
const fileId = req.query.fileId; // Direct query param access
```

#### 2. Dedicated Handlers for Each Operation

Created individual handler files:

**api/thesis/download.js:**
```javascript
export default async function handler(req, res) {
  const fileId = req.query.fileId;
  // ... download logic
}
```

**api/thesis/upload.js:**
```javascript
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({...});
  // ... upload logic with multipart parsing
}
```

**api/thesis/create.js:**
```javascript
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({...});
  const { entry, authors, gdriveFile } = JSON.parse(rawBody);
  // ... create logic
}
```

**api/thesis/update.js:**
```javascript
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({...});
  const { id, entry, authors, gdriveFile } = JSON.parse(rawBody);
  // ... update logic
}
```

**api/thesis/delete.js:**
```javascript
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({...});
  const { id } = JSON.parse(rawBody);
  // ... delete logic
}
```

**api/thesis/advisers.js, categories.js, data.js:**
```javascript
export default async function handler(req, res) {
  const supabase = createClient(process.env.VITE_SUPABASE_URL, ...);
  const { data } = await supabase.from('table').select('*');
  res.json(data);
}
```

#### 3. Folder Operations

**api/folders/init-isams.js:**
```javascript
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({...});
  const { rootFolderId } = JSON.parse(rawBody);
  // ... folder initialization logic
}
```

### Why This Works

1. **Vercel's File-Based Routing:**
   - `api/thesis/download.js` → `/api/thesis/download`
   - `api/thesis/upload.js` → `/api/thesis/upload`
   - Direct 1:1 mapping Vercel can understand

2. **No Dynamic Segment Parsing:**
   - Query parameters (`?fileId=xxx`) are standard HTTP
   - No reliance on `req.query.path` array parsing
   - No URL regex matching needed

3. **Independent Handlers:**
   - Each operation is self-contained
   - No routing logic within handlers
   - Vercel can optimize each function independently

## Benefits

### ✅ Reliability
- Vercel's native routing handles all endpoints
- No path parsing ambiguity
- Predictable behavior

### ✅ Performance
- Each function can be optimized separately
- Better cold start times
- Independent scaling

### ✅ Maintainability
- Clear file structure matches API routes
- Easy to find and update specific endpoints
- Isolated testing

### ✅ Debugging
- Vercel logs show exact function called
- No routing logic to debug
- Clear error traces

## File Structure Overview

```
api/
├── thesis/
│   ├── download.js       # GET /api/thesis/download?fileId=xxx
│   ├── upload.js         # POST /api/thesis/upload
│   ├── create.js         # POST /api/thesis/create
│   ├── update.js         # POST /api/thesis/update
│   ├── delete.js         # POST /api/thesis/delete
│   ├── advisers.js       # GET /api/thesis/advisers
│   ├── categories.js     # GET /api/thesis/categories
│   ├── data.js           # GET /api/thesis/data
│   └── [...path].js      # Fallback for other routes
├── folders/
│   ├── init-isams.js     # POST /api/folders/init-isams
│   └── [...path].js      # Fallback (ensure, rename, create)
├── export/
│   └── [...path].js      # Handles archive, backup, restore
├── file-ops/
│   └── [...path].js      # Handles list, metadata, delete, clone, move
├── auth/
│   └── google/
│       ├── url.js        # GET /api/auth/google/url
│       └── status/
│           └── [userId].js
├── hte.js                # HTE notification operations
├── upload.js             # General file upload
├── send-email.js         # Email sending
├── validate.js           # File validation
└── oauth2callback.js     # OAuth callback handler
```

## Frontend Changes Required

Only the download URL format changed:

```javascript
// Before
getApiUrl(`/api/thesis/download/${fileId}`)

// After
getApiUrl(`/api/thesis/download?fileId=${fileId}`)
```

All other endpoints remain unchanged since they use POST with JSON bodies.

## Server.js (Localhost) Compatibility

Updated `server.js` to support both formats:

```javascript
app.get("/api/thesis/download/:fileId?", async (req, res) => {
  const fileId = req.params.fileId || req.query.fileId; // Both work
  // ... download logic
});
```

This ensures:
- ✅ Localhost development works
- ✅ Vercel production works
- ✅ No environment-specific code needed

## Vercel Configuration

No special rewrites needed in `vercel.json`:

```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 60,
      "memory": 1024
    }
  },
  "rewrites": [
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

Vercel automatically routes based on file structure.

## Testing Checklist

- [x] Download thesis file: `/api/thesis/download?fileId=xxx`
- [x] Upload thesis file: `/api/thesis/upload`
- [x] Create thesis entry: `/api/thesis/create`
- [x] Update thesis entry: `/api/thesis/update`
- [x] Delete thesis entry: `/api/thesis/delete`
- [x] Get advisers: `/api/thesis/advisers`
- [x] Get categories: `/api/thesis/categories`
- [x] Get combined data: `/api/thesis/data`
- [x] Initialize ISAMS folder: `/api/folders/init-isams`

## Lessons Learned

1. **Vercel's catch-all routes are unreliable for nested operations**
   - Use dedicated files for each endpoint
   - Keep catch-all routes simple or as fallbacks only

2. **Query parameters > Path parameters for serverless**
   - More reliable parsing
   - Better compatibility with serverless platforms
   - Standard HTTP practices

3. **File structure = API structure**
   - Direct mapping is most reliable
   - Easier to understand and maintain
   - Platform-native approach

4. **Test on target platform early**
   - Localhost behavior ≠ Vercel behavior
   - Catch-all routing especially differs
   - Always validate deployment matches local

## Related Documentation

- [Vercel API Routes](https://vercel.com/docs/functions/serverless-functions)
- [Vercel Dynamic Routes](https://vercel.com/docs/functions/serverless-functions/routing)
- [File-Based Routing Best Practices](https://vercel.com/docs/functions/serverless-functions#file-based-routing)

---

**Fix Applied:** May 17, 2026  
**Impact:** All thesis operations now work on both localhost and Vercel production  
**Breaking Changes:** Download URL format changed (path param → query param)
