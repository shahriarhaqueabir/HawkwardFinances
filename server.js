const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const os = require('os');
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
const DATA_FILE = path.join(__dirname, 'data.json');

// --- AUTO-SHUTDOWN LOGIC ---
let shutdownTimer;
let SHUTDOWN_TIMEOUT = 15000; // Default 15s, now dynamic
let AUTO_SHUTDOWN_ENABLED = true;

function resetShutdownTimer() {
    if (!AUTO_SHUTDOWN_ENABLED) {
        if (shutdownTimer) clearTimeout(shutdownTimer);
        return;
    }

    if (shutdownTimer) clearTimeout(shutdownTimer);
    shutdownTimer = setTimeout(() => {
        console.log(`No heartbeat received for ${SHUTDOWN_TIMEOUT / 1500}s. Shutting down server...`);
        process.exit(0);
    }, SHUTDOWN_TIMEOUT);
}
// ---------------------------

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Increased limit just in case
app.use(express.static(__dirname)); // Serve static files from current directory

// Initialize data.json if it doesn't exist
if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
        accounts: [],
        profile: {},
        timeline: {}
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
}

// Routes

// Get all data
app.get('/api/data', (req, res) => {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (err) {
        console.error('Error reading/parsing data:', err);
        res.status(500).json({ error: 'Failed to process data' });
    }
});

// Save data (store-based)
app.post('/api/data', (req, res) => {
    const { storeName, data, key } = req.body;

    if (!storeName) {
        return res.status(400).json({ error: 'storeName is required' });
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
                dbData[storeName] = data;
            } else {
                dbData[storeName] = data;
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

        fs.writeFileSync(DATA_FILE, JSON.stringify(dbData, null, 2));
        res.json({ success: true });
    } catch (err) {
        console.error('Error saving data:', err);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Heartbeat endpoint to keep server alive
app.post('/api/heartbeat', (req, res) => {
    resetShutdownTimer();
    res.json({ status: 'alive' });
});

// Update system settings (timeout & auto-shutdown)
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
    
    resetShutdownTimer(); // Apply changes immediately
    res.json({ 
        success: true, 
        timeout: SHUTDOWN_TIMEOUT / 1000, 
        enabled: AUTO_SHUTDOWN_ENABLED 
    });
});

// Invoke dynamic import inside the async function
app.listen(PORT, async () => {
    console.log(`\x1b[32m%s\x1b[0m`, `--------------------------------------------------`);
    console.log(`\x1b[32m%s\x1b[0m`, `🚀 Hawkward Server is running!`);
    console.log(`\x1b[32m%s\x1b[0m`, `--------------------------------------------------`);
    console.log(`Local Access:   http://localhost:${PORT}`);
    console.log(`Network Access: http://${LOCAL_IP}:${PORT}`);
    console.log(`--------------------------------------------------`);
    console.log(`Auto-shutdown active: Server will exit ${SHUTDOWN_TIMEOUT / 1000}s after tab is closed.`);
    
    // Start initial shutdown timer
    resetShutdownTimer();

    // Open the browser
    try {
        // Dynamic import for 'open' (ESM-only package)
        const open = (await import('open')).default;
        await open(`http://localhost:${PORT}`);
    } catch (err) {
        console.error('Failed to open browser:', err);
        console.log('Please open your browser manually at http://localhost:3000');
    }
});
