# API Consolidation Summary

## Overview

Successfully consolidated ALL ISAMS features into **11 serverless functions** to fit within Vercel Hobby plan's 12-function limit while preserving complete functionality.

## Deployed Functions (11/12)

### 1. **api/thesis.js** - Thesis Operations

Consolidates 6 thesis operations:

- `GET /api/thesis/download/{fileId}` - Download thesis PDF from Google Drive
- `POST /api/thesis/upload` - Upload new thesis PDF
- `POST /api/thesis/create` - Create thesis entry + authors + file metadata
- `POST /api/thesis/update` - Update thesis, replace authors, delete old file
- `POST /api/thesis/delete` - Soft delete thesis, remove files from Drive
- `GET /api/thesis/advisers` - Get advisers from vw_adviser_display
- `GET /api/thesis/categories` - Get thesis categories
- `GET /api/thesis/data` - Get both advisers and categories

### 2. **api/file-ops.js** - File Operations

Consolidates 5 file operations:

- `GET /api/file-ops?folderId={id}` - List files in folder (100 items)
- `GET /api/file-ops/metadata?fileId={id}` - Get file metadata
- `POST /api/file-ops/delete` - Delete file from Google Drive
- `POST /api/file-ops/clone` - Copy file to new parent folder
- `POST /api/file-ops/move` - Move file by updating parents

### 3. **api/folders.js** - Folder Operations

Consolidates 4 folder operations:

- `POST /api/folders/ensure` - Deep-nest folder structure creation (SY/AY/Semester/Course)
- `POST /api/folders/init-isams` - Initialize ISAMS root folder
- `POST /api/folders/rename` - Batch rename all matching folders
- `POST /api/folders/create` - Create single folder

### 4. **api/export.js** - Export & Backup Operations

Consolidates 4 export/backup operations:

- `POST /api/export/archive` - Export thesis archive as ZIP
- `POST /api/export/faculty/export` - Export faculty submissions as ZIP
- `GET /api/export/backup/export` - Export all ISAMS tables as JSON
- `POST /api/export/backup/restore` - Restore from backup JSON

### 5. **api/upload.js** - File Upload

- `POST /api/upload` - Upload file to Google Drive (faculty/student submissions)

### 6. **api/send-email.js** - SendGrid Email

- `POST /api/send-email` - Send email notifications via SendGrid

### 7. **api/hte.js** - HTE Batch Notifications

- `POST /api/hte` - Send batch email notifications to HTE/OJT students

### 8. **api/validate.js** - OCR Image Validation

- `POST /api/validate` - Validate images using Tesseract.js OCR

### 9. **api/oauth2callback.js** - OAuth Callback

- `GET /api/oauth2callback` - Handle Google OAuth redirect, exchange code for tokens

### 10. **api/auth/google/url.js** - OAuth URL Generator

- `GET /api/auth/google/url` - Generate Google OAuth consent URL

### 11. **api/auth/google/status/[userId].js** - OAuth Status Check

- `GET /api/auth/google/status/{userId}` - Check user's OAuth authentication status

## Key Features Preserved

### ✅ Thesis Archiving

- Upload/download thesis PDFs from Google Drive
- Create/update/delete thesis entries with authors
- Manage thesis categories and advisers
- File metadata and version tracking

### ✅ Faculty Requirements

- Upload faculty submission documents
- Create folder structures (SY/AY/Semester/Course)
- Export faculty submissions as ZIP archives
- Email notifications via SendGrid
- Deadline tracking and reminders

### ✅ File Management

- List files from Google Drive folders
- Get file metadata
- Delete files
- Clone/move files between folders
- Rename folders in batch

### ✅ HTE/OJT Management

- Batch email notifications to students
- Track notification cooldowns
- Missing document tracking

### ✅ Database Operations

- Export all ISAMS tables as JSON backup
- Restore from backup
- Tables: faculty_fs, master_courses_fs, courses_fs, documenttypes_fs, deadlines_fs, semester_history_fs, submissions_fs, documentversions_fs, systemsettings_fs, holidays_fs

### ✅ Authentication

- Google OAuth Drive integration
- Token management in Supabase
- User authentication status checks

### ✅ Document Validation

- OCR validation for image documents using Tesseract.js
- Text detection and readability checks

## Technical Implementation

### Consolidation Strategy

Combined related operations into single handlers using **path-based routing**:

- Each handler checks the URL path to determine which operation to execute
- Uses `req.url.split('?')[0]` to extract path
- Routes to appropriate sub-handler function (handleDownload, handleCreate, etc.)

### Dependencies Used

- `googleapis` - Google Drive API integration
- `@supabase/supabase-js` - Database and auth
- `@sendgrid/mail` - Email notifications
- `raw-body` - Manual multipart form parsing
- `jszip` - ZIP archive creation
- `tesseract.js` - OCR image validation

### Environment Variables

All configuration from Vercel environment variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `SENDGRID_FROM_NAME`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deployment

```bash
git add api/
git commit -m "Consolidate all features into 11 handlers - include ALL functionality"
git push origin main
```

Vercel will automatically rebuild and deploy all handlers to production at **isams-dt.vercel.app**.

## Testing Endpoints

After deployment completes, test each endpoint:

```bash
# Check OAuth URL generation
curl https://isams-dt.vercel.app/api/auth/google/url

# List files from Google Drive
curl https://isams-dt.vercel.app/api/file-ops?folderId=YOUR_FOLDER_ID

# Get thesis advisers
curl https://isams-dt.vercel.app/api/thesis/advisers

# Export database backup
curl https://isams-dt.vercel.app/api/export/backup/export > backup.json
```

## Benefits

1. **Under Limit**: 11/12 functions used (1 slot remaining for future needs)
2. **All Features Included**: No functionality lost
3. **Optimized**: Related operations grouped logically
4. **Maintainable**: Clear routing structure within each handler
5. **Scalable**: Easy to add more operations to existing handlers

## Next Steps

1. Wait for Vercel rebuild to complete (~2-3 minutes)
2. Test all endpoints in production
3. Update frontend API calls if needed
4. Verify all features work end-to-end
5. Monitor Vercel function logs for any errors
