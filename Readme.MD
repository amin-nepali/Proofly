# Proofly

## Digital receipts, warranties, and QR codes in one private vault

Proofly is a mobile-first Progressive Web App for keeping proof of purchase close at hand. Save receipts, track warranty dates, scan and regenerate QR codes, and access your vault across devices with Firebase Authentication and Cloud Firestore.

The application is designed for static hosting, including GitHub Pages. It uses semantic HTML, modern CSS, vanilla JavaScript modules, and Firebase's browser SDKs without a build step for the main application.

## Project Ecosystem

<p align="center">
	<a href="https://getbootstrap.com/"><img src="https://img.shields.io/badge/Bootstrap-UI%20ecosystem-7952B3?logo=bootstrap&logoColor=white" alt="Bootstrap"></a>
	<a href="https://cdnjs.com/"><img src="https://img.shields.io/badge/cdnjs-CDN-EB4B4B?logo=cdnjs&logoColor=white" alt="cdnjs"></a>
	<a href="https://unpkg.com/"><img src="https://img.shields.io/badge/UNPKG-CDN-EF2D5E?logo=npm&logoColor=white" alt="UNPKG"></a>
	<a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFCA28?logo=firebase&logoColor=111827" alt="Firebase"></a>
	<a href="https://analytics.google.com/"><img src="https://img.shields.io/badge/Google%20Analytics-Product%20insights-E37400?logo=googleanalytics&logoColor=white" alt="Google Analytics"></a>
	<a href="https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security"><img src="https://img.shields.io/badge/HSTS-HTTPS%20hardening-4C1D95?logo=letsencrypt&logoColor=white" alt="HSTS"></a>
	<a href="https://www.cloudflare.com/"><img src="https://img.shields.io/badge/Cloudflare-Edge%20security-F38020?logo=cloudflare&logoColor=white" alt="Cloudflare"></a>
	<a href="https://vercel.com/"><img src="https://img.shields.io/badge/Vercel-Deployment-000000?logo=vercel&logoColor=white" alt="Vercel"></a>
</p>

<p align="center"><strong>Secure by design. Fast to open. Ready to install.</strong></p>

> **Ecosystem note:** Proofly's active root application uses Firebase, `cdnjs`, and `UNPKG` directly. Bootstrap, Cloudflare, HSTS, Google Analytics, and Vercel represent the surrounding UI, delivery, analytics, security, and hosting ecosystem and should be enabled or configured according to the deployment environment.

## Features

- Email/password and Google sign-in through Firebase Authentication
- Email verification flow for password-based accounts
- Receipt and warranty management
- Warranty expiration indicators for items expiring within 30 days
- Receipt search and category filtering
- Receipt export as JSON
- Camera and image-upload scanning for QR codes and receipt barcodes
- QR code creation, storage, filtering, copying, and image download
- Profile name and compressed profile image support
- Light and dark theme preferences
- Offline application shell through a service worker
- Responsive layouts for mobile and desktop screens
- Installable PWA manifest with application shortcuts

## Technology

- HTML5
- CSS3 with custom properties, Flexbox, and Grid
- JavaScript ES modules
- Firebase v10 browser SDKs
	- Authentication
	- Cloud Firestore
	- Analytics
- `html5-qrcode` for camera and image scanning
- `qrcodejs` for QR generation
- Service Worker and Web App Manifest APIs

## Project Structure

