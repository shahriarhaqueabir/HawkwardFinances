/**
 * Financial Dashboard - Application Logic
 * Handles all business logic, data management, and UI interactions
 */

// ==================== STATE MANAGEMENT ====================
let db;
let editingAccountIndex = null;
let editingCardId = null;
let currentCustomFields = [];

// Cards Data - flexible card system
let cards = [];

// Accounts Data - 87 accounts
let accounts = [
    [1, "Elster", "Government & Legal", "GOV", 0, 0, "No", "Active", "Critical"],
    [2, "BundID", "Government & Legal", "GOV", 0, 0, "No", "Active", "Critical"],
    [3, "Rundfunkbeitrag", "Government & Legal", "GOV", 18.36, 220.32, "Yes", "Active", "Critical"],
    [4, "SCHUFA", "Government & Legal", "GOV", 0, 0, "No", "Active", "Essential"],
    [5, "Rentenversicherung", "Government & Legal", "GOV", 0, 0, "No", "Active", "Important"],
    [6, "Finanzamt Portal", "Government & Legal", "GOV", 0, 0, "No", "Active", "Critical"],
    [7, "Bürgeramt Online", "Government & Legal", "GOV", 0, 0, "No", "Active", "Essential"],
    [8, "Bundesagentur für Arbeit", "Government & Legal", "GOV", 0, 0, "No", "Active", "Critical"],
    [9, "TK (Techniker Krankenkasse)", "Health & Insurance", "FIN", 0, 0, "No", "Active", "Critical"],
    [10, "DoctoLib", "Health & Insurance", "CONS", 0, 0, "No", "Active", "Important"],
    [11, "Dog Insurance", "Health & Insurance", "FIN", 35, 420, "Yes", "Active", "Important"],
    [12, "Deutsche Bank", "Banking & Finance", "FIN", 0, 0, "No", "Active", "Essential"],
    [13, "DKB", "Banking & Finance", "FIN", 0, 0, "No", "Planned", "Essential"],
    [14, "PayPal", "Banking & Finance", "FIN", 0, 0, "No", "Active", "Important"],
    [15, "Klarna", "Banking & Finance", "FIN", 0, 0, "No", "Active", "Important"],
    [16, "Mobile Provider", "Telecommunications", "CONS", 6.99, 83.88, "Yes", "Active", "Essential"],
    [17, "Glasfaser Internet", "Telecommunications", "CONS", 50, 600, "Yes", "Active", "Critical"],
    [18, "Naturstrom", "Household & Home", "CONS", 50, 600, "Yes", "Active", "Essential"],
    [19, "Housing Provider", "Household & Home", "CONS", 917, 11004, "Yes", "Active", "Critical"],
    [20, "Check24", "Telecommunications", "CONS", 0, 0, "No", "Active", "Optional"],
    [21, "Verivox", "Telecommunications", "CONS", 0, 0, "No", "Active", "Optional"],
    [22, "Amazon", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Important"],
    [23, "Amazon Prime", "Shopping & E-Commerce", "CONS", 8.99, 107.88, "Yes", "Active", "Optional"],
    [24, "Wolt Plus", "Shopping & E-Commerce", "CONS", 4.99, 59.88, "Yes", "Active", "Optional"],
    [25, "eBay", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Important"],
    [26, "Kleinanzeigen", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Important"],
    [27, "Rossmann", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Optional"],
    [28, "Aldi", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Important"],
    [29, "Otto.de", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Optional"],
    [30, "Kaufland", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Optional"],
    [31, "IKEA Family", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Optional"],
    [32, "DM", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Optional"],
    [33, "REWE", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Optional"],
    [34, "Zalando", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Optional"],
    [35, "MediaMarkt/Saturn", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Active", "Optional"],
    [36, "Too Good To Go", "Shopping & E-Commerce", "CONS", 0, 0, "No", "Planned", "Optional"],
    [37, "Google Account #1", "Productivity & Work", "CONS", 0, 0, "No", "Dormant", "Important"],
    [38, "Google Account #2", "Productivity & Work", "CONS", 0, 0, "No", "Active", "Important"],
    [39, "Hotmail/Outlook.com", "Productivity & Work", "CONS", 0, 0, "No", "Dormant", "Important"],
    [40, "Notion", "Productivity & Work", "CONS", 0, 0, "No", "Planned", "Essential"],
    [41, "Figma", "Productivity & Work", "CONS", 0, 0, "No", "Active", "Important"],
    [42, "Canva", "Productivity & Work", "CONS", 0, 0, "No", "Active", "Important"],
    [43, "Dropbox", "Cloud Storage & Backup", "CONS", 0, 0, "No", "Active", "Optional"],
    [44, "Microsoft OneDrive", "Cloud Storage & Backup", "CONS", 0, 0, "No", "Active", "Important"],
    [45, "Apple iCloud", "Cloud Storage & Backup", "CONS", 0, 0, "No", "Active", "Optional"],
    [46, "Bitwarden", "Developer Tools", "FIN", 0, 0, "No", "Active", "Critical"],
    [47, "Microsoft Authenticator", "Developer Tools", "FIN", 0, 0, "No", "Active", "Critical"],
    [48, "Crunchyroll", "Entertainment & Streaming", "CONS", 5.83, 70, "Yes", "Active", "Optional"],
    [49, "YouTube", "Entertainment & Streaming", "CONS", 0, 0, "No", "Active", "Important"],
    [50, "ARD Mediathek", "Entertainment & Streaming", "CONS", 0, 0, "No", "Active", "Optional"],
    [51, "ZDF Mediathek", "Entertainment & Streaming", "CONS", 0, 0, "No", "Active", "Optional"],
    [52, "Spotify", "Entertainment & Streaming", "CONS", 0, 0, "No", "Cancelled", "Optional"],
    [53, "Netflix", "Entertainment & Streaming", "CONS", 0, 0, "No", "Cancelled", "Optional"],
    [54, "Steam", "Gaming", "CONS", 0, 0, "No", "Active", "Optional"],
    [55, "Epic Games Store", "Gaming", "CONS", 0, 0, "No", "Active", "Optional"],
    [56, "Ubisoft Connect", "Gaming", "CONS", 0, 0, "No", "Active", "Optional"],
    [57, "GOG.com", "Gaming", "CONS", 0, 0, "No", "Active", "Optional"],
    [58, "GitHub", "Developer Tools", "CONS", 0, 0, "No", "Active", "Essential"],
    [59, "GitLab", "Developer Tools", "CONS", 0, 0, "No", "Active", "Important"],
    [60, "Bitbucket", "Developer Tools", "CONS", 0, 0, "No", "Active", "Optional"],
    [61, "Docker Hub", "Developer Tools", "CONS", 0, 0, "No", "Active", "Important"],
    [62, "Postman", "Developer Tools", "CONS", 0, 0, "No", "Active", "Important"],
    [63, "Bruno", "Developer Tools", "CONS", 0, 0, "No", "Active", "Optional"],
    [64, "Insomnia", "Developer Tools", "CONS", 0, 0, "No", "Active", "Optional"],
    [65, "Visual Studio Code", "Developer Tools", "CONS", 0, 0, "No", "Active", "Essential"],
    [66, "JetBrains", "Developer Tools", "CONS", 13.9, 166.8, "Yes", "Cancelled", "Optional"],
    [67, "Selenium Grid", "Developer Tools", "CONS", 0, 0, "No", "Active", "Important"],
    [68, "Cypress", "Developer Tools", "CONS", 0, 0, "No", "Active", "Important"],
    [69, "Jenkins", "Developer Tools", "CONS", 0, 0, "No", "Active", "Important"],
    [70, "GitHub Actions", "Developer Tools", "CONS", 0, 0, "No", "Active", "Important"],
    [71, "Stack Overflow", "Developer Tools", "CONS", 0, 0, "No", "Active", "Important"],
    [72, "ChatGPT", "AI Tools", "CONS", 0, 0, "No", "Active", "Optional"],
    [73, "Claude", "AI Tools", "CONS", 19, 228, "Yes", "Cancelled", "Optional"],
    [74, "Google Gemini", "AI Tools", "CONS", 0, 0, "No", "Active", "Optional"],
    [75, "WhatsApp", "Social Media", "CONS", 0, 0, "No", "Active", "Important"],
    [76, "Telegram", "Social Media", "CONS", 0, 0, "No", "Active", "Optional"],
    [77, "LinkedIn", "Social Media", "CONS", 0, 0, "No", "Active", "Essential"],
    [78, "Instagram", "Social Media", "CONS", 0, 0, "No", "Active", "Optional"],
    [79, "Facebook", "Social Media", "CONS", 0, 0, "No", "Active", "Optional"],
    [80, "Apple ID", "Social Media", "CONS", 0, 0, "No", "Active", "Important"],
    [81, "Airbnb", "Travel & Booking", "CONS", 0, 0, "No", "Active", "Optional"],
    [82, "Skyscanner", "Travel & Booking", "CONS", 0, 0, "No", "Active", "Optional"],
    [83, "Booking.com", "Travel & Booking", "CONS", 0, 0, "No", "Active", "Optional"],
    [84, "Khan Academy Kids", "Family & Child", "CONS", 0, 0, "No", "Active", "Optional"],
    [85, "Legal Aid (Rechtsschutz)", "Health & Insurance", "FIN", 35, 420, "Yes", "Active", "Essential"],
    [86, "Contents (Hausrat)", "Health & Insurance", "FIN", 10, 120, "Yes", "Active", "Important"],
    [87, "Liability (Haftpflicht)", "Health & Insurance", "FIN", 10, 120, "Yes", "Active", "Essential"]
];

// Convert accounts array to object format
accounts = convertAccountsToObjects(accounts);

// ==================== INDEXEDDB MANAGEMENT ====================

function initIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve();
        };

        request.onupgradeneeded = (e) => {
            const database = e.target.result;

            if (!database.objectStoreNames.contains(DB_CONFIG.stores.accounts)) {
                database.createObjectStore(DB_CONFIG.stores.accounts, { keyPath: 'id', autoIncrement: true });
            }
            if (!database.objectStoreNames.contains(DB_CONFIG.stores.profile)) {
                database.createObjectStore(DB_CONFIG.stores.profile, { keyPath: 'key' });
            }
            if (!database.objectStoreNames.contains(DB_CONFIG.stores.timeline)) {
                database.createObjectStore(DB_CONFIG.stores.timeline, { keyPath: 'key' });
            }
        };
    });
}

function saveToIndexedDB(storeName, data, key = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        let dataToSave = data;

        // For stores with keyPath: 'key', add the key property
        if ((storeName === DB_CONFIG.stores.profile || storeName === DB_CONFIG.stores.timeline) && key) {
            dataToSave = { key, data };
        }

        const request = store.put(dataToSave);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

function loadFromIndexedDB(storeName, key = null) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = key ? store.get(key) : store.getAll();

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const result = request.result;
            // Extract data from wrapped objects if it has 'data' property
            if (result && typeof result === 'object' && result.data &&
                (storeName === DB_CONFIG.stores.profile || storeName === DB_CONFIG.stores.timeline)) {
                resolve(result.data);
            } else {
                resolve(result);
            }
        };
    });
}

// ==================== UTILITY FUNCTIONS ====================

function convertAccountsToObjects(accountsArray) {
    return accountsArray.map(([id, name, category, type, monthlyPayment, annualPayment, hasReminder, status, priority]) => ({
        id,
        name,
        category,
        type,
        monthlyPayment,
        annualPayment,
        hasReminder,
        status,
        priority
    }));
}

function validateInput(value, type = 'string', required = false) {
    if (required && (!value || value.toString().trim() === '')) return false;
    if (type === 'email') return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (type === 'number') return isNaN(parseFloat(value)) ? false : true;
    return true;
}

function notify(message, type = NOTIFICATION_TYPES.INFO) {
    // Simple alert notification - can be enhanced to toast later
    alert(message);
}

function getCriticalityColor(criticality) {
    const colorMap = {
        'Critical': COLORS.criticalBg,
        'Essential': COLORS.essentialBg,
        'Important': COLORS.importantBg,
        'Optional': COLORS.optionalBg
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
const formMonthlyCost = document.getElementById('formMonthlyCost');
const formAnnualCost = document.getElementById('formAnnualCost');
const formPaid = document.getElementById('formPaid');
const formStatus = document.getElementById('formStatus');
const formCriticality = document.getElementById('formCriticality');
const categoryFilter = document.getElementById('categoryFilter');
const saveTimelineBtn = document.getElementById('saveTimelineBtn');

// ==================== NAVIGATION & TAB SWITCHING ====================

navButtons.forEach(btn => {
    btn.addEventListener('click', function () {
        switchTab(this.dataset.tab);
    });
});

function switchTab(tabName) {
    tabContents.forEach(tab => tab.classList.remove('active'));
    navButtons.forEach(btn => btn.classList.remove('active'));

    const tab = document.getElementById(tabName);
    const btn = document.querySelector(`[data-tab="${tabName}"]`);

    if (tab) tab.classList.add('active');
    if (btn) btn.classList.add('active');

    if (pageTitle) pageTitle.textContent = TAB_TITLES[tabName];

    if (tabName === 'analytics') setTimeout(() => initCharts(), 100);
    if (tabName === 'accounts') renderAccounts();
}

// ==================== CARD MANAGEMENT ====================

function renderCards() {
    const cardsGrid = document.getElementById('cardsGrid');
    if (!cardsGrid) return;

    cardsGrid.innerHTML = '';

    if (cards.length === 0) {
        cardsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 40px; color: #718096;">No cards yet. Click "Create New Card" to get started! 📇</p>';
        return;
    }

    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'family-card';
        cardEl.style.borderColor = '#667eea';

        let fieldsHTML = `
            <div style="margin-bottom: 15px;">
                <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600;">Display Name</div>
                <div style="font-size: 15px; font-weight: 600; color: #2d3748;">${card.displayName}</div>
            </div>
            <div style="margin-bottom: 15px;">
                <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600;">Full Name</div>
                <div style="font-size: 15px; font-weight: 600; color: #2d3748;">${card.fullName || '—'}</div>
            </div>
        `;

        if (card.dateOfBirth) {
            fieldsHTML += `
                <div style="margin-bottom: 15px;">
                    <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600;">Date of Birth</div>
                    <div style="font-size: 15px; font-weight: 600; color: #2d3748;">${card.dateOfBirth}</div>
                </div>
            `;
        }

        if (card.customFields && card.customFields.length > 0) {
            card.customFields.forEach(field => {
                fieldsHTML += `
                    <div style="margin-bottom: 15px;">
                        <div style="font-size: 12px; color: #718096; text-transform: uppercase; font-weight: 600;">${field.label}</div>
                        <div style="font-size: 15px; font-weight: 600; color: #2d3748;">${field.value || '—'}</div>
                    </div>
                `;
            });
        }

        cardEl.innerHTML = `
            <div class="family-header">
                <div>
                    <span class="family-title">${card.displayName}</span>
                </div>
                <div>
                    <button class="edit-btn-card" onclick="editCard('${card.id}')" aria-label="Edit ${card.displayName}">✏️ Edit</button>
                    <button class="btn-small delete" onclick="deleteCard('${card.id}')" aria-label="Delete ${card.displayName}" style="margin-left: 8px;">🗑️</button>
                </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                ${fieldsHTML}
            </div>
        `;

        cardsGrid.appendChild(cardEl);
    });
}

function showCreateCardModal() {
    editingCardId = null;
    currentCustomFields = [];
    document.getElementById('cardModalTitle').textContent = '➕ Create New Card';
    document.getElementById('cardDisplayName').value = '';
    document.getElementById('cardFullName').value = '';
    document.getElementById('cardDateOfBirth').value = '';
    document.getElementById('customFieldsContainer').innerHTML = '';
    document.getElementById('cardModal').classList.add('active');
}

function closeCardModal() {
    document.getElementById('cardModal').classList.remove('active');
    editingCardId = null;
    currentCustomFields = [];
}

function addCustomField() {
    const fieldId = `custom_${Date.now()}`;
    currentCustomFields.push({ id: fieldId, label: '', value: '' });
    renderCustomFields();
}

function renderCustomFields() {
    const container = document.getElementById('customFieldsContainer');
    container.innerHTML = '';

    currentCustomFields.forEach((field, index) => {
        const fieldHTML = `
            <div style="border: 1px solid #e0e0e0; padding: 15px; border-radius: 6px; margin-bottom: 10px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                    <div class="form-group">
                        <label>Field Label</label>
                        <input type="text" placeholder="e.g., Phone" value="${field.label}" 
                            onchange="currentCustomFields[${index}].label = this.value">
                    </div>
                    <div class="form-group">
                        <label>Field Value</label>
                        <input type="text" placeholder="Enter value" value="${field.value}" 
                            onchange="currentCustomFields[${index}].value = this.value">
                    </div>
                </div>
                <button class="btn-small delete" onclick="removeCustomField(${index})" style="width: 100%;">🗑️ Remove Field</button>
            </div>
        `;
        container.innerHTML += fieldHTML;
    });
}

function removeCustomField(index) {
    currentCustomFields.splice(index, 1);
    renderCustomFields();
}

function editCard(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) {
        notify('❌ Card not found', NOTIFICATION_TYPES.ERROR);
        return;
    }

    editingCardId = cardId;
    currentCustomFields = JSON.parse(JSON.stringify(card.customFields || []));

    document.getElementById('cardModalTitle').textContent = `✏️ Edit Card: ${card.displayName}`;
    document.getElementById('cardDisplayName').value = card.displayName;
    document.getElementById('cardFullName').value = card.fullName;
    document.getElementById('cardDateOfBirth').value = card.dateOfBirth || '';
    renderCustomFields();
    document.getElementById('cardModal').classList.add('active');
}

function saveCard() {
    const displayName = document.getElementById('cardDisplayName')?.value.trim();
    const fullName = document.getElementById('cardFullName')?.value.trim();
    const dateOfBirth = document.getElementById('cardDateOfBirth')?.value.trim();

    if (!displayName || !fullName) {
        notify('❌ Display Name and Full Name are required', NOTIFICATION_TYPES.ERROR);
        return;
    }

    // Validate custom fields
    const validCustomFields = currentCustomFields.filter(f => f.label && f.value);

    if (editingCardId) {
        // Edit existing card
        const index = cards.findIndex(c => c.id === editingCardId);
        if (index !== -1) {
            cards[index] = {
                ...cards[index],
                displayName,
                fullName,
                dateOfBirth,
                customFields: validCustomFields
            };
        }
    } else {
        // Create new card
        cards.push({
            id: `card_${Date.now()}`,
            displayName,
            fullName,
            dateOfBirth,
            customFields: validCustomFields
        });
    }

    saveToIndexedDB(DB_CONFIG.stores.profile, cards, 'cards')
        .then(() => {
            closeCardModal();
            renderCards();
            notify(editingCardId ? '✅ Card updated successfully!' : '✅ Card created successfully!', NOTIFICATION_TYPES.SUCCESS);
        })
        .catch(err => {
            console.error('Save error:', err);
            notify(MESSAGES.saveError, NOTIFICATION_TYPES.WARNING);
        });
}

function deleteCard(cardId) {
    const card = cards.find(c => c.id === cardId);
    if (!card) {
        notify('❌ Card not found', NOTIFICATION_TYPES.ERROR);
        return;
    }

    if (confirm(`Delete "${card.displayName}"? This cannot be undone.`)) {
        cards = cards.filter(c => c.id !== cardId);

        saveToIndexedDB(DB_CONFIG.stores.profile, cards, 'cards')
            .then(() => {
                renderCards();
                notify(`✅ Card deleted successfully!`, NOTIFICATION_TYPES.SUCCESS);
            })
            .catch(err => {
                console.error('Delete error:', err);
                notify(MESSAGES.saveError, NOTIFICATION_TYPES.WARNING);
            });
    }
}

// ==================== ACCOUNTS MANAGEMENT ====================

function createAccountRow(row, index) {
    const { id, name, category, monthlyPayment, annualPayment, hasReminder, status, priority } = row;
    const tr = document.createElement('tr');
    const criticalityColor = getCriticalityColor(priority);

    tr.innerHTML = `
        <td>${id}</td>
        <td><strong>${name}</strong></td>
        <td>${category}</td>
        <td>${TIMELINE_CONFIG.currency}${monthlyPayment.toFixed(2)}</td>
        <td>${TIMELINE_CONFIG.currency}${annualPayment.toFixed(2)}</td>
        <td>${hasReminder === "Yes" ? "✅" : "❌"}</td>
        <td>${status}</td>
        <td><span style="background: ${criticalityColor}; padding: 4px 8px; border-radius: 4px;">${priority}</span></td>
        <td>
            <button class="btn-small edit" onclick="editAccount(${index})" aria-label="Edit ${name}">✏️</button>
            <button class="btn-small delete" onclick="deleteAccount(${index})" aria-label="Delete ${name}">🗑️</button>
        </td>
    `;
    return tr;
}

function renderAccounts() {
    const tbody = document.getElementById('accountsBody');
    if (!tbody) return;

    tbody.innerHTML = '';
    accounts.forEach((row, index) => {
        tbody.appendChild(createAccountRow(row, index));
    });
}

function toggleAddForm() {
    editingAccountIndex = null;
    modalTitle.textContent = '➕ Add New Account';

    // Manually reset form fields since accountForm is a div, not a form element
    formService.value = '';
    formCategory.value = '';
    formMonthlyCost.value = '0';
    formAnnualCost.value = '0';
    formPaid.value = '';
    formStatus.value = '';
    formCriticality.value = '';

    accountModal.classList.add('active');
}

function editAccount(index) {
    editingAccountIndex = index;
    const { name: service, category, monthlyPayment: monthlyCost, annualPayment: annualCost, hasReminder: paid, status, priority: criticality } = accounts[index];

    modalTitle.textContent = `✏️ Edit Account: ${service}`;
    formService.value = service;
    formCategory.value = category;
    formMonthlyCost.value = monthlyCost;
    formAnnualCost.value = annualCost;
    formPaid.value = paid;
    formStatus.value = status;
    formCriticality.value = criticality;

    accountModal.classList.add('active');
}

function saveAccount() {
    const service = formService?.value.trim();
    const category = formCategory?.value;
    const monthlyCost = parseFloat(formMonthlyCost?.value) || 0;
    const annualCost = parseFloat(formAnnualCost?.value) || 0;
    const paid = formPaid?.value;
    const status = formStatus?.value;
    const criticality = formCriticality?.value;

    if (!validateInput(service, 'string', true) || !category || !paid || !status || !criticality) {
        notify(MESSAGES.fillRequired, NOTIFICATION_TYPES.ERROR);
        return;
    }

    if (!validateInput(monthlyCost, 'number') || !validateInput(annualCost, 'number')) {
        notify(MESSAGES.invalidCosts, NOTIFICATION_TYPES.ERROR);
        return;
    }

    if (editingAccountIndex !== null) {
        // Edit existing
        accounts[editingAccountIndex] = {
            ...accounts[editingAccountIndex],
            name: service,
            category,
            monthlyPayment: monthlyCost,
            annualPayment: annualCost,
            hasReminder: paid,
            status,
            priority: criticality
        };
    } else {
        // Add new
        const newId = Math.max(...accounts.map(a => a.id), 0) + 1;
        accounts.push({
            id: newId,
            name: service,
            category,
            type: 'CONS',
            monthlyPayment: monthlyCost,
            annualPayment: annualCost,
            hasReminder: paid,
            status,
            priority: criticality
        });
    }

    saveToIndexedDB(DB_CONFIG.stores.accounts, accounts, 'allAccounts')
        .then(() => {
            closeAccountModal();
            renderAccounts();
            updateStats();
            notify(MESSAGES.accountSaved, NOTIFICATION_TYPES.SUCCESS);
        })
        .catch(err => {
            console.error('Save error:', err);
            notify(MESSAGES.saveError, NOTIFICATION_TYPES.WARNING);
            closeAccountModal();
            renderAccounts();
            updateStats();
        });
}

function deleteAccount(index) {
    const accountName = accounts[index].name;
    if (confirm(MESSAGES.deleteConfirm(accountName))) {
        accounts.splice(index, 1);

        saveToIndexedDB(DB_CONFIG.stores.accounts, accounts, 'allAccounts')
            .then(() => {
                renderAccounts();
                updateStats();
                notify(MESSAGES.accountDeleted, NOTIFICATION_TYPES.SUCCESS);
            })
            .catch(err => {
                console.error('Delete error:', err);
                renderAccounts();
                updateStats();
            });
    }
}

function closeAccountModal() {
    accountModal.classList.remove('active');
    editingAccountIndex = null;
}

function filterAccounts() {
    const category = categoryFilter.value;
    if (!category) {
        renderAccounts();
        return;
    }

    const filtered = accounts.filter(acc => acc.category === category);
    if (!accountsBody) return;

    accountsBody.innerHTML = '';
    filtered.forEach((row, index) => {
        accountsBody.appendChild(createAccountRow(row, index));
    });
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
        let valueA = a[column];
        let valueB = b[column];

        // Handle different data types
        if (typeof valueA === 'string') {
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

function updateStats() {
    const totalAccounts = accounts.length;
    const paidSubscriptions = accounts.filter(acc => acc.hasReminder === 'Yes').length;
    const monthlyCost = accounts.reduce((sum, acc) => sum + acc.monthlyPayment, 0);
    const annualCost = accounts.reduce((sum, acc) => sum + acc.annualPayment, 0);

    const totalAccountsEl = document.getElementById('totalAccounts');
    const paidSubscriptionsEl = document.getElementById('paidSubscriptions');
    const monthlyCostEl = document.getElementById('monthlyCost');
    const annualCostEl = document.getElementById('annualCost');

    if (totalAccountsEl) totalAccountsEl.textContent = totalAccounts;
    if (paidSubscriptionsEl) paidSubscriptionsEl.textContent = paidSubscriptions;
    if (monthlyCostEl) monthlyCostEl.textContent = `${TIMELINE_CONFIG.currency}${monthlyCost.toFixed(2)}`;
    if (annualCostEl) annualCostEl.textContent = `${TIMELINE_CONFIG.currency}${annualCost.toFixed(2)}`;
}

// ==================== CHARTS ====================

// Store chart instances globally to destroy them before recreating
let categoryChartInstance = null;
let costChartInstance = null;
let criticalityChartInstance = null;
let statusChartInstance = null;

function initCharts() {
    // Destroy existing chart instances
    if (categoryChartInstance) categoryChartInstance.destroy();
    if (costChartInstance) costChartInstance.destroy();
    if (criticalityChartInstance) criticalityChartInstance.destroy();
    if (statusChartInstance) statusChartInstance.destroy();

    const categoryData = {};
    const costData = {};
    const criticalityData = {};
    const statusData = {};

    accounts.forEach(acc => {
        const { category, monthlyPayment, status, priority } = acc;
        categoryData[category] = (categoryData[category] || 0) + 1;
        costData[category] = (costData[category] || 0) + monthlyPayment;
        criticalityData[priority] = (criticalityData[priority] || 0) + 1;
        statusData[status] = (statusData[status] || 0) + 1;
    });

    // Category Chart
    const categoryCtx = document.getElementById('categoryChart');
    if (categoryCtx) {
        categoryChartInstance = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryData),
                datasets: [{
                    data: Object.values(categoryData),
                    backgroundColor: COLORS.chartPalette
                }]
            },
            options: { maintainAspectRatio: false }
        });
    }

    // Cost Chart
    const costCtx = document.getElementById('costChart');
    if (costCtx) {
        costChartInstance = new Chart(costCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(costData).slice(0, 8),
                datasets: [{
                    label: `Monthly Cost (${TIMELINE_CONFIG.currency})`,
                    data: Object.values(costData).slice(0, 8),
                    backgroundColor: COLORS.primary
                }]
            },
            options: { maintainAspectRatio: false }
        });
    }

    // Criticality Chart
    const criticalityCtx = document.getElementById('criticalityChart');
    if (criticalityCtx) {
        criticalityChartInstance = new Chart(criticalityCtx, {
            type: 'polarArea',
            data: {
                labels: Object.keys(criticalityData),
                datasets: [{
                    data: Object.values(criticalityData),
                    backgroundColor: [COLORS.criticalBg, COLORS.essentialBg, COLORS.importantBg, COLORS.optionalBg]
                }]
            },
            options: { maintainAspectRatio: false }
        });
    }

    // Status Chart
    const statusCtx = document.getElementById('statusChart');
    if (statusCtx) {
        statusChartInstance = new Chart(statusCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(statusData),
                datasets: [{
                    data: Object.values(statusData),
                    backgroundColor: [COLORS.success, COLORS.warning, COLORS.info, COLORS.danger]
                }]
            },
            options: { maintainAspectRatio: false }
        });
    }

    // Update stats as well
    updateStats();
}

