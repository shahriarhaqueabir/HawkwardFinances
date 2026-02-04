# 🦅 Finance App Security & Privacy Guide

This document outlines the privacy-first architecture and security principles of the Hawkward Finance App.

## 🔐 Privacy-First Philosophy

The Finance App is built on the belief that your financial data is yours alone. Unlike traditional banking or budgeting apps, we do not use the cloud, third-party analytics, or external databases.

### 1. 100% Local-First Data

- **No Cloud Sync**: Your data never leaves your machine. There is no "account" to create and no server in the cloud that stores your information.
- **Single Source of Truth**: All your data is stored in a single, human-readable `data/data.json` file within the app directory.
- **Zero Telemetry**: We do not track how you use the app. There are no Google Analytics, trackers, or "phone home" features.

### 2. Standalone & Portable

- **Self-Contained**: The application doesn't rely on global system installations. Even the Node.js runtime is downloaded locally if missing.
- **USB Ready**: You can put the entire application folder on a USB drive and run it on any Windows machine—your data goes with you.

## 🛡️ Security Measures

While the app is designed for local use, we've implemented several layers of protection to ensure your data stays safe on your machine.

### Local Server Security

- **Same-Origin Policy**: The backend only accepts requests from your local machine (`127.0.0.1`).
- **Heartbeat (Dead Man's Switch)**: To prevent researchers or background processes from accessing your data, the server automatically shuts down 15 seconds after you close the app tab.
- **Manual Control**: You can stop the app at any time by closing the browser tab and the terminal window.

### Data Safety

- **Automatic Backups**: Every time you start the app via `StartApp.bat`, it creates a timestamped backup of your `data.json` in the `data/` folder.
- **Import/Export Safety**: When importing a new JSON dump, the app creates an `import_safety.json` backup of your current state before overwriting, preventing accidental data loss.

## 🚫 What We Don't Do

- ❌ No Credit Card tracking or bank API connections (Plaid/Yodlee).
- ❌ No password storage or identity verification.
- ❌ No external API calls for exchange rates or stock prices (all calculations are local).

## 📄 Best Practices for Users

1. **Physical Security**: Always lock your computer when away, as anyone with access to your file system can read `data.json`.
2. **Backups**: Periodically copy your `data/` folder to a safe location (e.g., an encrypted cloud drive or another physical disk).
3. **Privacy**: Use the "Generic Seed Data" reset if you want to demonstrate the app to others without showing your real numbers.
