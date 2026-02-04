# 📖 Finance App User Guide

Welcome to your private financial command center. This guide will help you navigate the features of the Hawkward Finance App.

## 🚀 Getting Started

To launch the app, simply double-click **`StartApp.bat`** in the main folder.

- It will check for dependencies.
- It will start the local server.
- It will open your dashboard in your default web browser.

---

## 👤 1. My Cards (Profile Management)

The "Cards" tab allows you to manage profiles for yourself, family members, and甚至 pets.

- **Adding a Card**: Click the `+` button in the sidebar.
- **Templates**: Choose from **Adult** (Job/Income), **Child** (School/Interests), or **Pet** (Breed/Microchip).
- **Customizing**: Click the card to edit its details or change its emoji avatar.

## 📋 2. Balance (Expense Tracking)

The "Balance" tab is where you manage your recurring commitments.

- **Add Income/Expense**: Click "Add Commitment" and use the **Smart Templates** for quick entries (Rent, Netflix, Salary, etc.).
- **Filtering**: Use the category dropdowns to filter your list.
- **Sorting**: Click any column header (Service, Amount, Priority) to sort your data.
- **Criticality**: Mark items as **Critical** (Non-negotiable) or **Optional** (Subscriptions you might want to cancel).

## 📅 3. 3-Year Timeline

The "Timeline" tab projects your future financial health based on your current data.

- **Projection**: View your estimated balance for the next 36 months.
- **Income Overrides**: You can manually adjust the "Income" and "Expenses" fields for any future month (e.g., to account for a predicted bonus or a vacation).
- **Locking**: Past months are "frosted" and locked to preserve historical records.
- **Red Alerts**: Any month where your balance drops below zero will be highlighted in vibrant red.

## 📊 4. Reports & Analytics

Get instant visual insights into your spending.

- **Category Breakdown**: See exactly where your money goes.
- **Filters**: Click on a chart segment (e.g., "AI Tools") to instantly switch to the Balance tab and see those specific accounts.
- **Annual vs. Monthly**: Toggle between views to see your long-term commitment.

---

## ⚙️ Settings & System

Customize the app to your liking in the "Settings" tab.

- **Appearance**: Change the primary theme color.
- **Regional**: Update your currency symbol.
- **Metadata Manager**: Add, rename, or delete your own Categories, Statuses, and Criticality levels.
  - *Note: Renaming a category here will update all your existing accounts automatically!*
- **Data Management**:
  - **Export JSON**: Save your data to a file for backup.
  - **Import JSON**: Load a previous backup.
  - **Factory Reset**: Wipe everything for a fresh start or load generic sample data.

## 💡 Pro Tips

- Use the **"Jump to Today"** button in the Timeline to instantly find the current month.
- The app **automatically shuts down** when you close your browser tab—no need to worry about background processes.
- All your data is stored in `data/data.json`. You can copy this file to any other computer running the app to take your dashboard with you.
