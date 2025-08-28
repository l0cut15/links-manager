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
 * Validates a URL format on the server side
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid URL format
 */
function isValidURL(url) {
    if (!url || typeof url !== 'string') return false;
    
    const trimmedUrl = url.trim();
    if (trimmedUrl.length === 0 || trimmedUrl.length > 2048) return false;
    
    try {
        const urlObj = new URL(trimmedUrl);
        return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Validates a link name
 * @param {string} name - The name to validate
 * @returns {boolean} True if valid name
 */
function isValidName(name) {
    if (!name || typeof name !== 'string') return false;
    const trimmedName = name.trim();
    return trimmedName.length > 0 && trimmedName.length <= 100;
}

/**
 * Validates a category
 * @param {string} category - The category to validate
 * @returns {boolean} True if valid category
 */
function isValidCategory(category) {
    const validCategories = ['servers', 'infrastructure', 'media', 'websites'];
    return validCategories.includes(category);
}

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
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                error: 'Invalid input: expected array of links' 
            });
        }
        
        if (links.length > 1000) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                error: 'Too many links: maximum 1000 allowed' 
            });
        }
        
        // Track names for duplicate checking
        const nameTracker = new Map();
        
        // Validate each link object
        for (let i = 0; i < links.length; i++) {
            const link = links[i];
            
            if (!link || typeof link !== 'object') {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    error: `Invalid link object at index ${i}` 
                });
            }
            
            // Check for required fields
            if (!link.name || !link.url || !link.category || 
                typeof link.name !== 'string' || link.name.trim() === '' ||
                typeof link.url !== 'string' || link.url.trim() === '' ||
                typeof link.category !== 'string' || link.category.trim() === '') {
                const missing = [];
                if (!link.name || typeof link.name !== 'string' || link.name.trim() === '') missing.push('name');
                if (!link.url || typeof link.url !== 'string' || link.url.trim() === '') missing.push('url');
                if (!link.category || typeof link.category !== 'string' || link.category.trim() === '') missing.push('category');
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    error: `Missing or empty required fields in link at index ${i}: ${missing.join(', ')}` 
                });
            }
            
            // Validate name
            if (!isValidName(link.name)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    error: `Invalid name in link at index ${i}: must be 1-100 characters` 
                });
            }
            
            // Check for duplicate names
            const nameLower = link.name.toLowerCase();
            if (nameTracker.has(nameLower)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    error: `Duplicate link name at index ${i}: "${link.name}"` 
                });
            }
            nameTracker.set(nameLower, i);
            
            // Validate URL
            if (!isValidURL(link.url)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    error: `Invalid URL in link at index ${i}: must be a valid HTTP/HTTPS URL` 
                });
            }
            
            // Validate category
            if (!isValidCategory(link.category)) {
                return res.status(HTTP_STATUS.BAD_REQUEST).json({ 
                    error: `Invalid category in link at index ${i}: must be 'servers', 'infrastructure', 'media', or 'websites'` 
                });
            }
        }
        
        await fs.writeFile(LINKS_FILE, JSON.stringify(links, null, 2));
        res.json({ message: 'Links saved successfully' });
    } catch (error) {
        console.error('Error saving links:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            error: 'Internal server error while saving links' 
        });
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

