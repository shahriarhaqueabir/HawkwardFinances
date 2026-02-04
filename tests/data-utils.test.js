const test = require('node:test');
const assert = require('node:assert/strict');

const {
    sanitizeString,
    sanitizeNumber,
    normalizeAccount,
    normalizeData,
} = require('../lib/data-utils');

test('sanitizeString removes tags and trims', () => {
    const input = '  <b>Hello</b>  ';
    assert.equal(sanitizeString(input), 'Hello');
});

test('sanitizeNumber clamps and handles NaN', () => {
    assert.equal(sanitizeNumber('abc', 0, 10), 0);
    assert.equal(sanitizeNumber('15', 0, 10), 10);
});

test('normalizeAccount applies defaults and sanitizes fields', () => {
    const account = normalizeAccount({
        id: '5',
        name: '<script>bad</script>Rent',
        category: 'Housing',
        type: 'expense',
        monthlyPayment: '1200',
        annualPayment: '0',
        hasReminder: 'Yes',
        status: 'Active',
        priority: 'Critical',
        ownerId: 'card_1',
    });

    assert.equal(account.id, 5);
    assert.equal(account.name, 'badRent');
    assert.equal(account.monthlyPayment, 1200);
    assert.equal(account.hasReminder, 'Yes');
});

test('normalizeData fills missing sections', () => {
    const normalized = normalizeData({ accounts: [] });
    assert.ok(Array.isArray(normalized.accounts));
    assert.equal(typeof normalized.profile, 'object');
    assert.equal(typeof normalized.timeline, 'object');
    assert.ok(Array.isArray(normalized.goals));
    assert.equal(typeof normalized.settings, 'object');
});
