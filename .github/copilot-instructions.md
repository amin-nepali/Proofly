# PROOFLY - DEVELOPMENT GUIDELINES

## Project Meta
- Name: Proofly (UI Badge: "Proofly by Amin")
- Stack: HTML5, Modern CSS3 (Variables/Flex/Grid), Vanilla JS (ES6 modules), Firebase v10 (Auth + Firestore), html5-qrcode, PWA.
- Targets: Mobile-first Web (GitHub Pages) & Android APK (PWABuilder / `com.amin.proofly`).
- Constraint: 100% complete, working code. Zero placeholders, zero `// TODO`, free tier APIs/resources only.

## Architecture & Code Structure
├── index.html          # Semantic layout, Auth modal, Scanner modal, Dashboard Grid
├── styles.css          # Mobile-first (320px+), dark/light CSS vars, responsive layout
├── js/
│   ├── firebase-config.js # Firebase v10 initialization
│   ├── auth.js         # Google & Email/Password Auth handlers
│   ├── scanner.js      # html5-qrcode initialization & result binding
│   ├── vault.js        # Firestore CRUD, 15-receipt limit check, real-time listener
│   └── app.js          # Core event listeners & app bootstrap
├── manifest.json       # PWA manifest (com.amin.proofly, standalone)
└── sw.js               # Service Worker offline asset caching

## Key Logic Rules
1. Sync: Cloud Firestore `onSnapshot` real-time listeners for live web/Android sync.
2. Expiration: Highlight items with warranty expiration < 30 days.
3. Limits: Block adding >15 receipts for free accounts; show upgrade banner.