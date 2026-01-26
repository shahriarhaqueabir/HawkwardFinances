/**
 * Financial Dashboard - Application Logic
 * Handles all business logic, data management, and UI interactions
 */

// ==================== STATE MANAGEMENT ====================
let db;
let editingAccountId = null;
let editingCardId = null;
let currentCustomFields = [];

// Application Settings
let appSettings = { ...DEFAULT_SETTINGS };

// Cards Data - flexible card system
let cards = [];

// Accounts Data - loaded from database or seed on first run
let accounts = [];

// Financial Goals
let goals = [];

// ==================== INDEXEDDB MANAGEMENT ====================

// ==================== LOCAL FILE STORAGE MANAGEMENT ====================

const API_URL = `${window.location.origin}/api/data`;

/**
 * Initializes the storage system and starts the application heartbeat.
 * Checks server availability before resolving.
 * @returns {Promise<void>}
 */
function initIndexedDB() {
    // Start heartbeat immediately
    startHeartbeat();

    // We check if server is reachable and load initial data
    return new Promise((resolve, reject) => {
        fetch(API_URL, { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) throw new Error('Server not reachable');
                resolve();
            })
            .catch((err) => {
                console.error('Storage Init Error:', err);
                notify(
                    '⚠️ Local server not running. Data will not save!',
                    NOTIFICATION_TYPES.ERROR
                );
                reject(err);
            });
    });
}

/**
 * Saves data to the local server storage (acting as a database).
 * @param {string} storeName - The name of the data store (e.g., 'accounts', 'profile').
 * @param {any} data - The data payload to save.
 * @param {string|null} key - Optional key for store-based saving.
 * @returns {Promise<void>}
 */
function saveToIndexedDB(storeName, data, key = null) {
    return new Promise((resolve, reject) => {
        fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ storeName, data, key }),
        })
            .then((response) => {
                if (!response.ok) throw new Error('Save failed');
                return response.json();
            })
            .then(() => resolve())
            .catch((err) => reject(err));
    });
}

/**
 * Starts a periodic heartbeat to notify the server that the application is active.
 * Prevents auto-shutdown while the tab is open.
 */
function startHeartbeat() {
    // Ping every 5 seconds
    setInterval(() => {
        fetch(`${window.location.origin}/api/heartbeat`, {
            method: 'POST',
            keepalive: true, // Ensure request completes even if tab is closing
        }).catch((err) => console.debug('Heartbeat failed (server likely closed)'));
    }, 5000);
}

function loadFromIndexedDB(storeName, key = null) {
    return new Promise((resolve, reject) => {
        fetch(API_URL, { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
                return response.json();
            })
            .then((fullData) => {
                const storeData = fullData[storeName];

                if (!storeData) {
                    resolve(null);
                    return;
                }

                if (
                    (storeName === DB_CONFIG.stores.profile ||
                        storeName === DB_CONFIG.stores.timeline) &&
                    key
                ) {
                    resolve(storeData[key]);
                } else {
                    resolve(storeData);
                }
            })
            .catch((err) => reject(err));
    });
}

// ==================== DATA IMPORT/EXPORT ====================

/**
 * Export all data from server as a JSON file
 */
async function exportData() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch data');

        const data = await response.json();
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `financial_backup_${new Date().toISOString().split('T')[0]}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        notify('✅ Data exported successfully!', NOTIFICATION_TYPES.SUCCESS);
    } catch (err) {
        console.error('Export Error:', err);
        notify('❌ Export failed: ' + err.message, NOTIFICATION_TYPES.ERROR);
    }
}

/**
 * Import data from a JSON file and overwrite current data
 */
async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const importContent = JSON.parse(e.target.result);

            // Basic validation
            if (!importContent.accounts || !importContent.profile || !importContent.timeline) {
                throw new Error('Invalid backup file format. Missing required data sections.');
            }

            const confirmImport = confirm(
                '🚨 WARNING: Importing will OVERWRITE all current data. Are you sure you want to proceed?'
            );
            if (!confirmImport) {
                event.target.value = ''; // Reset file input
                return;
            }

            notify('⌛ Importing data...', NOTIFICATION_TYPES.INFO);

            const response = await fetch(`${window.location.origin}/api/import`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(importContent),
            });

            if (!response.ok) throw new Error('Server import failed');

            const result = await response.json();
            notify('✅ Success: ' + result.message, NOTIFICATION_TYPES.SUCCESS);

            // Reload page to show new data
            setTimeout(() => {
                window.location.reload();
            }, UI_CONSTANTS.RELOAD_DELAY);
        } catch (err) {
            console.error('Import Error:', err);
            notify('❌ Import failed: ' + err.message, NOTIFICATION_TYPES.ERROR);
            event.target.value = ''; // Reset file input
        }
    };
    reader.readAsText(file);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Calculates current monthly income and expense totals from active accounts.
 * Includes profile-level income distribution as requested.
 * @returns {Object} An object containing {totalIncome, totalExpense}.
 */
function calculateBaseMonthlyValues() {
    const accountMonthlyIncome = accounts
        .filter((acc) => acc.type === 'income' && acc.status === 'Active')
        .reduce((sum, acc) => sum + (parseFloat(acc.monthlyPayment) || 0), 0);

    // Profile-level income is now removed from global totals per user request
    const totalIncome = accountMonthlyIncome;

    const totalExpense = accounts
        .filter((acc) => (acc.type === 'expense' || !acc.type) && acc.status === 'Active')
        .reduce((sum, acc) => sum + (parseFloat(acc.monthlyPayment) || 0), 0);

    return { totalIncome, totalExpense };
}

/**
 * Converts raw array-based account data into keyed objects for application use.
 * @param {Array[]} accountsArray - Array of account data arrays.
 * @returns {Object[]} Array of account objects.
 */
function convertAccountsToObjects(accountsArray) {
    return accountsArray.map(
        ([
            id,
            name,
            category,
            type,
            monthlyPayment,
            annualPayment,
            hasReminder,
            status,
            priority,
        ]) => ({
            id,
            name,
            category,
            type,
            monthlyPayment,
            annualPayment,
            hasReminder,
            status,
            priority,
        })
    );
}

// ==================== SECURITY UTILITIES ====================

/**
 * Sanitize user input to prevent XSS attacks
 * Removes HTML tags and limits length
 */
function sanitizeInput(value, maxLength = 200) {
    if (!value) return '';

    // Convert to string and trim
    const str = String(value).trim();

    // Remove HTML tags
    const withoutTags = str.replace(/<[^>]*>/g, '');

    // Limit length
    const limited = withoutTags.slice(0, maxLength);

    return limited;
}

/**
 * Escape HTML special characters
 * Use this when you must preserve some formatting but need to escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';

    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };

    return String(text).replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Validate and sanitize numeric input
 */
function sanitizeNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const num = parseFloat(value);
    if (isNaN(num)) return 0;
    return Math.max(min, Math.min(max, num));
}

/**
 * Validate email format (basic)
 */
function isValidEmail(email) {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Create safe DOM element with text content
 * Prevents XSS by using textContent instead of innerHTML
 */
function createSafeElement(tag, text, className = '') {
    const element = document.createElement(tag);
    if (text) element.textContent = text;
    if (className) element.className = className;
    return element;
}

function validateInput(value, type = 'string', required = false) {
    if (required && (!value || value.toString().trim() === '')) return false;
    if (type === 'email') return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (type === 'number') return isNaN(parseFloat(value)) ? false : true;
    return true;
}

const TOAST_ICONS = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

function notify(message, type = NOTIFICATION_TYPES.INFO) {
    // 1. Ensure Container Exists
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // 2. Create Toast Element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icon = TOAST_ICONS[type] || TOAST_ICONS.info;

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">${message}</div>
    `;

    // 3. Add to DOM
    container.appendChild(toast);

    // 4. Lifecycle Management
    // Remove on click
    toast.onclick = () => removeToast(toast);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            removeToast(toast);
        }
    }, 5000);
}

function removeToast(toast) {
    toast.classList.add('hiding');
    toast.addEventListener('animationend', () => {
        if (toast.parentElement) {
            toast.remove();
        }
    });
}

function getCriticalityColor(criticality) {
    const colorMap = {
        Critical: COLORS.criticalBg,
        Essential: COLORS.essentialBg,
        Important: COLORS.importantBg,
        Optional: COLORS.optionalBg,
    };
    return colorMap[criticality] || COLORS.importantBg;
}

// ==================== DOM SETUP ====================

// Cache DOM elements
const navButtons = document.querySelectorAll('.nav-btn');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('pageTitle');
const accountsBody = document.getElementById('accountsBody');
const accountModal = document.getElementById('accountModal');
const accountForm = document.getElementById('accountForm');
const modalTitle = document.getElementById('modalTitle');
const formService = document.getElementById('formService');
const formCategory = document.getElementById('formCategory');
const filterCategory = document.getElementById('filterCategory');
const filterType = document.getElementById('filterType');
const filterStatus = document.getElementById('filterStatus');
const filterCriticality = document.getElementById('filterCriticality');
const filterOwner = document.getElementById('filterOwner');
// ==================== NAVIGATION & TAB SWITCHING ====================

const sidebar = document.querySelector('.sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarOverlay) sidebarOverlay.classList.add('active');
}

function closeSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
}

function toggleSidebar() {
    if (sidebar && sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// ==================== SMART FEATURES (NAVIGATION & FILTERING) ====================

/**
 * Resets all dashboard filters to their default (All) state.
 * Triggers a table re-render to show all accounts.
 */
function clearAllFilters() {
    if (filterCategory) filterCategory.value = '';
    if (filterType) filterType.value = '';
    if (filterStatus) filterStatus.value = '';
    if (filterCriticality) filterCriticality.value = '';
    if (filterOwner) filterOwner.value = '';

    filterAccounts();
    notify('🧹 All filters cleared', NOTIFICATION_TYPES.INFO);
}

/**
 * Scrolls the timeline table to the current month/year row.
 */
function jumpToToday() {
    const now = new Date();
    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];
    const currentId = `${now.getFullYear()}-${monthNames[now.getMonth()]}`;

    const targetRow = document.getElementById(currentId);
    if (targetRow) {
        targetRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
        targetRow.style.backgroundColor = 'rgba(99, 102, 241, 0.1)';
        setTimeout(() => {
            targetRow.style.backgroundColor = '';
        }, 2000);
    } else {
        notify('📍 Current month not found in timeline', NOTIFICATION_TYPES.WARNING);
    }
}

navButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
        switchTab(this.dataset.tab);
    });
});

