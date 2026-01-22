const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
// const open = require('open'); // Removed to use dynamic import

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

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
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading data:', err);
            return res.status(500).json({ error: 'Failed to read data' });
        }
        try {
            res.json(JSON.parse(data));
        } catch (parseError) {
            console.error('Error parsing data:', parseError);
            res.status(500).json({ error: 'Failed to parse data' });
        }
    });
});

// Save data (store-based)
// Expects: { storeName: string, data: any, key: string (optional) }
app.post('/api/data', (req, res) => {
    const { storeName, data, key } = req.body;

    if (!storeName) {
        return res.status(400).json({ error: 'storeName is required' });
    }

    fs.readFile(DATA_FILE, 'utf8', (readErr, fileContent) => {
        if (readErr) {
            return res.status(500).json({ error: 'Failed to read database' });
        }

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

        // Update logic mimicking the frontend intentions
        // If it's the 'accounts' store, we usually replace the whole list or specific items.
        // Based on app.js usage, it seems to pass the ENTIRE accounts array.
        // So if storeName is 'accounts', we just replace it if data is an array.

        if (storeName === 'accounts') {
            // If key is 'allAccounts', it means we are saving the whole list
            if (Array.isArray(data)) {
                dbData[storeName] = data;
            } else {
                // Fallback or specific item logic (not currently used by app.js apparently)
                // But let's assume we might need to handle single item updates later?
                // For now, app.js sends the whole array.
                dbData[storeName] = data;
            }
        } else if (storeName === 'profile' || storeName === 'timeline') {
            // These use keys inside the store
            if (key) {
                if (!dbData[storeName]) dbData[storeName] = {};
                dbData[storeName][key] = data;
            } else {
                dbData[storeName] = data;
            }
        } else {
            // Generic fallback
            dbData[storeName] = data;
        }

        fs.writeFile(DATA_FILE, JSON.stringify(dbData, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).json({ error: 'Failed to save data' });
            }
            res.json({ success: true });
        });
    });
});

// Invoke dynamic import inside the async function
app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);
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
