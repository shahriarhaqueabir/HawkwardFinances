# Financial Hub - Standalone Setup

This application is now **100% standalone**. You can move the entire project folder to any Windows computer and it will work without any manual installation.

## How to Run

1. **Move the folder**: Copy the entire `Finance app` folder to your USB drive or another computer.
2. **Double-click `StartApp.bat`**: Simply run this file. **It will handle everything and open the dashboard in your browser automatically.**

## What is Automated?

* **Node.js Runtime**: If Node.js is not installed on the computer, the launcher will automatically download a portable version into a `bin/` folder.
* **Dependencies**: All required backend packages will be installed automatically on the first run.
* **Offline Charts**: The charting library (`Chart.js`) is now bundled locally, so you don't need internet to see your financial reports.

## Networking

When the app starts, it will display a local network IP (e.g., `192.168.1.5:3000`). You can open this address on your phone or tablet to access your dashboard from other devices on the same Wi-Fi.

---

> [!TIP]
> Your data is safely stored in `data.json` within this folder. Keep a backup of this file to ensure your financial records are never lost.