function switchTab(tabName) {
    if (!tabName) return;

    // Remove active class from all buttons and tabs
    navButtons.forEach((btn) => btn.classList.remove('active'));
    tabContents.forEach((tab) => tab.classList.remove('active'));

    // Add active class to selected button and tab
    const activeBtn = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
    const activeTab = document.getElementById(tabName);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeTab) activeTab.classList.add('active');

    // Close sidebar on mobile
    if (window.innerWidth <= UI_CONSTANTS.BREAKPOINT_DESKTOP) {
        closeSidebar();
    }

    // Update page title
    if (pageTitle) pageTitle.textContent = TAB_TITLES[tabName] || tabName;

    // Special handling for specific tabs
    if (tabName === 'analytics') {
        initCharts();
    } else if (tabName === 'timeline') {
        initializeTimelineData();
    } else if (tabName === 'accounts') {
        renderAccounts();
    } else if (tabName === 'settings') {
        syncSettingsUI();
    } else if (tabName === 'profile') {
        renderCards();
    }
}

// ==================== CARD MANAGEMENT ====================

const CARD_TEMPLATES = {
    adult: {
        label: 'Adult',
        icon: '👨‍💼',
        fields: [
            { id: 'job', label: 'Occupation', type: 'text', placeholder: 'e.g. Software Engineer' },
        ],
    },
    child: {
        label: 'Child',
        icon: '🧸',
        fields: [
            {
                id: 'school',
                label: 'School / Grade',
                type: 'text',
                placeholder: 'e.g. Elementary School',
            },
            {
                id: 'interests',
                label: 'Interests',
                type: 'text',
                placeholder: 'e.g. Dinosaurs, Lego',
            },
        ],
    },
    pet: {
        label: 'Pet',
        icon: '🐾',
        fields: [
            { id: 'breed', label: 'Breed', type: 'text', placeholder: 'e.g. Golden Retriever' },
            { id: 'microchip', label: 'Microchip #', type: 'text', placeholder: 'e.g. 123456789' },
        ],
    },
};

const EMOJI_OPTIONS = [
    '👨',
    '👩',
    '👴',
    '👵',
    '👦',
    '👧',
    '👶',
    '🐕',
    '🐈',
    '🐹',
    '🐰',
    '🦜',
    '🐠',
    '👻',
    '🦸',
    '🦹',
    '🧙',
    '🧚',
    '🧛',
    '🧜',
    '🧝',
    '🤖',
    '👽',
    '👾',
    '🌱',
    '🪴',
    '🌲',
    '🌾',
    '🌳',
    '🌴',
    '🌵',
    '🌿',
    '☘️',
    '🍀',
];

let selectedTemplate = 'adult';
let selectedEmoji = '👨';

/**
 * Renders all profile cards from the current state into the grid.
 * Updates the empty state if no cards exist.
 */
function renderCards() {
    const cardsGrid = document.getElementById('cardsGrid');
    if (!cardsGrid) return;

    cardsGrid.innerHTML = '';

    if (cards.length === 0) {
        cardsGrid.innerHTML =
            '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #718096; font-size: 16px;">No profiles yet. Click "Create New Card" to add your family! 👨‍👩‍👧‍👦</p>';
        return;
    }

    cards.forEach((card) => {
        const cardEl = document.createElement('div');
        // fallback to 'adult' style if type is missing (legacy support)
        const cardType = card.type || 'adult';
        cardEl.className = `family-card ${cardType}`;

        let fieldsHTML = '';

        // Add Specific Fields based on type
        if (cardType === 'adult') {
            fieldsHTML += `
                <div class="family-field">
                    <label>Occupation</label>
                    <div class="value">${card.job || '—'}</div>
                </div>
            `;
        } else if (cardType === 'child') {
            fieldsHTML += `
                <div class="family-field">
                    <label>School</label>
                    <div class="value">${card.school || '—'}</div>
                </div>
                <div class="family-field">
                    <label>Interests</label>
                    <div class="value">${card.interests || '—'}</div>
                </div>
            `;
        } else if (cardType === 'pet') {
            fieldsHTML += `
                <div class="family-field">
                    <label>Breed</label>
                    <div class="value">${card.breed || '—'}</div>
                </div>
                <div class="family-field">
                    <label>Microchip</label>
                    <div class="value">${card.microchip || '—'}</div>
                </div>
            `;
        }

        // Calculate assigned accounts metrics
        const assignedAccounts = accounts.filter(
            (a) => a.ownerId === card.id && a.status === 'Active'
        );

        const cardMonthlySpend = assignedAccounts
            .filter((a) => a.type === 'expense' || !a.type)
            .reduce((sum, a) => sum + (parseFloat(a.monthlyPayment) || 0), 0);

        const cardAccountIncome = assignedAccounts
            .filter((a) => a.type === 'income')
            .reduce((sum, a) => sum + (parseFloat(a.monthlyPayment) || 0), 0);

        // Total Monthly Income only includes assigned income accounts
        const totalCardIncome = cardAccountIncome;

        // Add Income field if present
        if (totalCardIncome > 0) {
            fieldsHTML += `
                <div class="family-field" style="border-left: 3px solid #10b981; background: #f0fdf4;">
                    <label>Monthly Income</label>
                    <div class="value" style="color: #16a34a; font-weight: 800;">
                        ${TIMELINE_CONFIG.currency}${totalCardIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
            `;
        }

        if (cardMonthlySpend > 0) {
            fieldsHTML += `
                <div class="family-field" style="border-left: 3px solid #f87171; background: #fef2f2;">
                    <label>Monthly Spend</label>
                    <div class="value" style="color: #dc2626; font-weight: 800;">
                        ${TIMELINE_CONFIG.currency}${cardMonthlySpend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
            `;
        }

        // Add Birthday if present
        if (card.dateOfBirth) {
            fieldsHTML += `
                <div class="family-field">
                    <label>Birthday</label>
                    <div class="value">${new Date(card.dateOfBirth).toLocaleDateString()}</div>
                </div>
            `;
        }

        cardEl.innerHTML = `
            <div class="card-actions">
                <button class="action-btn" onclick="editCard('${card.id}')" title="Edit">✏️</button>
                <button class="action-btn delete" onclick="deleteCard('${card.id}')" title="Delete">🗑️</button>
            </div>
            
            <div class="family-header">
                <div class="family-info">
                    <div class="family-emoji">${card.emoji || '👤'}</div>
                    <div class="family-title-group">
                        <span class="family-title">${card.displayName}</span>
                        <span class="family-subtitle">${card.fullName || ''}</span>
                    </div>
                </div>
            </div>

            <div class="family-fields">
                ${fieldsHTML}
            </div>
        `;

        cardsGrid.appendChild(cardEl);
    });
}

function showCreateCardModal() {
    editingCardId = null;
    selectedTemplate = 'adult';
    selectedEmoji = '👨';

    document.getElementById('cardModalTitle').textContent = 'Create Profile Card';

    // Reset Template Selection UI
    renderTemplateSelector();

    // Reset Emoji Grid
    renderEmojiGrid();

    // Render Default Fields
    renderFormFields();

    document.getElementById('cardModal').classList.add('active');
}

function renderTemplateSelector() {
    const container = document.getElementById('templateSelector');
    if (!container) return;

    const options = container.querySelectorAll('.template-option');
    options.forEach((opt) => {
        opt.classList.remove('selected');
        // Simple text match or data attribute would be better, but relying on click handlers in HTML for now
        // But to sync UI state:
        const label = opt.querySelector('.template-label').textContent.toLowerCase();
        if (label === selectedTemplate) {
            opt.classList.add('selected');
        }
    });
}

function selectTemplate(type) {
    selectedTemplate = type;

    // Update UI
    const container = document.getElementById('templateSelector');
    const options = container.querySelectorAll('.template-option');
    options.forEach((opt) => {
        const label = opt.querySelector('.template-label').textContent.toLowerCase();
        if (label === type) opt.classList.add('selected');
        else opt.classList.remove('selected');
    });

    // Re-render fields
    renderFormFields();
}

function renderEmojiGrid() {
    const grid = document.getElementById('emojiGrid');
    if (!grid) return;

    grid.innerHTML = '';

    EMOJI_OPTIONS.forEach((emoji) => {
        const el = document.createElement('div');
        el.className = `emoji-option ${emoji === selectedEmoji ? 'selected' : ''}`;
        el.textContent = emoji;
        el.onclick = () => {
            selectedEmoji = emoji;
            renderEmojiGrid();
        };
        grid.appendChild(el);
    });
}

function renderFormFields() {
    const container = document.getElementById('cardForm');
    if (!container) return;

    const template = CARD_TEMPLATES[selectedTemplate];

    // Base Fields
    let html = `
        <div class="form-group">
            <label>Display Name *</label>
            <input type="text" id="cardDisplayName" placeholder="e.g. Dad, Fluffy" value="${editingCardId ? document.getElementById('cardDisplayName')?.value || '' : ''}">
        </div>
        <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="cardFullName" placeholder="e.g. John Doe" value="${editingCardId ? document.getElementById('cardFullName')?.value || '' : ''}">
        </div>
        <div class="form-group">
            <label>Date of Birth</label>
            <input type="date" id="cardDateOfBirth" value="${editingCardId ? document.getElementById('cardDateOfBirth')?.value || '' : ''}">
        </div>
    `;

    // Template Specific Fields
    template.fields.forEach((field) => {
        // Try to preserve value if switching back and forth or editing
        // For simplicity in create mode, we wipe. In edit mode we map.
        let value = '';
        if (editingCardId) {
            // Logic to retrieve existing value from DOM if we are re-rendering during edit would be complex
            // without state object. For now we assume re-render resets these fields unless we bind them.
            // Better approach: State-driven.
            // Since this is a simple app, let's just clear specific fields when switching templates.
        }

        html += `
            <div class="form-group">
                <label>${field.label}</label>
                <input type="${field.type}" id="card_${field.id}" placeholder="${field.placeholder}">
            </div>
        `;
    });

    container.innerHTML = html;
}

function closeCardModal() {
    document.getElementById('cardModal').classList.remove('active');
    editingCardId = null;
}

function editCard(cardId) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    editingCardId = cardId;
    selectedTemplate = card.type || 'adult';
    selectedEmoji = card.emoji || '👤';

    document.getElementById('cardModalTitle').textContent = 'Edit Profile Card';

    renderTemplateSelector();
    renderEmojiGrid();
    renderFormFields(); // This renders the inputs empty first

    // Now populate values
    setTimeout(() => {
        if (document.getElementById('cardDisplayName'))
            document.getElementById('cardDisplayName').value = card.displayName || '';
        if (document.getElementById('cardFullName'))
            document.getElementById('cardFullName').value = card.fullName || '';
        if (document.getElementById('cardDateOfBirth'))
            document.getElementById('cardDateOfBirth').value = card.dateOfBirth || '';

        // Populate specific fields
        const template = CARD_TEMPLATES[selectedTemplate];
        template.fields.forEach((field) => {
            const input = document.getElementById(`card_${field.id}`);
            if (input && card[field.id]) {
                input.value = card[field.id];
            }
        });

        document.getElementById('cardModal').classList.add('active');
    }, 0);
}

/**
 * Sanitizes input and saves a new or existing profile card.
 * Updates the cards state and persists to storage.
 */
