const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { normalizeAccount, normalizeData } = require('./lib/data-utils');
// const open = require('open'); // Removed to use dynamic import

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}
const LOCAL_IP = getLocalIp();

const app = express();
const PORT = 3000;
const HOST = '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'data.json');
const BACKUP_FILE = path.join(DATA_DIR, 'data.backup.json');
const IMPORT_SAFETY_FILE = path.join(DATA_DIR, 'data.import_safety.json');
const ALLOWED_STORES = new Set(['accounts', 'profile', 'timeline', 'goals', 'settings']);

let writeQueue = Promise.resolve();

function queueWrite(data) {
    const payload = JSON.stringify(data, null, 2);
    writeQueue = writeQueue.then(() => fs.promises.writeFile(DATA_FILE, payload));
    return writeQueue;
}

// --- AUTO-SHUTDOWN LOGIC ---
let shutdownTimer;
let SHUTDOWN_TIMEOUT = 10000; // 10 seconds after last heartbeat (Standardized)
let AUTO_SHUTDOWN_ENABLED = true;

const IS_CI = process.env.CI === 'true';

function resetShutdownTimer() {
    if (shutdownTimer) clearTimeout(shutdownTimer);
    if (!AUTO_SHUTDOWN_ENABLED || IS_CI) return;

    shutdownTimer = setTimeout(() => {
        console.log('No active tab detected. Shutting down...');
        process.exit(0);
    }, SHUTDOWN_TIMEOUT);
}

// Start the timer immediately (unless in CI)
if (!IS_CI) {
    resetShutdownTimer();
}

// ---------------------------

// Middleware
const ALLOWED_ORIGINS = new Set([
    `http://localhost:${PORT}`,
    `http://127.0.0.1:${PORT}`,
]);

app.use(
    cors({
        origin(origin, callback) {
            if (!origin) return callback(null, true);
            if (ALLOWED_ORIGINS.has(origin)) return callback(null, true);
            return callback(new Error('Not allowed by CORS'));
        },
    })
);

// Basic same-origin enforcement for write operations
app.use((req, res, next) => {
    const isWrite = req.method !== 'GET';
    if (!isWrite) return next();

    const origin = req.headers.origin;
    if (!origin || ALLOWED_ORIGINS.has(origin)) return next();

    return res.status(403).json({ error: 'Forbidden origin' });
});

app.use(bodyParser.json({ limit: '50mb' })); // Increased limit just in case
app.use(express.static(PUBLIC_DIR)); // Serve static files from public directory

// Initialize data.json if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        accounts: [],
        profile: {},
        timeline: {},
        goals: [],
        settings: {},
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// --- AUTO-BACKUP ON STARTUP ---
try {
    if (fs.existsSync(DATA_FILE)) {
        const backupPath = BACKUP_FILE;
        fs.copyFileSync(DATA_FILE, backupPath);
        console.log('✅ Data backup created: data/data.backup.json');
    }
} catch (err) {
    console.warn('⚠️ Failed to create backup:', err.message);
}

// Routes

// Get all data
app.get('/api/data', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);
        const normalized = normalizeData(parsed);
        res.json(normalized);
    } catch (err) {
        console.error('Error reading/parsing data:', err);

        // Attempt to restore from backup
        const backupPath = BACKUP_FILE;
        if (fs.existsSync(backupPath)) {
            try {
                console.log('⚠️ Data corrupted. Attempting to restore from backup...');
                const backup = fs.readFileSync(backupPath, 'utf8');
                const backupData = JSON.parse(backup);

                // Restore the backup to main file
                fs.writeFileSync(DATA_FILE, backup);
                console.log('✅ Successfully restored from backup');

                res.json(backupData);
            } catch (backupErr) {
                console.error('❌ Backup restoration failed:', backupErr);
                res.status(500).json({
                    error: 'Data corrupted and backup restoration failed',
                    details: backupErr.message,
                });
            }
        } else {
            res.status(500).json({
                error: 'Data corrupted and no backup available',
                details: err.message,
            });
        }
    }
});

