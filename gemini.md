# ISAMS Project Context - Desktop Application

## 🚀 Tech Stack (The "Source of Truth")
- **Frontend Framework:** React (v19) + Vite
- **Core Language:** JavaScript (JSX)
- **Styling:** Tailwind CSS (v4)
- **UI Components:** Radix UI / shadcn (Accessible components)
- **Routing:** React Router (v7)
- **Backend / Wrapper:** Tauri (v2) + Rust
- **Database & Auth:** Supabase

## 🗺️ Project Structure & Map
ISAMS/
├── .env.local               # ⚠️ SECRETS: Supabase URL & Anon Key
├── package.json             # Frontend dependencies & scripts
├── tauri.conf.json          # Desktop Window & Permission config
│
├── src/                     # FRONTEND (React + Vite)
│   ├── App.jsx              # Core Layout & Component Shell
│   ├── main.jsx             # React DOM Entry Point
│   ├── assets/              # Logos, Icons, and Images
│   ├── components/ui/       # Shared Shadcn/Tailwind UI atoms
│   ├── lib/                 # Supabase client & Helper utils
│   ├── routes/AppRoutes.jsx # Navigation & Page Mapping
│   └── features/            # 🚀 CORE BUSINESS LOGIC
│       ├── auth/            # Login, Session, & Registration
│       ├── dashboard/       # Main Overview & Stats
│       ├── class-management/# Student/Class CRUD logic
│       └── faculty-reqs/    # Faculty document submissions
│
└── src-tauri/               # BACKEND (Rust)
    └── src/                 # System commands & OS integration

## 🤖 Interaction Rules for Gemini
1. **Feature-First Workflow:** When creating a new feature, always create a new sub-folder in `src/features/`.
2. **The "Tauri Bridge":** Frontend calls Rust commands in `src-tauri/src/` for any File System or Google Drive API operations.
3. **Supabase Usage:** Use the client in `src/lib/` for all database calls. Do not re-initialize the client in individual components.
4. **Style Guidelines:** Use Tailwind for all styling. Prioritize Shadcn components from `src/components/ui/`.

## 🛠️ Development Philosophy
- **Frontend-First:** This is a "Frontend-Heavy" Tauri app. 
- **Data Logic:** All Supabase interactions and business logic should stay in React (`.jsx` files).
- **Rust Usage:** Only use Rust for features that are impossible in the browser (like deep system tray integration or local file system access beyond the standard API).