function saveCard() {
    const displayNameRaw = document.getElementById('cardDisplayName')?.value.trim();
    const fullNameRaw = document.getElementById('cardFullName')?.value.trim();
    const dateOfBirth = document.getElementById('cardDateOfBirth')?.value;

    // Sanitize inputs
    const displayName = sanitizeInput(displayNameRaw, 50);
    const fullName = sanitizeInput(fullNameRaw, 100);

    if (!displayName || !fullName) {
        notify('❌ Display Name and Full Name are required', NOTIFICATION_TYPES.ERROR);
        return;
    }

    // Validate lengths
    if (displayName.length < 1 || fullName.length < 1) {
        notify('❌ Names must not be empty after sanitization', NOTIFICATION_TYPES.ERROR);
        return;
    }

    // Collect specific fields with sanitization
    const templateFields = {};
    CARD_TEMPLATES[selectedTemplate].fields.forEach((field) => {
        const val = document.getElementById(`card_${field.id}`)?.value;
        if (val) {
            // Sanitize based on field type
            if (field.type === 'number') {
                templateFields[field.id] = sanitizeNumber(val, 0, 10000000);
            } else {
                templateFields[field.id] = sanitizeInput(val, 200);
            }
        }
    });

    const newCardData = {
        id: editingCardId || `card_${Date.now()}`,
        type: selectedTemplate,
        emoji: selectedEmoji,
        displayName,
        fullName,
        dateOfBirth,
        ...templateFields,
    };

    if (editingCardId) {
        const index = cards.findIndex((c) => c.id === editingCardId);
        if (index !== -1) {
            cards[index] = newCardData;
        }
    } else {
        cards.push(newCardData);
    }

    saveToIndexedDB(DB_CONFIG.stores.profile, cards, 'cards')
        .then(() => {
            closeCardModal();
            renderCards();
            updateStats(); // Refresh stats in case income changed
            notify(
                editingCardId ? '✅ Profile updated!' : '✅ Profile created!',
                NOTIFICATION_TYPES.SUCCESS
            );
        })
        .catch((err) => {
            console.error('Save error:', err);
            notify(MESSAGES.saveError, NOTIFICATION_TYPES.WARNING);
        });
}

/**
 * Deletes a profile card after user confirmation.
 * Also cleans up any owner references in accounts.
 * @param {string} cardId - The ID of the card to delete.
 */
function deleteCard(cardId) {
    const card = cards.find((c) => c.id === cardId);
    if (!card) return;

    if (confirm(`Delete profile for "${card.displayName}"?`)) {
        cards = cards.filter((c) => c.id !== cardId);

        // Disassociate assigned accounts
        let accountsUpdated = false;
        accounts.forEach((acc) => {
            if (acc.ownerId === cardId) {
                acc.ownerId = null;
                accountsUpdated = true;
            }
        });

        const promises = [saveToIndexedDB(DB_CONFIG.stores.profile, cards, 'cards')];

        if (accountsUpdated) {
            promises.push(saveToIndexedDB(DB_CONFIG.stores.accounts, accounts, 'allAccounts'));
        }

        Promise.all(promises)
            .then(() => {
                renderCards();
                // Re-render accounts table if it's visible, as ownership changed (though not visible in table yet, good for consistency)
                // If we added owner column to table, this would be crucial.
                renderAccounts();
                updateStats(); // Refresh stats
                notify(
                    `✅ Profile deleted! Assigned accounts are now unassigned.`,
                    NOTIFICATION_TYPES.SUCCESS
                );
            })
            .catch((err) => {
                notify(MESSAGES.saveError, NOTIFICATION_TYPES.WARNING);
            });
    }
}

// ==================== ACCOUNTS MANAGEMENT ====================

function createAccountRow(row) {
    const {
        id,
        name,
        category,
        type,
        monthlyPayment,
        annualPayment,
        hasReminder,
        status,
        priority,
    } = row;
    const tr = document.createElement('tr');

    // Type handling
    const isIncome = type === 'income';
    const typeLabel = isIncome ? 'INCOME' : 'EXPENSE';
    const typeClass = isIncome ? 'type-income' : 'type-expense';

    // Convert status/paid/criticality to lowecase for CSS classes
    const statusClass = `status-${status.toLowerCase()}`;
    const paidClass = hasReminder === 'Yes' ? 'status-paid' : 'status-unpaid';
    const criticalityClass = `criticality-${priority.toLowerCase()}`;

    tr.innerHTML = `
        <td class="col-id">${id}</td>
        <td class="col-service">
            <div class="service-info">
                <span class="service-name">${name}</span>
            </div>
        </td>
        <td class="col-category">
            <span class="badge badge-outline category-badge">${category}</span>
        </td>
        <td class="col-type">
            <span class="badge ${typeClass}">${typeLabel}</span>
        </td>
        <td class="col-cost tabular ${isIncome ? 'type-income' : ''}">${TIMELINE_CONFIG.currency}${monthlyPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        <td class="col-cost tabular ${isIncome ? 'type-income' : ''}">${TIMELINE_CONFIG.currency}${annualPayment.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        <td class="col-paid">
            <span class="badge ${paidClass}">${hasReminder === 'Yes' ? 'PAID' : 'UNPAID'}</span>
        </td>
        <td class="col-status">
            <span class="badge ${statusClass}">${status}</span>
        </td>
        <td class="col-criticality">
            <span class="badge ${criticalityClass}">${priority}</span>
        </td>
        <td class="col-actions">
            <div class="table-actions">
                <button class="btn-icon edit" onclick="editAccount(${id})" title="Edit ${name}">✏️</button>
                <button class="btn-icon delete" onclick="deleteAccount(${id})" title="Delete ${name}">🗑️</button>
            </div>
        </td>
    `;
    return tr;
}

/**
 * Renders the accounts table based on the current filtering and sorting state.
 * Uses current filter values to determine what to show.
 */
function renderAccounts() {
    filterAccounts();
}

function toggleAddForm() {
    editingAccountId = null;
    modalTitle.textContent = '➕ Add New Account';

    // Populate Owner Dropdown
    const ownerSelect = document.getElementById('formOwner');
    if (ownerSelect) {
        ownerSelect.innerHTML = '<option value="">(Unassigned)</option>';
        cards.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.emoji} ${c.displayName}`;
            ownerSelect.appendChild(opt);
        });
    }

    // Populate dynamic dropdowns
    populateAccountFormDropdowns();

    // Manually reset form fields since accountForm is a div, not a form element
    const formPreset = document.getElementById('formPreset');
    if (formPreset) {
        populateTemplateDropdown();
        formPreset.value = '';
    }
    formService.value = '';
    formCategory.value = '';
    if (formType) formType.value = 'expense';
    if (ownerSelect) ownerSelect.value = '';
    formMonthlyCost.value = '0';
    formAnnualCost.value = '0';
    formPaid.value = '';
    formStatus.value = '';
    formCriticality.value = '';

    accountModal.classList.add('active');
}

function editAccount(id) {
    const account = accounts.find((a) => a.id === id);
    if (!account) return;

    editingAccountId = id;
    const {
        name: service,
        category,
        type,
        monthlyPayment: monthlyCost,
        annualPayment: annualCost,
        hasReminder: paid,
        status,
        priority: criticality,
        ownerId,
    } = account;

    modalTitle.textContent = `✏️ Edit Account: ${service}`;
    formService.value = service;
    formCategory.value = category;
    if (formType) formType.value = type || 'expense';
    formMonthlyCost.value = monthlyCost;
    formAnnualCost.value = annualCost;
    formPaid.value = paid;
    formStatus.value = status;
    formCriticality.value = criticality;

    // Populate dynamic dropdowns
    populateAccountFormDropdowns();

    // Preserve the current values after population
    formCategory.value = category;
    formStatus.value = status;
    formCriticality.value = criticality;

    // Populate Owner Dropdown and Value
    const ownerSelect = document.getElementById('formOwner');
    if (ownerSelect) {
        ownerSelect.innerHTML = '<option value="">(Unassigned)</option>';
        cards.forEach((c) => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.emoji} ${c.displayName}`;
            ownerSelect.appendChild(opt);
        });
        ownerSelect.value = ownerId || '';
    }

    accountModal.classList.add('active');
}

/**
 * Sanitizes input and saves a new or existing account (income/expense).
 * Enforces numeric bounds and updates storage.
 */
function saveAccount() {
    const serviceRaw = formService?.value.trim();
    const category = formCategory?.value;
    const type = formType?.value || 'expense';
    const monthlyCostRaw = formMonthlyCost?.value;
    const annualCostRaw = formAnnualCost?.value;
    const paid = formPaid?.value;
    const status = formStatus?.value;
    const criticality = formCriticality?.value;
    const ownerId = document.getElementById('formOwner')?.value || null;

    // Sanitize service name
    const service = sanitizeInput(serviceRaw, 100);

    // Sanitize and validate numeric inputs
    const monthlyCost = sanitizeNumber(monthlyCostRaw, 0, 1000000);
    const annualCost = sanitizeNumber(annualCostRaw, 0, 10000000);

    if (!service || !category || !paid || !status || !criticality) {
        notify(MESSAGES.fillRequired, NOTIFICATION_TYPES.ERROR);
        return;
    }

    if (service.length < 1) {
        notify('❌ Service name must not be empty after sanitization', NOTIFICATION_TYPES.ERROR);
        return;
    }

    if (editingAccountId !== null) {
        // Edit existing
        const index = accounts.findIndex((a) => a.id === editingAccountId);
        if (index === -1) return;

        accounts[index] = {
            ...accounts[index],
            name: service,
            category,
            type,
            monthlyPayment: monthlyCost,
            annualPayment: annualCost,
            hasReminder: paid,
            status,
            priority: criticality,
            ownerId,
        };
    } else {
        // Add new
        const newId = Math.max(...accounts.map((a) => a.id), 0) + 1;
        accounts.push({
            id: newId,
            name: service,
            category,
            type,
            monthlyPayment: monthlyCost,
            annualPayment: annualCost,
            hasReminder: paid,
            status,
            priority: criticality,
            ownerId,
        });
    }

    saveToIndexedDB(DB_CONFIG.stores.accounts, accounts, 'allAccounts')
        .then(() => {
            closeAccountModal();
            renderAccounts();

            // Also re-render profiles if on that tab to show updated numbers
            if (document.getElementById('profile').classList.contains('active')) {
                renderCards();
            }

            updateStats();
            initCharts();
            notify('✅ Account saved!', NOTIFICATION_TYPES.SUCCESS);
        })
        .catch((err) => {
            console.error('Save error:', err);
            notify(MESSAGES.saveError, NOTIFICATION_TYPES.WARNING);
            closeAccountModal();
            renderAccounts();
            updateStats();
        });
}