// ==================== TIMELINE MANAGEMENT ====================

let currentStartingBalance = TIMELINE_CONFIG.defaultStartingBalance;

function getTimelineYears() {
    const currentYear = new Date().getFullYear();
    return [currentYear - 1, currentYear, currentYear + 1];
}

function generateMonthData(years) {
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    let allMonths = [];
    years.forEach(year => {
        months.forEach(month => {
            allMonths.push({
                id: `${year}-${month}`,
                year: year,
                month: month,
                display: `${year} - ${month}`,
                income: TIMELINE_CONFIG.defaultMonthlyIncome,
                expenses: 0
            });
        });
    });
    return allMonths;
}

function initializeTimelineData() {
    const years = getTimelineYears();
    let timelineData = generateMonthData(years);

    // Update title
    const titleEl = document.getElementById('timelineTitle');
    if (titleEl) titleEl.textContent = `${years[0]} - ${years[2]} Financial Timeline`;

    // Update chart title
    const chartTitleEl = document.getElementById('chartTitle');
    if (chartTitleEl) chartTitleEl.textContent = `${years[0]} - ${years[2]} Balance Projection`;

    loadFromIndexedDB(DB_CONFIG.stores.timeline, 'timelineData')
        .then(savedData => {
            if (savedData) {
                // Restore starting balance
                if (savedData.startingBalance !== undefined) {
                    currentStartingBalance = savedData.startingBalance;
                }

                // Merge saved months into generated structure (preserves structure if years change)
                if (savedData.months && Array.isArray(savedData.months)) {
                    timelineData = timelineData.map(item => {
                        const savedItem = savedData.months.find(m => m.id === item.id);
                        if (savedItem) {
                            return {
                                ...item,
                                income: savedItem.income,
                                expenses: savedItem.expenses
                            };
                        }
                        return item;
                    });
                }
            }

            // Set input value
            const balanceInput = document.getElementById('startingBalanceInput');
            if (balanceInput) balanceInput.value = currentStartingBalance;

            renderTimelineTable(timelineData);
            renderBalanceChart(timelineData);
        })
        .catch(err => {
            console.error('Error loading timeline:', err);
            // Set default input value
            const balanceInput = document.getElementById('startingBalanceInput');
            if (balanceInput) balanceInput.value = currentStartingBalance;

            renderTimelineTable(timelineData);
            renderBalanceChart(timelineData);
        });
}

