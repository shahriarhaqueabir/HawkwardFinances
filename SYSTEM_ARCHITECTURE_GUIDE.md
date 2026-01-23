# 🏛️ Master System Guide: Financial Dashboard

This guide provides a comprehensive overview of the entire application architecture, file structure, and technical logic. It is designed to help developers and users understand how every component interacts to create a functional system.

---

## 1. 📁 Integrated File Structure & Roles

The system is organized into a modular structure to ensure "Separation of Concerns" (SoC).

| Category | File | Description & Primary Role |
| :--- | :--- | :--- |
| **Orchestration** | `StartApp.bat` | Entry point. Installs dependencies, starts the Node server, and opens the browser. |
| **Logic (Brain)** | `app.js` | Main application logic. Orchestrates UI updates, state, and data synchronization. |
| **Configuration** | `config.js` | Central repository for constants, UI strings, design tokens, and templates. |
| **Backend** | `server.js` | REST API server. Handles local file I/O, security, and the auto-shutdown lifecycle. |
| **Design** | `styles.css` | The global design system. Contains all visual styles and layout definitions. |
| **Markup** | `Index.html` | The Single Page Application (SPA) structure. Defines the layouts for all tabs and modals. |
| **Database** | `data.json` | The persistence layer. Stores all user data (accounts, profiles, timeline). |
| **Infrastructure** | `package.json` | Defines project metadata and Node.js dependencies (Express, CORS, etc.). |
| **Documentation** | `REFACTORING_SUMMARY.md` | History of the modular transition. |
| **Documentation** | `CODE_REPORT.md` | Intermediate technical overview of code logic. |
| **Documentation** | `TECHNICAL_IMPLEMENTATION.md` | Deep dive into algorithms and API specs. |

---

## 2. 🏗️ System Layers (Conceptual Architecture)

The app follows a simplified **N-Tier Architecture** tailored for local desktop use.

### **A. Presentation Layer (UI)**
- **Files**: `Index.html`, `styles.css`, `Chart.js` (External Library).
- **Responsibility**: Rendering data to the user and capturing inputs. It uses CSS variables for a consistent "premium" look.

### **B. Application Layer (Control)**
- **Files**: `app.js` (DOM Setup, Navigation).
- **Responsibility**: Routing between tabs (Profiles vs. Expenses) and managing the "Heartbeat" ping to the server.

### **C. Business Logic Layer**
- **Files**: `app.js` (Calculations, Validation).
- **Responsibility**: 
  - Validating user inputs (e.g., stopping negative financial values).
  - Calculating the 3-Year Projection based on income and aggregated expenses.
  - Mapping profile templates (Adult/Child/Pet) to specific data structures.

### **D. Data Access Layer (DAL)**
- **Files**: `app.js` (Fetch wrappers) and `server.js` (API endpoints).
- **Responsibility**: Abstracting the storage medium. The frontend calls `saveToIndexedDB()` (which is now a shim for a server API), and the backend performs the actual `fs.writeFile` to `data.json`.

---

## 3. 🔗 Connectivity Map: How Components Interact

The system follows a strict execution and communication order:

1.  **Bootstrapping**: `StartApp.bat` → `server.js`.
2.  **Markup Initialization**: `server.js` serves `Index.html`.
3.  **Loading Sequence** (Defined in `Index.html`):
    - `styles.css` loads first to prevent Flash of Unstyled Content (FOUC).
    - `config.js` loads next to populate global constants.
    - `app.js` loads last to hook into the DOM and start the lifecycle.
4.  **Runtime Sync**:
    - `app.js` sends heartbeats to `server.js` via HTTP POST.
    - `app.js` pulls/pushes financial data via the `/api/data` endpoint.
    - `server.js` translates these requests into JSON file mutations.

---

## 4. ✅ Master Development Checklists

### **📦 Code Quality Checklist**
- [ ] **Modularity**: No logic in HTML; no styles in JS.
- [ ] **Config-First**: All magic numbers and strings must reside in `config.js`.
- [ ] **State Safety**: Frontend variables (`accounts`, `cards`) must always match the server's `data.json`.
- [ ] **Performance**: DOM elements must be cached once at startup (see `app.js` initialization).

### **📂 Feature Coverage Checklist**
- [ ] **Profiles**: Create/Edit/Delete works for Adult, Child, and Pet templates.
- [ ] **Expenses**: Full CRUD support with category-based filtering and multi-column sorting.
- [ ] **Timeline**: 3-Year projection updates in real-time when inputs change.
- [ ] **Persistence**: Data survives page refreshes and server restarts.
- [ ] **Lifecycle**: Server shuts down exactly 15s after closing the tab.

### **🚀 Setup Checklist (New Developer)**
1. Ensure **Node.js** is installed.
2. Run `npm install` (handled automatically by `StartApp.bat`).
3. Run `StartApp.bat` to launch the environment.
4. Check `data.json` for initial data structure.

---

## 5. 💡 Critical Technical Insights

- **The Heartbeat**: The server stays alive via a "Dead Man's Switch." Every heartbeat from the browser resets a 15s timer. This allows the app to feel like a "Desktop App" that closes when the window closes.
- **Template Hydration**: Instead of hard-coding forms, `app.js` reads `CARD_TEMPLATES` from `config.js` to build forms on-the-fly. This makes adding a new card type (e.g., "Vehicle") as simple as adding a JSON object to the config.

---

**Generated by Antigravity**  
*System Version: 2.0 (Modular Heartbeat Edition)*