function deleteAccount(id) {
    const index = accounts.findIndex((a) => a.id === id);
    if (index === -1) return;

    const accountName = accounts[index].name;
    if (confirm(MESSAGES.deleteConfirm(accountName))) {
        accounts.splice(index, 1);

        saveToIndexedDB(DB_CONFIG.stores.accounts, accounts, 'allAccounts')
            .then(() => {
                renderAccounts();
                updateStats();
                initCharts();
                notify(MESSAGES.accountDeleted, NOTIFICATION_TYPES.SUCCESS);
            })
            .catch((err) => {
                console.error('Delete error:', err);
                renderAccounts();
                updateStats();
            });
    }
}

function closeAccountModal() {
    accountModal.classList.remove('active');
    editingAccountId = null;
}

/**
 * Filters the accounts list based on category, type, status, and owner.
 * Updates the UI with only matching entries.
 */
function filterAccounts() {
    const catVal = filterCategory ? filterCategory.value : '';
    const typeVal = filterType ? filterType.value : '';
    const statusVal = filterStatus ? filterStatus.value : '';
    const critVal = filterCriticality ? filterCriticality.value : '';
    const ownerVal = filterOwner ? filterOwner.value : '';

    const filtered = accounts.filter((acc) => {
        const matchCat = catVal === '' || acc.category === catVal;
        const matchType = typeVal === '' || (acc.type || 'expense') === typeVal;
        const matchStatus = statusVal === '' || acc.status === statusVal;
        const matchCrit = critVal === '' || acc.priority === critVal;
        const matchOwner =
            ownerVal === '' ||
            acc.ownerId === ownerVal ||
            (ownerVal === 'unassigned' && !acc.ownerId);
        return matchCat && matchType && matchStatus && matchCrit && matchOwner;
    });

    if (!accountsBody) return;

    if (filtered.length === 0) {
        accountsBody.innerHTML = `
            <tr>
                <td colspan="10">
                    <div class="empty-state-row">
                        <div class="empty-state-content">
                            <div class="empty-state-icon">🔎</div>
                            <div class="empty-state-text">No accounts found matching your filters</div>
                            <button class="btn-secondary btn-tiny" onclick="clearAllFilters()">Reset All Filters</button>
                        </div>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    // Use DocumentFragment for better performance
    const fragment = document.createDocumentFragment();
    filtered.forEach((row) => {
        fragment.appendChild(createAccountRow(row));
    });

    accountsBody.innerHTML = '';
    accountsBody.appendChild(fragment);
}

// ==================== SORTING ====================

let currentSortColumn = null;
let currentSortDirection = 'asc'; // 'asc' or 'desc'

function sortTable(column) {
    // Toggle direction if clicking the same column
    if (currentSortColumn === column) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortColumn = column;
        currentSortDirection = 'asc';
    }

    // Sort the accounts array
    accounts.sort((a, b) => {
        let valueA = a[column] || '';
        let valueB = b[column] || '';

        // Handle property name mapping for sorting
        if (column === 'service') {
            // Should be mapped from the header data-sort attribute if it differs
            // The column name passed in is usually the key in the object, so checking headers is key.
            // Looking at HTML, the header for name has onclick="sortTable('name')".
            // Wait, looking at Step 409, the first th has: onclick="sortTable('id')".
            // The second th has: onclick="sortTable('name')" ... wait, no.
            // Line 197 in Step 409 says "Service Name". The th isn't fully visible.
            // Let's assume standard keys.
        }

        // Handle numeric/string types
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        // Compare values
        let comparison = 0;
        if (valueA > valueB) {
            comparison = 1;
        } else if (valueA < valueB) {
            comparison = -1;
        }

        // Apply sort direction
        return currentSortDirection === 'asc' ? comparison : -comparison;
    });

    // Re-render the table
    renderAccounts();
}

// ==================== STATS UPDATE ====================

/**
 * Calculates high-level dashboard statistics (total income, expenses, net flow).
 * Directly updates the stats grid in the DOM.
 */
function updateStats() {
    // 1. Inventory Count (All accounts)
    const totalAccounts = accounts.length;

    // 2. Financial Totals (Use central engine for consistency)
    const { totalIncome, totalExpense } = calculateBaseMonthlyValues();
    const netFlow = totalIncome - totalExpense;

    const totalAccountsEl = document.getElementById('totalAccounts');
    const incomeEl = document.getElementById('statMonthlyIncome');
    const expenseEl = document.getElementById('statMonthlyExpense');
    const netFlowEl = document.getElementById('statNetFlow');

    if (totalAccountsEl) totalAccountsEl.textContent = totalAccounts;
    if (incomeEl)
        incomeEl.textContent = `${TIMELINE_CONFIG.currency}${totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
    if (expenseEl)
        expenseEl.textContent = `${TIMELINE_CONFIG.currency}${totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

    if (netFlowEl) {
        netFlowEl.textContent = `${TIMELINE_CONFIG.currency}${netFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
        netFlowEl.className =
            'stat-value ' + (netFlow >= 0 ? 'net-flow-positive' : 'net-flow-negative');
    }
}

// ==================== CHARTS ====================

// Store chart instances globally to destroy them before recreating
let categoryChartInstance = null;
let costChartInstance = null;
let criticalityChartInstance = null;
let statusChartInstance = null;
let cashFlowChartInstance = null;

/**
 * Destroy all chart instances to prevent memory leaks
 * Call this before re-initializing charts
 */
function destroyAllCharts() {
    const charts = [
        categoryChartInstance,
        costChartInstance,
        criticalityChartInstance,
        statusChartInstance,
        cashFlowChartInstance,
    ];

    charts.forEach((chart) => {
        if (chart) {
            try {
                chart.destroy();
            } catch (err) {
                console.warn('Error destroying chart:', err);
            }
        }
    });

    // Reset all instances to null
    categoryChartInstance = null;
    costChartInstance = null;
    criticalityChartInstance = null;
    statusChartInstance = null;
    cashFlowChartInstance = null;
}

/**
 * Initializes and renders all dashboard charts using Chart.js.
 * Performs data aggregation and cleans up existing instances.
 */
function initCharts() {
    // Destroy existing charts first
    destroyAllCharts();

    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded. Charts will not be displayed.');
        const chartContainers = document.querySelectorAll('canvas');
        chartContainers.forEach((canvas) => {
            const parent = canvas.parentElement;
            if (parent && !parent.querySelector('.chart-error-msg')) {
                const msg = document.createElement('div');
                msg.className = 'chart-error-msg';
                msg.innerHTML =
                    '<p style="text-align:center; padding: 20px; color: #718096; background: #f7fafc; border-radius: 8px;">📊 Charts unavailable (Library not loaded)</p>';
                canvas.style.display = 'none';
                parent.appendChild(msg);
            }
        });
        return;
    }

    // Aggregating Data
    const categoryCounts = {};
    const categoryExpenseCosts = {};
    const criticalityCounts = { Critical: 0, Essential: 0, Important: 0, Optional: 0 };
    const statusCounts = { Active: 0, Planned: 0, Dormant: 0, Cancelled: 0 };

    let chartAccountIncome = 0;
    let chartAccountExpense = 0;

    accounts.forEach((acc) => {
        const { category, monthlyPayment, status, priority, type } = acc;
        const isIncome = type === 'income';
        const isActive = status === 'Active';

        // 1. Category Count (All accounts - Inventory mode)
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;

        // 2. Financial Totals (Active items only - Reality mode)
        if (isActive) {
            if (isIncome) {
                chartAccountIncome += parseFloat(monthlyPayment) || 0;
            } else {
                chartAccountExpense += parseFloat(monthlyPayment) || 0;
                categoryExpenseCosts[category] =
                    (categoryExpenseCosts[category] || 0) + (parseFloat(monthlyPayment) || 0);
            }
        }

        if (criticalityCounts.hasOwnProperty(priority)) criticalityCounts[priority]++;
        if (statusCounts.hasOwnProperty(status)) statusCounts[status]++;
    });

    const totalIncome = chartAccountIncome;

    // 1. Accounts by Category (Horizontal Bar - Sorted)
    const sortedCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1]) // Sort desc by count
        .slice(0, 15); // Top 15 categories

    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(categoryCtx, {
            type: 'bar',
            data: {
                labels: sortedCategories.map((i) => i[0]),
                datasets: [
                    {
                        label: 'Number of Accounts',
                        data: sortedCategories.map((i) => i[1]),
                        backgroundColor: COLORS.chartPalette,
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, grid: { display: false } },
                    y: { grid: { display: false } },
                },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const category = sortedCategories[index][0];

                        // Switch to accounts tab
                        switchTab('accounts');

                        // Reset other filters to avoid "Double Filtering"
                        if (filterType) filterType.value = '';
                        if (filterStatus) filterStatus.value = '';
                        if (filterCriticality) filterCriticality.value = '';
                        if (filterOwner) filterOwner.value = '';

                        // Apply filter
                        if (filterCategory) {
                            filterCategory.value = category;
                            filterAccounts();
                            notify(`🔍 Showing accounts for: ${category}`, NOTIFICATION_TYPES.INFO);
                        }
                    }
                },
            },
        });
    }

    // 2. Monthly Expense Distribution (Horizontal Bar - Sorted by Cost)
    const sortedCosts = Object.entries(categoryExpenseCosts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Top 10 expensive categories

    const costCtx = document.getElementById('costChart');
    if (costCtx) {
        if (costChartInstance) costChartInstance.destroy();
        costChartInstance = new Chart(costCtx, {
            type: 'bar',
            data: {
                labels: sortedCosts.map((i) => i[0]),
                datasets: [
                    {
                        label: `Monthly Expense (${TIMELINE_CONFIG.currency})`,
                        data: sortedCosts.map((i) => i[1]),
                        backgroundColor: COLORS.danger + 'bb', // Subtle red
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                indexAxis: 'y',
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true },
                    y: { grid: { display: false } },
                },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const category = sortedCosts[index][0];

                        // Switch to accounts tab
                        switchTab('accounts');

                        // Reset other filters
                        if (filterType) filterType.value = '';
                        if (filterStatus) filterStatus.value = '';
                        if (filterCriticality) filterCriticality.value = '';
                        if (filterOwner) filterOwner.value = '';

                        // Apply filter
                        if (filterCategory) {
                            filterCategory.value = category;
                            filterAccounts();
                            notify(`🔍 Showing expenses for: ${category}`, NOTIFICATION_TYPES.INFO);
                        }
                    }
                },
            },
        });
    }

    // 2.5 Cash Flow Comparison (Income vs Expense)
    const flowCtx = document.getElementById('cashFlowChart');
    if (flowCtx) {
        if (cashFlowChartInstance) cashFlowChartInstance.destroy();
        cashFlowChartInstance = new Chart(flowCtx, {
            type: 'bar',
            data: {
                labels: ['Monthly Cash Flow'],
                datasets: [
                    {
                        label: 'Total Income',
                        data: [totalIncome],
                        backgroundColor: COLORS.success,
                        borderRadius: 4,
                    },
                    {
                        label: 'Total Expense',
                        data: [chartAccountExpense],
                        backgroundColor: COLORS.danger,
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true },
                },
            },
        });
    }

    // 3. Criticality Levels (Vertical Bar)
    const criticalityCtx = document.getElementById('criticalityChart');
    if (criticalityCtx) {
        if (criticalityChartInstance) criticalityChartInstance.destroy();
        criticalityChartInstance = new Chart(criticalityCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(criticalityCounts),
                datasets: [
                    {
                        label: 'Count',
                        data: Object.values(criticalityCounts),
                        backgroundColor: [
                            'rgba(239, 68, 68, 0.7)', // Critical (Red)
                            'rgba(245, 158, 11, 0.7)', // Essential (Orange)
                            'rgba(99, 102, 241, 0.7)', // Important (Indigo)
                            'rgba(148, 163, 184, 0.7)', // Optional (Slate)
                        ],
                        borderRadius: 4,
                        barPercentage: 0.6,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            generateLabels: (chart) =>
                                chart.data.labels.map((label, i) => ({
                                    text: label,
                                    fillStyle: chart.data.datasets[0].backgroundColor[i],
                                    strokeStyle: chart.data.datasets[0].backgroundColor[i],
                                    index: i,
                                })),
                        },
                    },
                },
                scales: { y: { beginAtZero: true } },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const criticality = criticalityChartInstance.data.labels[index];

                        // Switch to accounts tab
                        switchTab('accounts');

                        // Reset other filters
                        if (filterCategory) filterCategory.value = '';
                        if (filterType) filterType.value = '';
                        if (filterStatus) filterStatus.value = '';
                        if (filterOwner) filterOwner.value = '';

                        // Apply specific filter
                        if (filterCriticality) {
                            filterCriticality.value = criticality;
                            filterAccounts();
                            notify(
                                `🔍 Showing accounts with criticality: ${criticality}`,
                                NOTIFICATION_TYPES.INFO
                            );
                        }
                    }
                },
            },
        });
    }

    // 4. Account Status (Vertical Bar)
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        if (statusChartInstance) statusChartInstance.destroy();
        statusChartInstance = new Chart(statusCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(statusCounts),
                datasets: [
                    {
                        label: 'Count',
                        data: Object.values(statusCounts),
                        backgroundColor: [
                            COLORS.success, // Active
                            COLORS.info, // Planned
                            COLORS.warning, // Dormant
                            COLORS.danger, // Cancelled
                        ],
                        borderRadius: 4,
                        barPercentage: 0.6,
                    },
                ],
            },
            options: {
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            generateLabels: (chart) =>
                                chart.data.labels.map((label, i) => ({
                                    text: label,
                                    fillStyle: chart.data.datasets[0].backgroundColor[i],
                                    strokeStyle: chart.data.datasets[0].backgroundColor[i],
                                    index: i,
                                })),
                        },
                    },
                },
                scales: { y: { beginAtZero: true } },
                onClick: (e, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const status = statusChartInstance.data.labels[index];

                        // Switch to accounts tab
                        switchTab('accounts');

                        // Reset other filters
                        if (filterCategory) filterCategory.value = '';
                        if (filterType) filterType.value = '';
                        if (filterCriticality) filterCriticality.value = '';
                        if (filterOwner) filterOwner.value = '';

                        // Apply specific filter
                        if (filterStatus) {
                            filterStatus.value = status;
                            filterAccounts();
                            notify(
                                `🔍 Showing accounts with status: ${status}`,
                                NOTIFICATION_TYPES.INFO
                            );
                        }
                    }
                },
            },
        });
    }
    updateStats();
}

