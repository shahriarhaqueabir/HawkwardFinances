# 🛠️ Finance App Development Guide

This guide is for developers looking to understand, maintain, or extend the Hawkward Finance App.

## 🏗️ Technical Architecture

The app uses a **Decoupled Monolith** architecture designed for low-latency local execution.

### Tech Stack

- **Frontend**: Vanilla HTML5/CSS3/ES6+, [Chart.js](https://www.chartjs.org/) (bundled locally).
- **Backend**: Node.js, Express.js (REST API).
- **Storage**: Local JSON (`data/data.json`) with an [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) shim for transition compatibility.

---

## 📁 File Structure

| File | Role |
| :--- | :--- |
| `server.js` | Express API, File I/O, Heartbeat Logic. |
| `public/app.js` | State Management, DOM Control, Business Logic. |
| `public/config.js` | Constants, Seed Data, UI Templates. |
| `public/styles.css` | Design System & Tokenized CSS. |
| `public/Index.html` | SPA Structure and Component Layouts. |
| `lib/data-utils.js` | Data normalization and validation helpers. |
| `StartApp.bat` | Portable environment bootstrapper. |

---

## 🔄 Core Systems logic

### 1. The Heartbeat (Dead Man's Switch)

To emulate a desktop experience, the server stays alive only as long as a browser tab is open.

- **Client**: Sends a `POST /api/heartbeat` every 5 seconds.
- **Server**: Resets a 10-15s timer. On timeout, it executes `process.exit(0)`.

### 2. Financial Projection Algorithm

The 3-year timeline is calculated dynamically:

1. **Aggregator**: Sums all `monthlyPayment` from `accounts` where `status === 'Active'`.
2. **Generator**: Loops through 36 months starting from the current date.
3. **Formula**: `balance[n] = balance[n-1] + income[n] - expenses[n]`.
4. **Overrides**: Stored in `data.json` under `timelineData` to persist manual monthly adjustments.

### 3. Template Hydration

The app avoids hardcoded forms. UI for Card creation/editing is built on-the-fly using the `CARD_TEMPLATES` object in `config.js`. This allows adding new profile types (e.g., "Vehicle") with zero JS changes.

---

## 📡 API Reference

### Data endpoints

- `GET /api/data`: Returns the full database snapshot.
- `POST /api/data`: Updates a specific store (`accounts`, `profile`, `timeline`, `goals`, `settings`).
- `POST /api/import`: Overwrites the entire `data.json` (creates a safety backup first).

### System endpoints

- `POST /api/heartbeat`: Resets the shutdown timer.
- `POST /api/tab-closed`: Informs the server to start the shutdown countdown immediately.

---

## 🛠️ Development Workflow

### Adding a New Feature

1. Define any new constants or UI strings in `config.js`.
2. Update `Index.html` components if structural changes are needed.
3. Add logic to `app.js`. Ensure state updates are followed by `saveToIndexedDB()` to persist to the server.

### Coding Standards

- **No Global Dependencies**: Always use local assets (CSS, JS libraries).
- **Standardized CSS**: Use the variables defined in `:root` for colors and spacing.
- **State Consistency**: Memory variables (`accounts`, `cards`) must always match disk state.
