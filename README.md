# NetGuardian Frontend

Modern dashboard for visualising live network metrics, issuing throttle commands, and reviewing events from the **NetGuardian Backend**. This app is built with React 19 + Vite and is designed to pair with the Django/Channels backend described in the NetGuardian Backend README.

---

## ✨ Features

- Real-time charts driven by the backend WebSocket feed (`/ws/stats/`)
- Device list with instant throttle / unthrottle controls (`POST /api/throttle/`)
- Event log that merges backend events with locally detected status changes
- Configurable throttle limit per action
- Connection health indicators (WebSocket status, data staleness, last update timestamp)

---

## 🧱 Prerequisites

- Node.js 18+
- npm 9+
- NetGuardian Backend running locally or remotely (see below)

---

## 🛰️ Backend Setup (summary)

Spin up the Django backend by following its README. The key steps are:

1. **Clone & install**
   ```bash
   git clone <repository-url>
   cd throttle-backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Configure environment** – create a `.env` with values mentioned in the backend README (secret key, Gemini key, Redis host/port, allowed hosts).
3. **Run database migrations**
   ```bash
   python manage.py migrate
   python manage.py createsuperuser  # optional
   ```
4. **Start Redis** (local service or remote instance). For distributed setups, expose Redis on the backend machine and point your network engine to it as described in the backend README.
5. **Run the backend** (choose one):

   ```bash
   # Production helper script
   python start_production.py

   # OR manually
   daphne -b 0.0.0.0 -p 8082 netguardian.asgi:application
   python manage.py redis_listener
   ```

**Important endpoints exposed by the backend**

- `GET /api/health/` – status probe
- `GET /api/devices/` – latest network snapshot
- `POST /api/throttle/` – throttle/unthrottle devices
- `POST /api/generate-profile/` – AI profile generation
- `ws://<host>:8082/ws/stats/` – live metrics feed (trailing slash required!)

---

## ⚙️ Frontend Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create an environment file at the project root:

   ```bash
   cp .env.example .env.local  # create manually if the template is missing
   ```

3. Configure backend URLs:

   ```env
   # REQUIRED – Base HTTP origin for API requests (no trailing slash)
   VITE_BACKEND_HTTP_URL=http://127.0.0.1:8082

   # OPTIONAL – Explicit WebSocket URL
   # If not provided we derive it from VITE_BACKEND_HTTP_URL
   # VITE_BACKEND_WS_URL=ws://127.0.0.1:8082/ws/stats/
   ```

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Open the UI at the URL printed by Vite (defaults to `http://127.0.0.1:5173`). The dashboard automatically connects to the backend using the values from your env file.

---

## 🧭 Dashboard Walkthrough

- **Connection banner** – shows WebSocket status (`Live`, `Connecting`, `Closing`, `Offline`), last update timestamp, and warnings if data is stale.
- **Network Activity graph** – plots total downstream throughput and overlays a selected device’s history. The red threshold line is configurable in code (`THRESHOLD_BPS`).
- **Bandwidth distribution donut** – highlights top consumers.
- **Connected clients** – real-time list sorted by throughput. Select a device to highlight it on the chart, dial in the desired throttle limit, then use the inline buttons to send throttle/unthrottle commands.
- **Events log** – aggregates backend `events` plus locally detected state changes (e.g., `Throttled 10.42.0.140`).

---

## 🔄 Sync Behaviour

- On mount we call `GET /api/devices/` for the latest snapshot.
- A resilient WebSocket client listens to `/ws/stats/` and merges updates into the UI.
- Chart history retains the most recent 60 samples; per-device history is tracked separately for the overlay line.
- Throttle actions immediately POST to `/api/throttle/` and refetch the device snapshot once the command succeeds.

---

## 🧪 Scripts

```bash
npm run dev     # start Vite dev server
npm run build   # type-check + production bundle
npm run preview # preview production build
npm run lint    # ESLint
```

---

## 🩺 Troubleshooting

| Symptom                                | What to check                                                                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| WebSocket shows **Offline**            | Verify the backend is reachable at `ws://<host>:8082/ws/stats/`, confirm Redis listener is running, ensure CORS/Allowed Hosts permit your frontend origin. |
| API calls fail with 4xx/5xx            | Confirm `VITE_BACKEND_HTTP_URL` points at the backend and includes the correct port; check backend logs for authentication or validation errors.           |
| Events list is empty                   | Ensure the Redis pipeline is streaming stats to `network-stats` and that the backend is mapping them into WebSocket payloads.                              |
| Throttle commands stuck on “Applying…” | Backend must acknowledge the POST. Inspect the Django server logs and Redis `throttle-commands` subscribers.                                               |

For deeper backend troubleshooting, consult the NetGuardian Backend README (Redis connectivity, distributed deployment, AI configuration, etc.).

---

## 📄 License

Add your license details here.