// ==================== TIMELINE MANAGEMENT ====================

let currentStartingBalance = TIMELINE_CONFIG.defaultStartingBalance;

function getTimelineYears() {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
}

function generateMonthData(years) {
    const { totalIncome, totalExpense } = calculateBaseMonthlyValues();
    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    let allMonths = [];
    years.forEach((year) => {
        months.forEach((month) => {
            allMonths.push({
                id: `${year}-${month}`,
                year: year,
                month: month,
                display: `${year} - ${month}`,
                income: parseFloat(totalIncome.toFixed(2)),
                expenses: parseFloat(totalExpense.toFixed(2)),
                isLocked: false,
            });
        });
    });
    return allMonths;
}

/**
 * Initializes the financial timeline using in-memory data and saved overrides.
 * Updates the 3-year projection grid without re-fetching from server.
 */
function initializeTimelineData() {
    const years = getTimelineYears();
    let timelineData = generateMonthData(years);

    // Update titles
    const titleEl = document.getElementById('timelineTitle');
    if (titleEl) titleEl.textContent = `${years[0]} - ${years[2]} Financial Timeline`;

    const chartTitleEl = document.getElementById('chartTitle');
    if (chartTitleEl) chartTitleEl.textContent = `${years[0]} - ${years[2]} Balance Projection`;

    // Use global timeline overrides if they exist
    if (window.timelineOverrides) {
        // Merge saved months into generated structure
        if (window.timelineOverrides.months && Array.isArray(window.timelineOverrides.months)) {
            timelineData = timelineData.map((item) => {
                const savedItem = window.timelineOverrides.months.find((m) => m.id === item.id);
                if (savedItem) {
                    return {
                        ...item,
                        income: savedItem.income,
                        expenses: savedItem.expenses,
                        isLocked: savedItem.isLocked || false,
                    };
                }
                return item;
            });
        }

        if (window.timelineOverrides.startingBalance !== undefined) {
            currentStartingBalance = window.timelineOverrides.startingBalance;
        }
    }

    // Set input value
    const balanceInput = document.getElementById('startingBalanceInput');
    if (balanceInput) balanceInput.value = currentStartingBalance;

    renderTimelineTable(timelineData);
    renderBalanceChart(timelineData);
}

function calculateBalances(timelineData) {
    let runningBalance = currentStartingBalance;
    return timelineData.map((item) => {
        const balance = runningBalance + item.income - item.expenses;
        runningBalance = balance;
        return { ...item, balance };
    });
}

