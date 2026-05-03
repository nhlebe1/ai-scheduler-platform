# AI Scheduler Platform — Phase 1

A white-label AI scheduling SaaS for small businesses. Companies embed a branded chat assistant that qualifies leads, collects intake information, offers appointment slots, and saves bookings.

Phase 1 demo client: **Johnson Roofing**.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, TypeScript, ts-node-dev |
| Database | SQLite via sql.js (pure JS, no native build tools required) |
| Monorepo | npm workspaces + concurrently |

---

## Setup

### Prerequisites
- Node.js 18+ (tested on Node 24)
- npm 9+

### Install

```bash
npm install
```

This installs dependencies for both `backend/` and `frontend/` workspaces in one shot.

---

## Running

### Both servers at once

```bash
npm run dev
```

This starts:
- **Backend** at [http://localhost:3001](http://localhost:3001) (Express API)
- **Frontend** at [http://localhost:5173](http://localhost:5173) (Vite dev server)

### Or run them separately

```bash
# Terminal 1
npm run dev --workspace=backend

# Terminal 2
npm run dev --workspace=frontend
```

---

## URLs

| URL | Description |
|---|---|
| http://localhost:5173 | Chat widget demo (Johnson Roofing) |
| http://localhost:5173/dashboard | Bookings dashboard |
| http://localhost:3001/api/bookings | All bookings (JSON) |
| http://localhost:3001/api/config/johnson-roofing | Client config (JSON) |

---

## Backend API

### `GET /api/config/:clientId`
Returns branding and configuration for a client.

```
GET /api/config/johnson-roofing
```

### `GET /api/bookings`
Returns all bookings, newest first. Optional `?clientId=johnson-roofing` filter.

### `POST /api/bookings`
Creates a booking. All fields are required and validated server-side.

```json
{
  "client_id": "johnson-roofing",
  "name": "Jane Smith",
  "phone": "555-123-4567",
  "email": "jane@example.com",
  "service": "Roof Inspection",
  "address": "123 Main St, Springfield IL",
  "slot": "Monday, May 5 at 9:00 AM"
}
```

Returns `400` with `{ "errors": [...] }` if validation fails.

---

## Resetting the database

Delete the SQLite database file, then restart the backend:

```bash
# Delete the DB
rm backend/data/bookings.db

# Restart the backend (Ctrl+C the running process, then):
npm run dev --workspace=backend
```

The database is recreated automatically on the next startup.

---

## Adding a new client

1. Create `backend/src/data/clients/<your-client-id>.json` modeled after `johnson-roofing.json`.
2. Update `CLIENT_ID` in `frontend/src/pages/WidgetPage.tsx` (or make it URL-driven in Phase 2).
3. No code changes required for the backend — it discovers configs by file name.

**Client config fields:**

```json
{
  "id": "acme-hvac",
  "name": "Acme HVAC",
  "tagline": "...",
  "brandColor": "#...",
  "brandColorLight": "#...",
  "logoText": "AH",
  "services": ["AC Repair", "Furnace Install", "..."],
  "businessHours": "Mon–Fri, 7am–6pm",
  "assistantName": "Alex",
  "welcomeMessage": "Hi! I'm Alex, the Acme HVAC scheduling assistant..."
}
```

---

## Project structure

```
ai-scheduler-platform/
├── package.json                        # Root — npm workspaces + concurrently
├── backend/
│   ├── src/
│   │   ├── index.ts                    # Express entry point
│   │   ├── db/sqlite.ts                # sql.js setup + queryAll / runWrite helpers
│   │   ├── routes/
│   │   │   ├── bookings.ts             # GET + POST /api/bookings
│   │   │   └── config.ts               # GET /api/config/:clientId
│   │   ├── validation/booking.ts       # Shared booking validation logic
│   │   └── data/clients/
│   │       └── johnson-roofing.json    # Demo client config
│   └── data/bookings.db                # SQLite DB (auto-created, git-ignored)
└── frontend/
    └── src/
        ├── api.ts                      # fetch wrappers for the backend
        ├── types.ts                    # Shared TypeScript types
        ├── utils/slots.ts              # Fake availability slot generator
        ├── components/
        │   ├── ChatWidget/
        │   │   ├── ChatWidget.tsx      # Branded chat shell
        │   │   ├── ChatMessages.tsx    # Message list + option buttons
        │   │   ├── ChatInput.tsx       # Text input bar
        │   │   └── useConversation.ts  # State-machine conversation logic
        │   └── Dashboard/
        │       └── Dashboard.tsx       # Bookings table
        └── pages/
            ├── WidgetPage.tsx          # / — widget demo
            └── DashboardPage.tsx       # /dashboard
```