// Save data (store-based)
app.post('/api/data', async (req, res) => {
    const { storeName, data, key } = req.body;

    if (!storeName) {
        return res.status(400).json({ error: 'storeName is required' });
    }

    if (!ALLOWED_STORES.has(storeName)) {
        return res.status(400).json({ error: 'Invalid storeName' });
    }

    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf8');
        let dbData;
        try {
            dbData = JSON.parse(fileContent);
        } catch (e) {
            dbData = {};
        }

        // Initialize store if missing
        if (!dbData[storeName]) {
            if (storeName === 'accounts') dbData[storeName] = [];
            else dbData[storeName] = {};
        }

        if (storeName === 'accounts') {
            if (Array.isArray(data)) {
                dbData[storeName] = data.map(normalizeAccount).filter(Boolean);
            } else {
                dbData[storeName] = [];
            }
        } else if (storeName === 'profile' || storeName === 'timeline') {
            if (key) {
                if (!dbData[storeName]) dbData[storeName] = {};
                dbData[storeName][key] = data;
            } else {
                dbData[storeName] = data;
            }
        } else {
            dbData[storeName] = data;
        }

        await queueWrite(dbData);
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving data:', err);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Import data (Overwrite entire database)
app.post('/api/import', async (req, res) => {
    try {
        const newData = req.body;

        // Basic validation to ensure it's a valid finance app snapshot
        if (!newData || typeof newData !== 'object') {
            return res.status(400).json({ error: 'Invalid JSON data' });
        }

        // Create safety backup before overwriting
        const safetyBackupPath = IMPORT_SAFETY_FILE;
        if (fs.existsSync(DATA_FILE)) {
            fs.copyFileSync(DATA_FILE, safetyBackupPath);
            console.log('🛡️ Import safety backup created: data/data.import_safety.json');
        }

        // Write to disk
        const normalized = normalizeData(newData);
        await queueWrite(normalized);
        console.log('🔄 Database restored from import');

        res.json({ message: 'Database restored successfully (Safety backup created)' });
    } catch (err) {
        console.error('Import Error:', err);
        res.status(500).json({ error: 'Failed to import data' });
    }
});

// Heartbeat endpoint
app.post('/api/heartbeat', (req, res) => {
    resetShutdownTimer();
    res.json({ status: 'alive' });
});

// Settings endpoint
app.post('/api/settings/system', (req, res) => {
    const { timeout, enabled } = req.body;

    if (timeout !== undefined) {
        SHUTDOWN_TIMEOUT = parseInt(timeout) * 1000;
        console.log(`System: Shutdown timeout updated to ${timeout}s`);
    }

    if (enabled !== undefined) {
        AUTO_SHUTDOWN_ENABLED = enabled;
        console.log(`System: Auto-shutdown ${enabled ? 'ENABLED' : 'DISABLED'}`);
    }

    resetShutdownTimer();
    res.json({
        success: true,
        timeout: SHUTDOWN_TIMEOUT / 1000,
        enabled: AUTO_SHUTDOWN_ENABLED,
    });
});

// Tab closed endpoint (missing!)
app.post('/api/tab-closed', (req, res) => {
    console.log(
        'Tab closed signal received. Server will shutdown in ' + SHUTDOWN_TIMEOUT / 1000 + 's'
    );
    // Timer already started by heartbeat stopping
    res.json({ acknowledged: true });
});

// Server startup
app.listen(PORT, HOST, async () => {
    console.log('\x1b[32m%s\x1b[0m', '--------------------------------------------------');
    console.log('\x1b[32m%s\x1b[0m', '🚀 Hawkward Server is running!');
    console.log('\x1b[32m%s\x1b[0m', '--------------------------------------------------');
    console.log(`Local Access:   http://localhost:${PORT}`);
    console.log(`Network Access: disabled (bound to ${HOST})`);
    console.log('--------------------------------------------------');
    console.log(
        `Auto-shutdown active: Server will exit ${SHUTDOWN_TIMEOUT / 1000}s after tab is closed.`
    );

    if (!IS_CI) {
        try {
            const open = (await import('open')).default;
            await open(`http://localhost:${PORT}`);
        } catch (err) {
            console.error('Failed to open browser:', err);
            console.log('Please open your browser manually at http://localhost:3000');
        }
    } else {
        console.log('CI environment detected: Skipping browser launch.');
    }
});