function renderTimelineTable(timelineData) {
    const withBalances = calculateBalances(timelineData);
    const tbody = document.getElementById('timelineBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    withBalances.forEach((item, index) => {
        const row = document.createElement('tr');
        // Unique ID for navigation (e.g. 2025-January)
        row.id = `${item.year}-${item.month}`;

        const isNegative = item.balance < 0;
        const balanceClass = isNegative
            ? 'timeline-balance negative-balance'
            : 'timeline-balance balance-positive';

        // Add divider for new years
        if (item.month === 'January' && index > 0) {
            const separatorRow = document.createElement('tr');
            separatorRow.innerHTML = `<td colspan="5" style="background-color: #f8fafc; font-weight: 800; padding: 10px 15px; border-top: 2px solid #e2e8f0; color: #475569;">🗓️ ${item.year}</td>`;
            tbody.appendChild(separatorRow);
        }

        row.className = item.isLocked ? 'locked-row' : '';
        row.innerHTML = `
            <td>
                <button class="lock-btn ${item.isLocked ? 'locked' : ''}" 
                    onclick="toggleMonthLock(${index})" 
                    title="${item.isLocked ? 'Unlock month' : 'Lock month'}">
                    ${item.isLocked ? '🔒' : '🔓'}
                </button>
            </td>
            <td class="font-bold">${item.display}</td>
            <td>
                <input type="number" data-index="${index}" data-field="income" 
                    value="${item.income}" min="0" step="100" class="timeline-input" 
                    ${item.isLocked ? 'readonly' : ''}>
            </td>
            <td>
                <input type="number" data-index="${index}" data-field="expenses" 
                    value="${item.expenses}" min="0" step="10" class="timeline-input"
                    ${item.isLocked ? 'readonly' : ''}>
            </td>
            <td class="${balanceClass}">${TIMELINE_CONFIG.currency}${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Toggles the lock status of a month in the timeline.
 * Persists changes immediately.
 */
function toggleMonthLock(index) {
    // We need to read current data from DOM or global if we had one.
    // Current app uses render/scrape pattern.
    const row = document.querySelector(`input[data-index="${index}"]`)?.closest('tr');
    if (!row) return;

    const lockBtn = row.querySelector('.lock-btn');
    const isLocked = !lockBtn.classList.contains('locked');

    // Update UI immediately (visual feedback)
    lockBtn.classList.toggle('locked', isLocked);
    lockBtn.innerHTML = isLocked ? '🔒' : '🔓';
    lockBtn.title = isLocked ? 'Unlock month' : 'Lock month';
    row.classList.toggle('locked-row', isLocked);

    // Update inputs
    const inputs = row.querySelectorAll('input');
    inputs.forEach((input) => {
        if (isLocked) input.setAttribute('readonly', 'true');
        else input.removeAttribute('readonly');
    });

    // Save state
    saveTimelineData();
}

function saveTimelineData() {
    // 1. Get Starting Balance
    const balanceInput = document.getElementById('startingBalanceInput');
    const newStartingBalance = parseFloat(balanceInput?.value) || 0;
    currentStartingBalance = newStartingBalance;

    // 2. Get All Rows Data
    const inputs = document.querySelectorAll('.timeline-input');
    const years = getTimelineYears();
    let currentData = generateMonthData(years); // Start with clean structure

    // We need to map inputs back to the data structure
    // Since inputs are rendered in order, we can map them by index logic
    // Each row has 2 inputs (income, expenses)

    const rowsCount = inputs.length / 2;

    if (rowsCount !== currentData.length) {
        console.warn('Row count mismatch during save');
    }

    for (let i = 0; i < currentData.length; i++) {
        // Find inputs for this index
        // Use querySelector to be safe with data attributes we assigned
        const incomeInput = document.querySelector(`input[data-index="${i}"][data-field="income"]`);
        const expenseInput = document.querySelector(
            `input[data-index="${i}"][data-field="expenses"]`
        );

        if (incomeInput && expenseInput) {
            const lockBtn = incomeInput.closest('tr')?.querySelector('.lock-btn');
            const isLocked = lockBtn?.classList.contains('locked') || false;

            currentData[i].income = parseFloat(incomeInput.value) || 0;
            currentData[i].expenses = parseFloat(expenseInput.value) || 0;
            currentData[i].isLocked = isLocked;
        }
    }

    const dataToSave = {
        startingBalance: currentStartingBalance,
        months: currentData,
    };

    saveToIndexedDB(DB_CONFIG.stores.timeline, dataToSave, 'timelineData')
        .then(() => {
            notify('✅ 3-Year Timeline saved successfully!', NOTIFICATION_TYPES.SUCCESS);
            renderTimelineTable(currentData);
            renderBalanceChart(currentData);
        })
        .catch((err) => {
            console.error('Error saving timeline:', err);
            notify(MESSAGES.saveError, NOTIFICATION_TYPES.ERROR);
        });
}

/**
 * Automatically populates the timeline data using current income and expenses.
 * Re-calculates balances for the next 36 months.
 */
function autoPopulateTimeline() {
    if (
        confirm(
            'This will update all UNLOCKED months with your current monthly Income and Expenses. Locked months will be preserved. Proceed?'
        )
    ) {
        const { totalIncome, totalExpense } = calculateBaseMonthlyValues();

        // We need the current full timeline data to preserve locks
        // Current saveTimelineData returns the data structure.
        // Let's scrape what we have and only update non-locked ones.

        const rows = document.querySelectorAll(
            '#timelineBody tr:not([style*="background-color: #e2e8f0"])'
        ); // exclude year headers
        const years = getTimelineYears();
        let timelineData = generateMonthData(years); // Get structure

        // Load existing status from window.timelineOverrides if available, or scrape DOM
        // The most reliable is to map against window.timelineOverrides or what we are currently showing.

        const inputs = document.querySelectorAll('.timeline-input');
        const rowsCount = inputs.length / 2;

        for (let i = 0; i < rowsCount; i++) {
            const incomeInput = document.querySelector(
                `input[data-index="${i}"][data-field="income"]`
            );
            const lockBtn = incomeInput?.closest('tr')?.querySelector('.lock-btn');
            const isLocked = lockBtn?.classList.contains('locked') || false;

            if (isLocked) {
                // Keep existing values
                const expenseInput = document.querySelector(
                    `input[data-index="${i}"][data-field="expenses"]`
                );
                timelineData[i].income = parseFloat(incomeInput.value) || 0;
                timelineData[i].expenses = parseFloat(expenseInput.value) || 0;
                timelineData[i].isLocked = true;
            } else {
                // Update with fresh defaults
                timelineData[i].income = parseFloat(totalIncome.toFixed(2));
                timelineData[i].expenses = parseFloat(totalExpense.toFixed(2));
                timelineData[i].isLocked = false;
            }
        }

        renderTimelineTable(timelineData);
        saveTimelineData();
        notify('✅ Timeline refreshed! (Locked months preserved)', NOTIFICATION_TYPES.SUCCESS);
    }
}

function renderBalanceChart(timelineData) {
    const withBalances = calculateBalances(timelineData);
    const ctx = document.getElementById('balanceChart');

    if (!ctx) return;

    if (typeof Chart === 'undefined') {
        ctx.style.display = 'none';
        const parent = ctx.parentElement;
        if (parent && !parent.querySelector('.chart-error-msg')) {
            const msg = document.createElement('div');
            msg.className = 'chart-error-msg';
            msg.innerHTML =
                '<p style="text-align:center; padding: 20px; color: #718096; background: #f7fafc; border-radius: 8px;">📈 Timeline Chart unavailable</p>';
            parent.appendChild(msg);
        }
        return;
    }

    if (window.balanceChartInstance) {
        window.balanceChartInstance.destroy();
    }

    window.balanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: withBalances.map((m) => m.display),
            datasets: [
                {
                    label: `Projected Balance (${TIMELINE_CONFIG.currency})`,
                    data: withBalances.map((m) => m.balance),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 2, // Smaller points for dense data
                    pointBackgroundColor: '#6366f1',
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `Balance: ${TIMELINE_CONFIG.currency}${context.parsed.y.toFixed(2)}`;
                        },
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: `Balance (${TIMELINE_CONFIG.currency})` },
                },
                x: {
                    ticks: {
                        maxTicksLimit: 12, // Limit X-axis labels to avoid clutter
                    },
                },
            },
        },
    });
}

// ==================== SETTINGS LOGIC ====================

/**
 * Synchronizes the Settings tab UI with the current application state.
 * Refreshes dropdowns and input values.
 */
function syncSettingsUI() {
    const colorInput = document.getElementById('settingPrimaryColor');
    const darkModeInput = document.getElementById('settingDarkMode');
    const currencyInput = document.getElementById('settingCurrency');
    const timeoutInput = document.getElementById('settingTimeout');
    const autoShutdownInput = document.getElementById('settingAutoShutdown');
    const timeoutDisplay = document.getElementById('timeoutDisplay');

    if (colorInput) colorInput.value = appSettings.primaryColor;
    if (darkModeInput) darkModeInput.checked = appSettings.theme === 'dark';
    if (currencyInput) currencyInput.value = appSettings.currency;
    if (timeoutInput) timeoutInput.value = appSettings.heartbeatTimeout;
    if (autoShutdownInput) autoShutdownInput.checked = appSettings.autoShutdown;

    if (timeoutDisplay) {
        const val = appSettings.heartbeatTimeout;
        timeoutDisplay.textContent =
            val >= 60 ? `${Math.floor(val / 60)}m ${val % 60}s` : `${val}s`;
    }

    // Add event listeners if not already added
    if (colorInput && !colorInput.dataset.listener) {
        colorInput.dataset.listener = 'true';
        colorInput.addEventListener('input', (e) => {
            appSettings.primaryColor = e.target.value;
            applySettings();
            saveSettings();
        });

        if (darkModeInput) {
            darkModeInput.addEventListener('change', (e) => {
                appSettings.theme = e.target.checked ? 'dark' : 'light';
                applySettings();
                saveSettings();
            });
        }

        if (currencyInput) {
            currencyInput.addEventListener('change', (e) => {
                appSettings.currency = e.target.value;
                TIMELINE_CONFIG.currency = e.target.value;
                saveSettings();
                notify(
                    `Currency updated to ${e.target.value}. Please refresh or switch tabs to see all changes.`,
                    NOTIFICATION_TYPES.SUCCESS
                );
            });
        }

        if (timeoutInput) {
            timeoutInput.addEventListener('input', (e) => {
                appSettings.heartbeatTimeout = parseInt(e.target.value);
                const val = appSettings.heartbeatTimeout;
                timeoutDisplay.textContent =
                    val >= 60 ? `${Math.floor(val / 60)}m ${val % 60}s` : `${val}s`;
            });

            timeoutInput.addEventListener('change', () => {
                applySettings();
                saveSettings();
            });
        }

        if (autoShutdownInput) {
            autoShutdownInput.addEventListener('change', (e) => {
                appSettings.autoShutdown = e.target.checked;
                applySettings();
                saveSettings();
            });
        }
    }

    renderMetadataManagers();
}

function renderMetadataManagers() {
    const renderList = (type, containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const items = appSettings[type] || [];
        container.innerHTML = items
            .map(
                (item, index) => `
            <div class="metadata-item">
                <span>${item}</span>
                <div class="metadata-item-actions">
                    <button class="btn-tiny" onclick="editMetadataItem('${type}', ${index})">✏️</button>
                    <button class="btn-tiny delete" onclick="deleteMetadataItem('${type}', ${index})">🗑️</button>
                </div>
            </div>
        `
            )
            .join('');

        // Also update any dropdowns that need this data immediately
        if (type === 'categories') {
            // Update Form Dropdown
            const formSelect = document.getElementById('formCategory');
            if (formSelect) {
                const currentVal = formSelect.value;
                formSelect.innerHTML =
                    '<option value="">Select Category</option>' +
                    items.map((cat) => `<option value="${cat}">${cat}</option>`).join('');
                formSelect.value = currentVal;
            }
            // Update Filter Dropdown
            const filterSelect = document.getElementById('filterCategory');
            if (filterSelect) {
                const currentVal = filterSelect.value;
                filterSelect.innerHTML =
                    '<option value="">All</option>' +
                    items.map((cat) => `<option value="${cat}">${cat}</option>`).join('');
                filterSelect.value = currentVal;
            }
        } else if (type === 'statuses') {
            // Update Form Dropdown
            const formSelect = document.getElementById('formStatus');
            if (formSelect) {
                const currentVal = formSelect.value;
                formSelect.innerHTML =
                    '<option value="">Select Status</option>' +
                    items.map((cat) => `<option value="${cat}">${cat}</option>`).join('');
                formSelect.value = currentVal;
            }
            // Update Filter Dropdown
            const filterSelect = document.getElementById('filterStatus');
            if (filterSelect) {
                const currentVal = filterSelect.value;
                filterSelect.innerHTML =
                    '<option value="">All</option>' +
                    items.map((cat) => `<option value="${cat}">${cat}</option>`).join('');
                filterSelect.value = currentVal;
            }
        } else if (type === 'criticalities') {
            // Update Form Dropdown
            const formSelect = document.getElementById('formCriticality');
            if (formSelect) {
                const currentVal = formSelect.value;
                formSelect.innerHTML =
                    '<option value="">Select Level</option>' +
                    items.map((cat) => `<option value="${cat}">${cat}</option>`).join('');
                formSelect.value = currentVal;
            }
        }
    };

    renderList('categories', 'categoryManager');
    renderList('statuses', 'statusManager');
    renderList('criticalities', 'criticalityManager');
}

function addMetadataItem(type) {
    const inputId =
        type === 'categories'
            ? 'newCategoryInput'
            : type === 'statuses'
              ? 'newStatusInput'
              : 'newCriticalityInput';
    const input = document.getElementById(inputId);
    const value = input?.value.trim();

    if (!value) return;
    if (!appSettings[type]) appSettings[type] = [];

    if (appSettings[type].includes(value)) {
        notify('This item already exists', NOTIFICATION_TYPES.WARNING);
        return;
    }

    appSettings[type].push(value);
    input.value = '';

    renderMetadataManagers();
    saveSettings();
    notify('✅ Item added', NOTIFICATION_TYPES.SUCCESS);
}

function deleteMetadataItem(type, index) {
    const item = appSettings[type][index];
    if (confirm(`Are you sure you want to delete "${item}"?`)) {
        appSettings[type].splice(index, 1);
        renderMetadataManagers();
        saveSettings();
        notify('✅ Item deleted', NOTIFICATION_TYPES.SUCCESS);
    }
}

function editMetadataItem(type, index) {
    const oldVal = appSettings[type][index];
    const newVal = prompt(`Edit ${type.slice(0, -1)}:`, oldVal);

    if (newVal && newVal.trim() !== '' && newVal !== oldVal) {
        appSettings[type][index] = newVal.trim();
        renderMetadataManagers();
        saveSettings();
        notify('✅ Item updated', NOTIFICATION_TYPES.SUCCESS);
    }
}

function populateAccountFormDropdowns() {
    const catSelect = document.getElementById('formCategory');
    const statusSelect = document.getElementById('formStatus');
    const critSelect = document.getElementById('formCriticality');

    if (catSelect) {
        const current = catSelect.value;
        catSelect.innerHTML =
            '<option value="">Select Category</option>' +
            (appSettings.categories || [])
                .map((c) => `<option value="${c}">${c}</option>`)
                .join('');
        catSelect.value = current;
    }
    if (statusSelect) {
        const current = statusSelect.value;
        statusSelect.innerHTML =
            '<option value="">Select Status</option>' +
            (appSettings.statuses || []).map((s) => `<option value="${s}">${s}</option>`).join('');
        statusSelect.value = current;
    }
    if (critSelect) {
        const current = critSelect.value;
        critSelect.innerHTML =
            '<option value="">Select Level</option>' +
            (appSettings.criticalities || [])
                .map((c) => `<option value="${c}">${c}</option>`)
                .join('');
        critSelect.value = current;
    }
}

function populateTemplateDropdown() {
    const presetSelect = document.getElementById('formPreset');
    if (!presetSelect) return;

    if (typeof ACCOUNT_TEMPLATES === 'undefined') return;

    // Keep the first default option
    presetSelect.innerHTML = '<option value="">Select a preset...</option>';

    ACCOUNT_TEMPLATES.forEach((tpl, index) => {
        const opt = document.createElement('option');
        opt.value = index;
        opt.textContent = `${tpl.type === 'income' ? '📈' : '📉'} ${tpl.name}`;
        presetSelect.appendChild(opt);
    });
}

function applyPreset() {
    const presetSelect = document.getElementById('formPreset');
    const index = presetSelect.value;
    if (index === '') return;

    if (typeof ACCOUNT_TEMPLATES === 'undefined') return;
    const tpl = ACCOUNT_TEMPLATES[index];

    // Auto-fill fields
    if (formService) formService.value = tpl.name;
    if (formType) formType.value = tpl.type;

    // Handle Category - check if exists, if not default to 'Other' or add it?
    // Let's try to match it.
    if (formCategory) {
        // We need to check if the category exists in the dropdown (which comes from appSettings)
        const options = Array.from(formCategory.options).map((o) => o.value);
        if (options.includes(tpl.category)) {
            formCategory.value = tpl.category;
        } else {
            // If template category is missing from user settings, default to 'Other' or first option
            // Or better: auto-add it to temporary state? No, stick to existing list.
            formCategory.value = 'Other';
            notify(
                `Category "${tpl.category}" not found in your list. Defaulted to "Other".`,
                NOTIFICATION_TYPES.INFO
            );
        }
    }

    if (formCriticality) {
        // Similar check for priority
        const options = Array.from(formCriticality.options).map((o) => o.value);
        if (options.includes(tpl.priority)) {
            formCriticality.value = tpl.priority;
        }
    }
}

/**
 * Applies the current application settings to the system.
 * Updates theme, timeout logic, and UI preferences.
 */
function applySettings() {
    // 1. Apply Theme
    if (appSettings.theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
    }

    // 2. Apply Primary Color
    document.documentElement.style.setProperty('--color-primary', appSettings.primaryColor);

    // 3. Update Timeline Currency (in-memory)
    TIMELINE_CONFIG.currency = appSettings.currency;

    // 4. Update dynamic UI elements
    renderMetadataManagers();
    populateAccountFormDropdowns();

    // 5. Sync with Server
    fetch(`${window.location.origin}/api/settings/system`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            timeout: appSettings.heartbeatTimeout,
            enabled: appSettings.autoShutdown,
        }),
    }).catch((err) => console.error('Failed to sync system settings:', err));
}

async function saveSettings() {
    try {
        await saveToIndexedDB(DB_CONFIG.stores.settings, appSettings, 'appSettings');
    } catch (err) {
        console.error('Error saving settings:', err);
    }
}

// Data Management Functions

function exportData() {
    fetch(API_URL)
        .then((res) => res.json())
        .then((data) => {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            notify('✅ Backup exported successfully!', NOTIFICATION_TYPES.SUCCESS);
        })
        .catch((err) => notify('❌ Export failed', NOTIFICATION_TYPES.ERROR));
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = JSON.parse(e.target.result);
            // Quick validation
            if (!data.accounts || !data.profile) throw new Error('Invalid backup format');

            // Overwrite server data
            const stores = Object.keys(data);
            const promises = stores.map((store) => saveToIndexedDB(store, data[store]));

            Promise.all(promises).then(() => {
                notify('✅ Data imported! Reloading...', NOTIFICATION_TYPES.SUCCESS);
                setTimeout(() => location.reload(), 1500);
            });
        } catch (err) {
            notify('❌ Invalid JSON file', NOTIFICATION_TYPES.ERROR);
        }
    };
    reader.readAsText(file);
}

function showFactoryResetModal() {
    const modal = document.getElementById('resetModal');
    if (modal) modal.classList.add('active');
}

function closeResetModal() {
    const modal = document.getElementById('resetModal');
    if (modal) modal.classList.remove('active');
}

function confirmFactoryReset() {
    const includeSeed = document.getElementById('includeSeedData').checked;

    // Default empty state
    const emptyData = {
        profile: { cards: [] },
        timeline: { months: [], startingBalance: 0 },
        settings: DEFAULT_SETTINGS,
    };

    const accountsToSave = includeSeed ? convertAccountsToObjects(SEED_DATA) : [];

    // Load seed cards if includeSeed is checked
    const cardsToSave = includeSeed
        ? [
              {
                  id: 'card_1769082468127',
                  type: 'adult',
                  emoji: '👨',
                  displayName: 'Dad',
                  fullName: 'Abir',
                  dateOfBirth: '1990-09-26',
                  job: 'Software Consultant and Technical Support Specialist',
              },
              {
                  id: 'card_1769082534972',
                  type: 'pet',
                  emoji: '🐕',
                  displayName: 'Dog',
                  fullName: 'Nuka',
                  dateOfBirth: '2023-03-01',
                  breed: 'German Shepherd/Border Collie',
              },
          ]
        : [];

    // Load seed timeline if includeSeed is checked
    const timelineToSave = includeSeed
        ? {
              startingBalance: 100,
              months: [
                  {
                      id: '2025-January',
                      year: 2025,
                      month: 'January',
                      display: '2025 - January',
                      income: 1800,
                      expenses: 2000,
                      isLocked: false,
                  },
                  {
                      id: '2025-February',
                      year: 2025,
                      month: 'February',
                      display: '2025 - February',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2025-March',
                      year: 2025,
                      month: 'March',
                      display: '2025 - March',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2025-April',
                      year: 2025,
                      month: 'April',
                      display: '2025 - April',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2025-May',
                      year: 2025,
                      month: 'May',
                      display: '2025 - May',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2025-June',
                      year: 2025,
                      month: 'June',
                      display: '2025 - June',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2025-July',
                      year: 2025,
                      month: 'July',
                      display: '2025 - July',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2025-August',
                      year: 2025,
                      month: 'August',
                      display: '2025 - August',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2025-September',
                      year: 2025,
                      month: 'September',
                      display: '2025 - September',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2025-October',
                      year: 2025,
                      month: 'October',
                      display: '2025 - October',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2025-November',
                      year: 2025,
                      month: 'November',
                      display: '2025 - November',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2025-December',
                      year: 2025,
                      month: 'December',
                      display: '2025 - December',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-January',
                      year: 2026,
                      month: 'January',
                      display: '2026 - January',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-February',
                      year: 2026,
                      month: 'February',
                      display: '2026 - February',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-March',
                      year: 2026,
                      month: 'March',
                      display: '2026 - March',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-April',
                      year: 2026,
                      month: 'April',
                      display: '2026 - April',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-May',
                      year: 2026,
                      month: 'May',
                      display: '2026 - May',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-June',
                      year: 2026,
                      month: 'June',
                      display: '2026 - June',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-July',
                      year: 2026,
                      month: 'July',
                      display: '2026 - July',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-August',
                      year: 2026,
                      month: 'August',
                      display: '2026 - August',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-September',
                      year: 2026,
                      month: 'September',
                      display: '2026 - September',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-October',
                      year: 2026,
                      month: 'October',
                      display: '2026 - October',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-November',
                      year: 2026,
                      month: 'November',
                      display: '2026 - November',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2026-December',
                      year: 2026,
                      month: 'December',
                      display: '2026 - December',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2027-January',
                      year: 2027,
                      month: 'January',
                      display: '2027 - January',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2027-February',
                      year: 2027,
                      month: 'February',
                      display: '2027 - February',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2027-March',
                      year: 2027,
                      month: 'March',
                      display: '2027 - March',
                      income: 1800,
                      expenses: 1500,
                      isLocked: false,
                  },
                  {
                      id: '2027-April',
                      year: 2027,
                      month: 'April',
                      display: '2027 - April',
                      income: 1700,
                      expenses: 1140,
                      isLocked: false,
                  },
                  {
                      id: '2027-May',
                      year: 2027,
                      month: 'May',
                      display: '2027 - May',
                      income: 1700,
                      expenses: 1140,
                      isLocked: false,
                  },
                  {
                      id: '2027-June',
                      year: 2027,
                      month: 'June',
                      display: '2027 - June',
                      income: 1700,
                      expenses: 1140,
                      isLocked: false,
                  },
                  {
                      id: '2027-July',
                      year: 2027,
                      month: 'July',
                      display: '2027 - July',
                      income: 1700,
                      expenses: 1140,
                      isLocked: false,
                  },
                  {
                      id: '2027-August',
                      year: 2027,
                      month: 'August',
                      display: '2027 - August',
                      income: 1700,
                      expenses: 1140,
                      isLocked: false,
                  },
                  {
                      id: '2027-September',
                      year: 2027,
                      month: 'September',
                      display: '2027 - September',
                      income: 1700,
                      expenses: 1140,
                      isLocked: false,
                  },
                  {
                      id: '2027-October',
                      year: 2027,
                      month: 'October',
                      display: '2027 - October',
                      income: 1700,
                      expenses: 1140,
                      isLocked: false,
                  },
                  {
                      id: '2027-November',
                      year: 2027,
                      month: 'November',
                      display: '2027 - November',
                      income: 1700,
                      expenses: 1140,
                      isLocked: false,
                  },
                  {
                      id: '2027-December',
                      year: 2027,
                      month: 'December',
                      display: '2027 - December',
                      income: 1700,
                      expenses: 1140,
                      isLocked: false,
                  },
              ],
          }
        : { months: [], startingBalance: 0 };

    Promise.all([
        saveToIndexedDB(DB_CONFIG.stores.accounts, accountsToSave, 'allAccounts'),
        saveToIndexedDB(DB_CONFIG.stores.profile, cardsToSave, 'cards'),
        saveToIndexedDB(DB_CONFIG.stores.timeline, timelineToSave, 'timelineData'),
        saveToIndexedDB(DB_CONFIG.stores.goals, [], 'goals'),
        saveToIndexedDB(DB_CONFIG.stores.settings, DEFAULT_SETTINGS, 'appSettings'),
    ]).then(() => {
        notify('✅ Factory reset complete! Reloading...', NOTIFICATION_TYPES.SUCCESS);
        setTimeout(() => location.reload(), 1500);
    });
}
const SEED_DATA = [
    [1, 'Primary Salary', 'Productivity & Work', 'income', 3500, 0, 'No', 'Active', 'Critical'],
    [2, 'Google Gemini', 'AI Tools', 'expense', 0, 0, 'No', 'Active', 'Optional'],
    [3, 'Rent', 'Household & Home', 'expense', 1200, 0, 'Yes', 'Active', 'Critical'],
    [4, 'ChatGPT', 'AI Tools', 'expense', 20, 0, 'No', 'Active', 'Optional'],
    [5, 'Naturstrom', 'Utilities & Bills', 'expense', 45, 0, 'Yes', 'Active', 'Important'],
    [6, 'Groceries', 'Food & Dining', 'expense', 400, 0, 'Yes', 'Active', 'Critical'],
];

function downloadCSV() {
    const headers = [
        'ID',
        'Service',
        'Category',
        'Type',
        'MonthlyAmount',
        'AnnualAmount',
        'Status',
        'Criticality',
        'AssignedTo',
    ];
    const rows = accounts.map((a) => {
        let ownerName = 'Unassigned';
        if (a.ownerId) {
            const owner = cards.find((c) => c.id === a.ownerId);
            if (owner) ownerName = owner.displayName;
        }

        return [
            a.id,
            `"${a.name}"`,
            `"${a.category}"`,
            `"${a.type || 'expense'}"`,
            a.monthlyPayment,
            a.annualPayment,
            a.status,
            a.priority,
            `"${ownerName}"`,
        ];
    });

    let csvContent =
        'data:text/csv;charset=utf-8,' +
        headers.join(',') +
        '\n' +
        rows.map((r) => r.join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'balance_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ==================== GOALS MANAGEMENT ====================

function renderGoals() {
    const goalsList = document.getElementById('goalsList');
    if (!goalsList) return;

    goalsList.innerHTML = '';

    if (goals.length === 0) {
        goalsList.innerHTML =
            '<p style="text-align:center; padding: 20px; color: #718096;">No goals set yet. Start dreaming! 🚀</p>';
        return;
    }

    // Get current net flow for ETA logic
    const { totalIncome, totalExpense } = calculateBaseMonthlyValues();
    const netFlow = totalIncome - totalExpense;

    goals.forEach((goal) => {
        const percentage = Math.min(100, Math.max(0, (goal.current / goal.target) * 100));
        const colorClass =
            percentage >= 100 ? 'status-paid' : percentage >= 50 ? 'type-income' : 'type-expense';

        // Calculate ETA
        let etaText = '';
        if (percentage >= 100) {
            etaText = '✅ Goal Reached!';
        } else if (netFlow > 0) {
            const remaining = goal.target - goal.current;
            const months = Math.ceil(remaining / netFlow);
            etaText = `⏳ Est. ready in ${months} month${months > 1 ? 's' : ''}`;
        } else {
            etaText = '⚠️ Increase net flow to save';
        }

        const goalCard = document.createElement('div');
        goalCard.className = 'goal-card';
        goalCard.innerHTML = `
            <div class="goal-header">
                <div>
                    <div class="goal-name">${goal.name}</div>
                    <div class="goal-eta" style="font-size: 11px; color: #64748b; margin-top: 4px;">${etaText}</div>
                </div>
                <div class="goal-actions">
                    <button class="btn-icon-tiny" onclick="editGoal('${goal.id}')">✏️</button>
                    <button class="btn-icon-tiny delete" onclick="deleteGoal('${goal.id}')">🗑️</button>
                </div>
            </div>
            <div class="goal-stats">
                <span>${TIMELINE_CONFIG.currency}${goal.current.toLocaleString()} saved</span>
                <span>Target: ${TIMELINE_CONFIG.currency}${goal.target.toLocaleString()}</span>
            </div>
            <div class="goal-progress-container">
                <div class="goal-progress-bar ${colorClass}" style="width: ${percentage}%"></div>
            </div>
            <div style="text-align: right; font-size: 12px; margin-top: 5px; font-weight: 700; color: #475569;">
                ${percentage.toFixed(1)}%
            </div>
        `;
        goalsList.appendChild(goalCard);
    });
}

let editingGoalId = null;

function addGoal() {
    editingGoalId = null;
    const modal = document.getElementById('goalModal');
    const nameInput = document.getElementById('goalName');
    const targetInput = document.getElementById('goalTarget');
    const currentInput = document.getElementById('goalCurrent');

    if (nameInput) nameInput.value = '';
    if (targetInput) targetInput.value = '';
    if (currentInput) currentInput.value = '0';

    if (modal) modal.classList.add('active');
}

function editGoal(id) {
    const goal = goals.find((g) => g.id === id);
    if (!goal) return;

    editingGoalId = id;
    const modal = document.getElementById('goalModal');
    document.getElementById('goalName').value = goal.name;
    document.getElementById('goalTarget').value = goal.target;
    document.getElementById('goalCurrent').value = goal.current;

    if (modal) modal.classList.add('active');
}

function closeGoalModal() {
    document.getElementById('goalModal').classList.remove('active');
    editingGoalId = null;
}

function saveGoal() {
    const nameRaw = document.getElementById('goalName').value.trim();
    const targetRaw = document.getElementById('goalTarget').value;
    const currentRaw = document.getElementById('goalCurrent').value;

    // Sanitize inputs
    const name = sanitizeInput(nameRaw, 100);
    const target = sanitizeNumber(targetRaw, 1, 100000000); // Max 100M
    const current = sanitizeNumber(currentRaw, 0, 100000000);

    if (!name || target <= 0) {
        notify('⚠️ Please enter a valid name and target amount.', NOTIFICATION_TYPES.WARNING);
        return;
    }

    if (name.length < 1) {
        notify('❌ Goal name must not be empty after sanitization', NOTIFICATION_TYPES.ERROR);
        return;
    }

    if (editingGoalId) {
        const index = goals.findIndex((g) => g.id === editingGoalId);
        if (index !== -1) {
            goals[index] = { ...goals[index], name, target, current };
        }
    } else {
        goals.push({
            id: 'goal_' + Date.now(),
            name,
            target,
            current,
            createdAt: new Date().toISOString(),
        });
    }

    saveToIndexedDB(DB_CONFIG.stores.goals, goals, 'goals').then(() => {
        closeGoalModal();
        renderGoals();
        notify('✅ Goal saved successfully!', NOTIFICATION_TYPES.SUCCESS);
    });
}

function deleteGoal(id) {
    if (confirm('Delete this financial goal?')) {
        goals = goals.filter((g) => g.id !== id);
        saveToIndexedDB(DB_CONFIG.stores.goals, goals, 'goals').then(() => {
            renderGoals();
            notify('🗑️ Goal deleted.', NOTIFICATION_TYPES.SUCCESS);
        });
    }
}

// ==================== EVENT LISTENERS ====================

if (saveTimelineBtn) {
    saveTimelineBtn.addEventListener('click', saveTimelineData);
}

// Auto-update Paid status based on costs
if (formMonthlyCost) {
    formMonthlyCost.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (val > 0) formPaid.value = 'Yes';
        else if (formAnnualCost && parseFloat(formAnnualCost.value) === 0) formPaid.value = 'No';
    });
}
if (formAnnualCost) {
    formAnnualCost.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        if (val > 0) formPaid.value = 'Yes';
        else if (formMonthlyCost && parseFloat(formMonthlyCost.value) === 0) formPaid.value = 'No';
    });
}

// ==================== INITIALIZATION ====================

// Check critical dependencies
if (typeof DB_CONFIG === 'undefined') {
    alert('CRITICAL ERROR: Configuration file (config.js) not loaded! Application cannot start.');
    throw new Error('Config missing');
}

initIndexedDB()
    .then(async () => {
        // Load ALL data once at startup to establish authoritative memory state
        try {
            const response = await fetch(API_URL, { cache: 'no-store' });
            if (!response.ok) throw new Error('Failed to load initial data');
            const fullData = await response.json();

            // 1. Process Cards
            const savedCards = fullData[DB_CONFIG.stores.profile]?.cards;
            if (savedCards !== undefined && savedCards !== null) {
                cards = savedCards;
            } else {
                // Load defaults if empty (First run only)
                cards = [
                    {
                        id: 'card_1769082468127',
                        type: 'adult',
                        emoji: '👨',
                        displayName: 'Dad',
                        fullName: 'Abir',
                        dateOfBirth: '1990-09-26',
                        job: 'Software Consultant and Technical Support Specialist',
                    },
                    {
                        id: 'card_1769082534972',
                        type: 'pet',
                        emoji: '🐕',
                        displayName: 'Dog',
                        fullName: 'Nuka',
                        dateOfBirth: '2023-03-01',
                        breed: 'German Shepherd/Border Collie',
                    },
                ];
                await saveToIndexedDB(DB_CONFIG.stores.profile, cards, 'cards');
            }

            // 2. Process Accounts
            const savedAccounts = fullData[DB_CONFIG.stores.accounts];
            if (savedAccounts !== undefined && savedAccounts !== null) {
                accounts = savedAccounts;
            } else {
                // Load defaults if missing (First run only)
                accounts = convertAccountsToObjects(SEED_DATA);
                await saveToIndexedDB(DB_CONFIG.stores.accounts, accounts, 'allAccounts');
            }

            // 3. Process Timeline Overrides
            window.timelineOverrides = fullData[DB_CONFIG.stores.timeline]?.timelineData;

            // 4. Process Goals
            const savedGoals = fullData[DB_CONFIG.stores.goals];
            if (savedGoals && Array.isArray(savedGoals)) {
                goals = savedGoals;
            }

            // 5. Process Settings
            const savedSettings = fullData[DB_CONFIG.stores.settings]?.appSettings;
            if (savedSettings) {
                appSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
            }

            // Establish UI
            renderCards();
            renderAccounts();
            renderGoals();
            updateStats();
            initializeTimelineData();
            applySettings();
        } catch (err) {
            console.error('Initialization error:', err);
            // Re-render empty UI as fallback
            renderCards();
            renderAccounts();
            updateStats();
        }
    })
    .catch((err) => {
        console.error('IndexedDB initialization error:', err);
        // Fallback: use in-memory data
        renderCards();
        renderAccounts();
        updateStats();
    });

// ==================== HEARTBEAT ====================
(function initHeartbeat() {
    const HEARTBEAT_INTERVAL = 5000; // 5 seconds

    // Send heartbeat to server
    function sendHeartbeat() {
        fetch('/api/heartbeat', { method: 'POST' }).catch((err) =>
            console.warn('Heartbeat failed:', err)
        );
    }

    // Notify server when tab closes
    function notifyTabClose() {
        fetch('/api/tab-closed', { method: 'POST' }).catch((err) =>
            console.warn('Tab-close notification failed:', err)
        );
    }

    // Start heartbeat loop
    const heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Listen for tab/window close
    window.addEventListener('beforeunload', () => {
        clearInterval(heartbeatInterval);
        notifyTabClose();
    });

    // Initial heartbeat
    sendHeartbeat();

    console.log('Heartbeat initialized: sending every ' + HEARTBEAT_INTERVAL / 1000 + 's');
})();
