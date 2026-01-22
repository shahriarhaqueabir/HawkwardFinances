/**
 * Configuration & Constants
 * Centralized settings for the Financial Dashboard
 */

// Database Configuration
const DB_CONFIG = {
    name: 'FinancialAppDB',
    version: 2,
    stores: {
        accounts: 'accounts',
        profile: 'profile',
        timeline: 'timeline'
    }
};

// Design System - Colors
const COLORS = {
    primary: '#667eea',
    success: '#48bb78',
    danger: '#dc2626',
    warning: '#f59e0b',
    info: '#06b6d4',
    textDark: '#2d3748',
    textLight: '#718096',
    bgLight: '#f5f5f5',
    border: '#e0e0e0',
    bgWhite: '#ffffff',

    // Family card gradients
    myselfGradient: 'rgba(102, 126, 234, 0.05)',
    sonGradient: 'rgba(72, 187, 120, 0.05)',
    dogGradient: 'rgba(245, 158, 11, 0.05)',

    // Status colors
    criticalBg: '#fee2e2',
    essentialBg: '#fef3c7',
    importantBg: '#e0e7ff',
    optionalBg: '#e0f2fe',

    // Chart colors
    chartPalette: ['#667eea', '#764ba2', '#48bb78', '#f59e0b', '#dc2626', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#6366f1', '#84cc16']
};

// Design System - Spacing & Sizing
const DESIGN = {
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '15px',
        xl: '20px',
        xxl: '25px',
        xxxl: '30px'
    },
    sizing: {
        sidebarWidth: '280px',
        cardMinWidth: '300px',
        modalMaxWidth: '600px',
        chartHeight: '400px',
        chartHeightTall: '450px',
        tableRowHeight: '12px'
    },
    borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '12px',
        xl: '16px'
    },
    transitions: {
        fast: '0.2s ease',
        standard: '0.3s ease',
        slow: '0.5s ease'
    }
};

// Timeline Configuration
const TIMELINE_CONFIG = {
    defaultStartingBalance: 2000,
    defaultMonthlyIncome: 1800,
    currency: '€'
};

// Account Categories
const ACCOUNT_CATEGORIES = [
    'Government & Legal',
    'Health & Insurance',
    'Banking & Finance',
    'Telecommunications',
    'Shopping & E-Commerce',
    'Productivity & Work',
    'Developer Tools',
    'Entertainment & Streaming',
    'Gaming',
    'AI Tools',
    'Social Media',
    'Travel & Booking',
    'Transportation',
    'Food & Dining',
    'Household & Home',
    'Education & Learning',
    'Health & Wellness',
    'Clothing & Fashion',
    'Personal Care & Beauty',
    'Hobbies & Leisure',
    'Pet Care',
    'Cloud Storage & Backup',
    'Subscriptions & Memberships',
    'Family & Child',
    'Other'
];

// Account Status Options
const ACCOUNT_STATUSES = ['Active', 'Planned', 'Dormant', 'Cancelled'];

// Criticality Levels
const CRITICALITY_LEVELS = ['Critical', 'Essential', 'Important', 'Optional'];

// Tab Titles
const TAB_TITLES = {
    profile: '👤 Profiles',
    timeline: '📅 Timeline',
    analytics: '📊 Reports',
    accounts: '📋 Expenses'
};

// Family Configuration
const FAMILY_CONFIG = {
    myself: {
        emoji: '👨',
        title: 'Me',
        fields: [
            { label: 'Full Name', key: 'name' },
            { label: 'Email', key: 'email' },
            { label: 'Location', key: 'location' },
            { label: 'Occupation', key: 'occupation' },
            { label: 'Annual Income', key: 'income' },
            { label: 'Bio', key: 'bio', full: true }
        ]
    },
    son: {
        emoji: '👦',
        title: 'My Son',
        fields: [
            { label: 'Name', key: 'name' },
            { label: 'Age', key: 'age' },
            { label: 'School/Grade', key: 'school' },
            { label: 'Hobby', key: 'hobby' },
            { label: 'Notes', key: 'notes', full: true }
        ]
    },
    dog: {
        emoji: '🐕',
        title: 'My Dog',
        fields: [
            { label: 'Name', key: 'name' },
            { label: 'Breed', key: 'breed' },
            { label: 'Age', key: 'age' },
            { label: 'Microchip #', key: 'microchip' },
            { label: 'Notes', key: 'notes', full: true }
        ]
    }
};

// Notification Types
const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Notification Messages
const MESSAGES = {
    // Success
    accountSaved: '✅ Account saved successfully!',
    accountDeleted: '✅ Account deleted successfully!',
    familyUpdated: '✅ Family profile updated!',
    timelineSaved: '✅ Timeline expenses saved successfully!',

    // Error
    fillRequired: '❌ Please fill all required fields',
    invalidCosts: '❌ Monthly and Annual costs must be valid numbers',
    accountNotFound: '❌ Account not found',
    negativeExpenses: '❌ Expenses cannot be negative',
    tableNotFound: '❌ Timeline table not found',
    saveError: '⚠️ Saved locally, but may not persist',

    // Warning
    deleteConfirm: (name) => `Delete ${name}?`
};