```text
.
├── index.html              # Main dashboard, authentication, and capture flows
├── vault.html              # Receipt and warranty vault
├── qr-vault.html           # Saved and generated QR codes
├── profile.html            # Profile and password settings
├── styles.css              # Application styles and responsive layout
├── manifest.json            # PWA metadata and install shortcuts
├── sw.js                   # Application-shell caching
├── firestore.rules         # Firestore access rules
├── js/
│   ├── app.js              # Dashboard state and event handling
│   ├── auth.js             # Authentication operations
│   ├── account.js          # Account drawer and identity display
│   ├── firebase-config.js  # Firebase client initialization
│   ├── firebase-bootstrap.js
│   ├── scanner.js          # Camera and image scanning
│   ├── vault.js            # Receipt and QR persistence
│   ├── page-vault.js       # Receipt vault page
│   ├── page-qr.js          # QR vault page
│   ├── profile.js          # Profile persistence and image compression
│   └── profile-page.js     # Profile page behavior
└── icons/                  # Logos, application icons, and screenshots
```

The `decompressedTemplate/` and `pwa/` directories contain separate PWABuilder starter-template artifacts. They are not the source modules used by the root Proofly application.

## Requirements

- A modern browser with JavaScript enabled
- Node.js is optional for the root application, but a local static server is recommended
- A Firebase project for cloud authentication and synchronization
- HTTPS for production camera access and service-worker support

## Firebase Setup

1. Create or select a Firebase project.
2. Register a Web App in the Firebase console.
3. Enable the sign-in providers required by the application:
	 - Email/password
	 - Google
4. Add the local and production domains under Authentication > Settings > Authorized domains.
5. Create a Cloud Firestore database.
6. Deploy the rules from `firestore.rules`.
7. Confirm that Analytics is enabled only if its data collection is appropriate for your deployment.

The current client configuration is in `js/firebase-config.js` and is also initialized by `js/firebase-bootstrap.js`. Firebase web API keys identify the project but are not server credentials. Access control must be enforced by Firebase Authentication and Firestore rules, never by hiding the browser configuration.

## Run Locally

Because ES modules, camera access, and service workers require an origin, do not open `index.html` directly from the filesystem.

For example, using Python:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

You can also use any equivalent static file server or the Live Server extension in VS Code.

## Data Model

User data is organized below the authenticated Firebase user ID:

```text
users/{userId}
users/{userId}/receipts/{receiptId}
users/{userId}/qrCodes/{qrCodeId}
```

The Firestore rules currently restrict reads and writes to the matching authenticated user ID. Receipt and QR data are synchronized with real-time listeners while the user is signed in.

## Deployment

Proofly can be deployed as static files to GitHub Pages, Firebase Hosting, Azure Static Web Apps, or another HTTPS static host.

Before production deployment:

1. Set the correct Firebase Authentication authorized domains.
2. Deploy and verify `firestore.rules` in the intended Firebase project.
3. Test sign-in, email verification, Firestore reads/writes, camera permissions, and service-worker updates on the production origin.
4. Configure security headers at the hosting layer, especially Content Security Policy, HSTS, Referrer-Policy, and clickjacking protection.
5. Pin or self-host third-party browser libraries and consider Subresource Integrity for CDN assets.
6. Review Firebase Analytics and data-retention settings.

## Security Notes

Proofly stores personal receipt and QR information. Treat QR payloads as sensitive when they contain Wi-Fi credentials, payment addresses, bank details, or contact information.

The repository includes ownership-based Firestore rules, but client-side validation is not a security boundary. Production deployments should add server-enforced validation for field types, field lengths, document sizes, rate limits, and subscription limits. Do not rely on the browser-only free receipt limit to prevent abuse.

Report suspected vulnerabilities using the process in [SECURITY.md](SECURITY.md). Do not include real credentials, private QR payloads, or personal receipt data in an issue.

## Privacy Considerations

- Firebase Authentication stores account identity and authentication state.
- Cloud Firestore stores profile, receipt, and QR vault data under the authenticated user ID.
- Firebase Analytics may collect usage information when enabled.
- Receipt images referenced by external URLs may be requested by the browser when displayed.
- The application does not provide end-to-end encryption for Firestore data.

Review your Firebase project settings and hosting configuration before using Proofly with highly sensitive information.

## License

No project license has been declared yet. Add a license file before distributing Proofly or accepting external contributions.
