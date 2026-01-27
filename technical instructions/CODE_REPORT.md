# 💻 Technical Code Report: How it Works

This document provides a technical deep-dive into the logic and data flow of the Financial Dashboard application.

---

## 1. 📂 Core File Structure & Roles

- **`server.js`**: The Node.js/Express backend. It handles file I/O for `data.json` and manages the server lifecycle (auto-shutdown).
- **`Index.html`**: The skeleton of the app. It contains the layout, navigation, and modal structures.
- **`styles.css`**: The design system. It uses CSS custom properties (variables) for consistent UI elements.
- **`config.js`**: The configuration layer. It stores all constants, color palettes, and data structures (shared by `app.js`).
- **`app.js`**: The "brain" of the frontend. It handles state, DOM manipulation, and API communication.

---

## 2. 🔄 Data Flow & Persistence

The application uses a hybrid approach to data management:

1.  **In-Memory State**: When the app starts, it loads data into local variables (`accounts`, `cards`, `timeline`) in `app.js`.
2.  **Server API**: Any change (Add/Edit/Delete) triggers a `fetch` POST request to `/api/data`.
3.  **JSON Persistence**: The server receives the POST, reads `data.json`, updates the specific key/store, and writes it back to disk.
4.  **IndexedDB Wrapper**: While the functions are named `saveToIndexedDB`, they are currently configured to act as wrappers for the Server API to ensure local file persistence.

---

## 3. 💓 The Heartbeat Mechanism (Auto-Shutdown)

To ensure the server doesn't run indefinitely after closing the browser:

- **Client (`app.js`)**: Every 5 seconds, `setInterval` triggers a ping to `/api/heartbeat`.
- **Server (`server.js`)**:
    - Starts a 15-second "Shutdown Timer" on launch.
    - Every time it receives a heartbeat, it **resets** the timer.
    - If the timer reaches 0 (meaning no heartbeat was received for 15s), it calls `process.exit(0)`.
- **Terminal (`StartApp.bat`)**: The script ends with `exit`, so when the Node.js process dies, the window closes automatically.

---

## 4. 🧩 UI Logic & Component Rendering

### **Tab Switching**

Uses a data-attribute system. Each button has `data-tab="name"`. Clicking it hiding all `.tab-content` divs and shows the one with the matching ID.

### **Dynamic Profile Cards**

Cards are rendered based on "Templates" defined in `config.js`.

- When creating a card, the app injects specific input fields (e.g., "School" for children, "Breed" for pets) into the modal.
- The rendering logic uses CSS grid (`family-grid`) to display cards attractively.

### **Financial Projections**

The "Timeline" tab calculates month-by-month balances by:

1. Taking a starting balance.
2. Iterating through 36 months (3 years).
3. Adding monthly income and subtracting the sum of all monthly expenses.
4. Feeding this data into **Chart.js** for the visual graph.

---

## 5. 🛠️ Utilities & Helpers

- **Validation**: `validateInput()` ensures required fields are filled and numbers are valid before saving.
- **Formatting**: Uses `toLocaleString()` for currency and number formatting.
- **Searching/Filtering**: The `filterAccounts()` function creates a new subset of the data based on the selected category and triggers a re-render of the table.
