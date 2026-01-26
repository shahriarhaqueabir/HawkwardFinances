/**
 * Configuration & Constants
 * Centralized settings for the Financial Dashboard
 */

// Database Configuration
const DB_CONFIG = {
    name: 'HawkwardFinances',
    version: 42,
    stores: {
        accounts: 'accounts',
        profile: 'profile',
        timeline: 'timeline',
        goals: 'goals',
        settings: 'settings'
    }
};

// Default Application Settings
const DEFAULT_SETTINGS = {
    theme: 'light',
    primaryColor: '#6366f1',
    currency: '€',
    heartbeatTimeout: 10, // seconds until auto-shutdown warning
    autoShutdown: true,
    categories: [
        "Productivity & Work",
        "Household & Home",
        "Utility Services",
        "Health & Wellness",
        "Automotive & Transport",
        "Financial & Insurance",
        "Family & Kids",
        "Education & Learning",
        "Entertainment & Streaming",
        "News & Reading",
        "Food & Dining",
        "Tech & Software",
        "Shopping & E-Commerce",
        "Social & Communication",
        "Travel & Lifestyle",
        "Donations & Charity",
        "Other"
    ],
    statuses: ["Active", "Planned", "Dormant", "Cancelled"],
    criticalities: ["Critical", "Essential", "Important", "Optional"]
};

// Common Expense Templates (Quick Presets)
const ACCOUNT_TEMPLATES = [
    { name: "Rent / Mortgage", category: "Household & Home", type: "expense", priority: "Critical" },
    { name: "Electricity Bill", category: "Utilities & Bills", type: "expense", priority: "Critical" },
    { name: "Internet / Wi-Fi", category: "Utilities & Bills", type: "expense", priority: "Essential" },
    { name: "Groceries", category: "Food & Dining", type: "expense", priority: "Critical" },
    { name: "Phone Bill", category: "Utilities & Bills", type: "expense", priority: "Essential" },
    { name: "Public Transport Ticket", category: "Transportation", type: "expense", priority: "Essential" },
    { name: "Netflix", category: "Entertainment & Streaming", type: "expense", priority: "Optional" },
    { name: "Spotify", category: "Entertainment & Streaming", type: "expense", priority: "Optional" },
    { name: "Gym Membership", category: "Health & Wellness", type: "expense", priority: "Important" },
    { name: "Amazon Prime", category: "Shopping & E-Commerce", type: "expense", priority: "Optional" },
    { name: "ChatGPT Plus", category: "AI Tools", type: "expense", priority: "Optional" },
    { name: "GitHub Copilot", category: "Developer Tools", type: "expense", priority: "Important" },
    { name: "Salary", category: "Productivity & Work", type: "income", priority: "Critical" },
    { name: "Freelance Income", category: "Productivity & Work", type: "income", priority: "Important" }
];

// Timeline Configuration
const TIMELINE_CONFIG = {
    monthsToProject: 36, // 3 years
    defaultMonthlyIncome: 3000,
    defaultMonthlyExpenses: 2000,
    defaultStartingBalance: 5000,
    currency: '€'
};

// Application Messages
const MESSAGES = {
    saveSuccess: '✅ Data saved successfully!',
    saveError: '❌ Error saving data. Please check console.',
    deleteConfirm: (name) => `Are you sure you want to delete "${name}"?`,
    resetConfirm: '⚠️ This will wipe all data and reset to defaults. This cannot be undone. Proceed?',
    fillRequired: '⚠️ Please fill all required fields.',
    invalidCosts: '⚠️ Please enter valid numeric costs.',
    heartbeatWarning: '⚠️ Connection lost! Server may be offline.',
    accountDeleted: '🗑️ Account deleted.',
    accountSaved: '✅ Account saved!'
};

// UI Colors (Chart Use)
const COLORS = {
    primary: '#6366f1',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    chartPalette: [
        '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e',
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
        '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'
    ]
};

// Tab Titles
const TAB_TITLES = {
    profile: '👤 My Cards',
    accounts: '📋 Balance',
    timeline: '📅 Timeline',
    analytics: '📊 Reports',
    settings: '⚙️ Settings'
};

// Notification Types
const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// UI Constants (Magic Numbers)
const UI_CONSTANTS = {
    BREAKPOINT_MOBILE: 480,
    BREAKPOINT_TABLET: 768,
    BREAKPOINT_DESKTOP: 1024,
    RELOAD_DELAY: 1500,
    MAX_PERCENTAGE: 100,
    CHART_HEIGHT_MOBILE: 350,
    CHART_HEIGHT_DESKTOP: 400
};

// Chart Defaults
const CHART_CONFIG = {
    borderRadius: 4,
    borderWidth: 1,
    responsive: true,
    maintainAspectRatio: false
};