function calculateBalances(timelineData) {
    let runningBalance = currentStartingBalance;
    return timelineData.map(item => {
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
        const balanceClass = item.balance >= 0 ? 'balance-positive' : 'balance-negative';

        // Add divider for new years
        if (item.month === 'January' && index > 0) {
            const separatorRow = document.createElement('tr');
            separatorRow.innerHTML = `<td colspan="4" style="background-color: #e2e8f0; font-weight: bold; padding: 5px 15px;">${item.year}</td>`;
            tbody.appendChild(separatorRow);
        }

        row.innerHTML = `
            <td>${item.display}</td>
            <td>
                <input type="number" data-index="${index}" data-field="income" 
                    value="${item.income}" min="0" step="100" class="timeline-input" 
                    style="width: 100px; padding: 4px; border: 1px solid #e0e0e0; border-radius: 4px;">
            </td>
            <td>
                <input type="number" data-index="${index}" data-field="expenses" 
                    value="${item.expenses}" min="0" step="10" class="timeline-input"
                    style="width: 100px; padding: 4px; border: 1px solid #e0e0e0; border-radius: 4px;">
            </td>
            <td class="${balanceClass}">${TIMELINE_CONFIG.currency}${item.balance.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
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
        console.warn("Row count mismatch during save");
    }

    for (let i = 0; i < currentData.length; i++) {
        // Find inputs for this index
        // Use querySelector to be safe with data attributes we assigned
        const incomeInput = document.querySelector(`input[data-index="${i}"][data-field="income"]`);
        const expenseInput = document.querySelector(`input[data-index="${i}"][data-field="expenses"]`);

        if (incomeInput && expenseInput) {
            currentData[i].income = parseFloat(incomeInput.value) || 0;
            currentData[i].expenses = parseFloat(expenseInput.value) || 0;
        }
    }

    const dataToSave = {
        startingBalance: currentStartingBalance,
        months: currentData
    };

    saveToIndexedDB(DB_CONFIG.stores.timeline, dataToSave, 'timelineData')
        .then(() => {
            notify('✅ 3-Year Timeline saved successfully!', NOTIFICATION_TYPES.SUCCESS);
            renderTimelineTable(currentData);
            renderBalanceChart(currentData);
        })
        .catch(err => {
            console.error('Error saving timeline:', err);
            notify(MESSAGES.saveError, NOTIFICATION_TYPES.ERROR);
        });
}

function renderBalanceChart(timelineData) {
    const withBalances = calculateBalances(timelineData);
    const ctx = document.getElementById('balanceChart');

    if (!ctx) return;

    if (window.balanceChartInstance) {
        window.balanceChartInstance.destroy();
    }

    window.balanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: withBalances.map(m => m.display),
            datasets: [{
                label: `Projected Balance (${TIMELINE_CONFIG.currency})`,
                data: withBalances.map(m => m.balance),
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 2, // Smaller points for dense data
                pointBackgroundColor: '#6366f1'
            }]
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
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: { display: true, text: `Balance (${TIMELINE_CONFIG.currency})` }
                },
                x: {
                    ticks: {
                        maxTicksLimit: 12 // Limit X-axis labels to avoid clutter
                    }
                }
            }
        }
    });
}

// ==================== EVENT LISTENERS ====================

if (saveTimelineBtn) {
    saveTimelineBtn.addEventListener('click', saveTimelineData);
}

// ==================== INITIALIZATION ====================

initIndexedDB()
    .then(async () => {
        try {
            // Load cards
            const savedCards = await loadFromIndexedDB(DB_CONFIG.stores.profile, 'cards');
            if (savedCards && Array.isArray(savedCards) && savedCards.length > 0) {
                cards = savedCards;
            } else {
                await saveToIndexedDB(DB_CONFIG.stores.profile, cards, 'cards');
            }
        } catch (err) {
            console.error('Error loading cards:', err);
        }

        renderCards();

        try {
            // Load accounts
            const savedAccounts = await loadFromIndexedDB(DB_CONFIG.stores.accounts, 'allAccounts');
            if (savedAccounts && Array.isArray(savedAccounts) && savedAccounts.length > 0) {
                accounts = savedAccounts;
            } else {
                await saveToIndexedDB(DB_CONFIG.stores.accounts, accounts, 'allAccounts');
            }
        } catch (err) {
            console.error('Error loading accounts:', err);
        }

        renderAccounts();
        updateStats();
        initializeTimelineData();
    })
    .catch(err => {
        console.error('IndexedDB initialization error:', err);
        // Fallback: use in-memory data
        renderCards();
        renderAccounts();
        updateStats();
    });
