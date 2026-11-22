import express from 'express';
import { promises as fs } from 'fs';
import { createHash } from 'crypto';
import path from 'path';

const app = express();
const PORT = Number(process.env.PORT) || 3003;
const LINKS_FILE = process.env.LINKS_FILE || path.join('data', 'links.json');
const HTTP_STATUS = {
    OK: 200,
    BAD_REQUEST: 400,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
};

// Middleware
app.use(express.json());
app.use(express.static('public'));

/**
 * Initializes the links.json file if it doesn't exist
 * Creates an empty array as the default content
 * @async
 * @function initLinksFile
 * @returns {Promise<void>}
 */
async function initLinksFile() {
    await fs.mkdir(path.dirname(LINKS_FILE), { recursive: true });
    try {
        await fs.access(LINKS_FILE);
    } catch {
        await writeFileAtomic(LINKS_FILE, JSON.stringify([]));
    }
}

/**
 * Computes a version tag for the stored file contents.
 * Clients send it back in If-Match so stale saves can be rejected.
 * @param {string} data - Raw file contents
 * @returns {string} Quoted ETag value
 */
function versionOf(data) {
    return '"' + createHash('sha1').update(data).digest('hex') + '"';
}

/**
 * Writes a file atomically: write to a temp file in the same directory,
 * fsync it, then rename over the target. A crash mid-write leaves the
 * previous file intact instead of a truncated one.
 * @param {string} file - Target path
 * @param {string} data - Contents to write
 */
async function writeFileAtomic(file, data) {
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    const handle = await fs.open(tmp, 'w');
    try {
        await handle.writeFile(data);
        await handle.sync();
    } finally {
        await handle.close();
    }
    try {
        await fs.rename(tmp, file);
    } catch (error) {
        await fs.unlink(tmp).catch(() => {});
        throw error;
    }
}

// Serializes read-check-write cycles so two concurrent POSTs can't both
// pass the version check against the same file contents.
let writeQueue = Promise.resolve();
function withWriteLock(fn) {
    const run = writeQueue.then(fn, fn);
    writeQueue = run.catch(() => {});
    return run;
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
        const links = JSON.parse(data);
        res.set('Cache-Control', 'no-store');
        res.set('ETag', versionOf(data));
        res.json(links);
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
 * Validates that the input is an array and each link has required fields.
 * If an If-Match header is sent, the save is rejected with 409 unless it
 * matches the current file's version (returned as ETag by GET and POST).
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
            const nameLower = link.name.trim().toLowerCase();
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
        
        const output = JSON.stringify(links, null, 2);
        const result = await withWriteLock(async () => {
            // Reject saves based on an outdated copy (e.g. another tab or device saved since)
            const ifMatch = req.get('If-Match');
            if (ifMatch) {
                const current = await fs.readFile(LINKS_FILE, 'utf8');
                if (versionOf(current) !== ifMatch) return { conflict: true };
            }
            await writeFileAtomic(LINKS_FILE, output);
            return { version: versionOf(output) };
        });

        if (result.conflict) {
            return res.status(HTTP_STATUS.CONFLICT).json({
                error: 'Links were changed elsewhere since this page loaded'
            });
        }
        res.set('ETag', result.version);
        res.json({ message: 'Links saved successfully' });
    } catch (error) {
        console.error('Error saving links:', error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({ 
            error: 'Internal server error while saving links' 
        });
    }
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

