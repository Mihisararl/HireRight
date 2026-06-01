# HireRight Provider Mobile App

React Native (Expo) app for **service providers**, connected to the same HireRight backend as the web frontend.

## Features

- Provider login (`POST /api/auth/login`) with JWT stored in AsyncStorage
- Job tabs matching the web provider dashboard:
  - **My Jobs** — `GET /api/provider/jobs` (alias of `/api/services/provider`)
  - **Find Work** — `GET /api/services/available` + send offer
  - **Bookings** — `GET /api/services/bookings/direct` + accept/reject
- **Job Details** — customer, service, location (lat/lng), maps link
- **Start Journey** — `POST /api/provider/start-journey`
- **Live location tracking** — `POST /api/provider/update-location` every 10s via `expo-location`
- **Complete Job** — `POST /api/services/:id/complete`
- **Earnings** — `GET /api/payment/provider`
- **Reviews** — `GET /api/reviews/provider`
- **Profile** — availability toggle, logout

## Project structure

```
provider-mobile/
├── App.js
├── app.json
├── src/
│   ├── api/           # axios API modules (auth, jobs, provider, payment, review)
│   ├── components/    # JobCard, SegmentTabs, LoadingView, EmptyState
│   ├── constants/     # theme colors/spacing
│   ├── context/       # AuthContext
│   ├── hooks/         # useLocationTracking
│   ├── navigation/    # AppNavigator (stack + tabs)
│   ├── screens/       # Login, Jobs, JobDetails, Earnings, Reviews, Profile
│   └── utils/         # config, storage, locationHelpers
└── README.md
```

## Setup

1. Install dependencies (already done if you cloned after scaffold):

```bash
cd provider-mobile
npm install
```

2. **API URL** — auto-detected in dev from your Expo dev server IP (same Wi‑Fi as your phone).

   Optional override in `provider-mobile/.env`:

   ```
   EXPO_PUBLIC_API_URL=http://10.250.46.86:5000/api
   ```

   Replace with your PC's LAN IP (`ipconfig` on Windows). The login screen also shows the URL in use.

| Environment | Example URL |
|-------------|-------------|
| Physical device (auto) | `http://<expo-host-ip>:5000/api` |
| Android emulator | `http://10.0.2.2:5000/api` |
| iOS simulator | `http://localhost:5000/api` |

> Backend runs on port **5000** (not 3000). Phone and PC must be on the **same Wi‑Fi**. Allow Node.js through Windows Firewall if login shows a network error.

### Expo Go compatibility

This project uses **Expo SDK 54**, which matches the Expo Go app on the Google Play Store and Apple App Store.

If you previously saw *"Project is incompatible with this version of Expo Go"*, that was because the project was on SDK 56 (not yet on the stores). After pulling latest changes, run:

```bash
cd provider-mobile
npm install
npx expo start --clear
```

3. Ensure the backend is running and MongoDB is connected:

```bash
cd ../backend
npm start
```

4. Start Expo:

```bash
cd provider-mobile
npm start
```

Scan the QR code with Expo Go, or press `a` / `i` for Android/iOS simulators.

## API endpoints used

| Action | Method | Endpoint |
|--------|--------|----------|
| Login | POST | `/auth/login` |
| Current user | GET | `/auth/me` |
| My jobs | GET | `/provider/jobs` |
| Available jobs | GET | `/services/available` |
| Direct bookings | GET | `/services/bookings/direct` |
| Send offer | POST | `/services/:id/accept` |
| Accept booking | POST | `/services/:id/accept-booking` |
| Reject booking | POST | `/services/:id/reject-booking` |
| Complete job | POST | `/services/:id/complete` |
| Start journey | POST | `/provider/start-journey` |
| Update location | POST | `/provider/update-location` |
| Availability | GET/PUT | `/provider/availability/me`, `/provider/availability` |
| Payments | GET | `/payment/provider` |
| Reviews | GET | `/reviews/provider` |

## Notes

- Only users with `role: provider` can sign in.
- Provider must be **email-verified** (same as web login rules).
- **Send offer** requires `providerStatus: approved`.
- Worker registration remains on the web app for now; mobile focuses on day-to-day job management.
