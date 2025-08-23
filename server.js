import express from 'express';
import bodyParser from 'body-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3003;
const LINKS_FILE = 'links.json';
const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500
};

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// CORS headers
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

/**
 * Initializes the links.json file if it doesn't exist
 * Creates an empty array as the default content
 * @async
 * @function initLinksFile
 * @returns {Promise<void>}
 */
async function initLinksFile() {
    try {
        await fs.access(LINKS_FILE);
    } catch {
        await fs.writeFile(LINKS_FILE, JSON.stringify([]));
    }
}

/**
 * GET /api/links - Retrieves all links from the JSON file
 * @async
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
app.get('/api/links', async (req, res) => {
    try {
        const data = await fs.readFile(LINKS_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error reading links' });
    }
});

/**
 * POST /api/links - Saves an array of links to the JSON file
 * Validates that the input is an array and each link has required fields
 * @async
 * @param {Object} req - Express request object with links array in body
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
app.post('/api/links', async (req, res) => {
    try {
        const links = req.body;
        
        // Validate the input
        if (!Array.isArray(links)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Invalid input: expected array' });
        }
        
        // Validate each link object
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            if (!link || typeof link !== 'object') {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: `Invalid link at index ${i}` });
            }
            if (!link.name || !link.url || !link.category) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ error: `Missing required fields in link at index ${i}` });
            }
        }
        
        await fs.writeFile(LINKS_FILE, JSON.stringify(links, null, 2));
        res.json({ message: 'Links saved successfully' });
    } catch (error) {
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ error: 'Error saving links: ' + error.message });
    }
});

/**
 * GET / - Serves the main homepage HTML file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {void}
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Starts the Express server after initializing the links file
 * @async
 * @function start
 * @returns {Promise<void>}
 */
async function start() {
    await initLinksFile();
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

start();

