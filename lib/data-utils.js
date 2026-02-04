function sanitizeString(value, maxLength = 200) {
    if (!value) return '';
    const str = String(value).trim();
    const withoutTags = str.replace(/<[^>]*>/g, '');
    return withoutTags.slice(0, maxLength);
}

function sanitizeNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const num = parseFloat(value);
    if (Number.isNaN(num)) return min;
    return Math.max(min, Math.min(max, num));
}

function normalizeAccount(account) {
    if (!account || typeof account !== 'object') return null;
    return {
        id: sanitizeNumber(account.id, 0, Number.MAX_SAFE_INTEGER),
        name: sanitizeString(account.name, 100),
        category: sanitizeString(account.category, 100),
        type: sanitizeString(account.type, 20) || 'expense',
        monthlyPayment: sanitizeNumber(account.monthlyPayment, 0, 1000000000),
        annualPayment: sanitizeNumber(account.annualPayment, 0, 1000000000),
        hasReminder: sanitizeString(account.hasReminder, 10) || 'No',
        status: sanitizeString(account.status, 30) || 'Active',
        priority: sanitizeString(account.priority, 30) || 'Important',
        ownerId: account.ownerId ? sanitizeString(account.ownerId, 100) : null,
    };
}

function normalizeData(input) {
    const data = input && typeof input === 'object' ? input : {};
    const accounts = Array.isArray(data.accounts)
        ? data.accounts.map(normalizeAccount).filter(Boolean)
        : [];

    return {
        accounts,
        profile: data.profile && typeof data.profile === 'object' ? data.profile : {},
        timeline: data.timeline && typeof data.timeline === 'object' ? data.timeline : {},
        goals: Array.isArray(data.goals) ? data.goals : [],
        settings: data.settings && typeof data.settings === 'object' ? data.settings : {},
    };
}

module.exports = {
    sanitizeString,
    sanitizeNumber,
    normalizeAccount,
    normalizeData,
};
