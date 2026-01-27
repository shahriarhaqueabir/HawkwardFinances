---
trigger: always_on
---

# 🦅 Finance App - Project Manifest & Locked Configuration

## 🎯 Mission Statement

To provide a **fully standalone, portable, and privacy-focused** financial dashboard that requires **zero configuration**. The app empowers users to track their family profiles, recurring expenses, and financial timeline without relying on cloud services or complex installation processes.

## 🔐 Core Philosophy & Alignment (Locked-In)

1.  **100% Standalone & Portable**
    - **Rule**: The entire application folder must be transferable to any Windows machine and run immediately via `StartApp.bat`.
    - **Constraint**: No global dependencies (Node.js is downloaded locally if missing).
    - **Constraint**: No external runtime requirements beyond what `StartApp.bat` provides.

2.  **Privacy Transformation (Local-First)**
    - **Rule**: All user data must reside effectively in `data.json`.
    - **Constraint**: No external database connections.
    - **Constraint**: No telemetry or analytics calls to external servers.

3.  **Simplicity & Maintainability**
    - **Rule**: Use a **Vanilla Tech Stack** (HTML5, CSS3, ES6+ JavaScript).
    - **Constraint**: No build steps (Webpack/Vite/Parcel). The code must be editable and runnable directly.
    - **Constraint**: No heavyweight CSS frameworks (TailwindCSS) unless explicitly requested.

4.  **Operational Excellence**
    - **Rule**: The server must manage its own lifecycle.
    - **Feature**: **Auto-Shutdown** is enabled by default (server terminates 10-15s after the last tab is closed) to prevent background process leaks.
    - **Feature**: **Automatic Backups** of `data.json` on startup to prevent data loss.

## 🛠️ Feature Set (Locked-In)

### 1. Profile Management (My Cards)

- **Flexible Templates**: Adult (Job/Income), Child (School/Interests), Pet (Breed/Microchip).
- **Storage**: Persisted in `data.json` under `profile`.

### 2. Expense & Account Tracking

- **CRUD**: Create, Read, Update, Delete for all recurring expenses.
- **Attributes**: Status (Active/Planned), Criticality (Critical/Optional), Payment Tracking.
- **Storage**: Persisted in `data.json` under `accounts`.

### 3. Financial Timeline

- **Projection**: 3-Year rolling view of financial health.
- **Logic**: `Balance = Previous Balance + (Monthly Income - Expenses)`.
- **Visualization**: Chart.js rendering of the timeline.

### 4. System Improvements (Smart & Simple)

- **Data Integrity**:
    - [x] **Import/Export**: Full JSON dump/restore capability.
    - [x] **Auto-Backup**: `data.json` is backed up to `data.backup.json` on every server start.
- **Performance**:
    - [x] **Bundled Assets**: `Chart.js` is served locally for offline support.
- **UX**:
    - [ ] **Toast Notifications**: Non-intrusive alerts for success/error states.

## 🚫 Locked-Out / Deprecated

- **Dark Mode Toggle**: Disabled/Hidden in UI (User preference).
- **Auto-Shutdown Toggle**: Hidden in UI (System functionality, not user choice).