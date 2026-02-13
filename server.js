const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');
const cheerio = require('cheerio');
const multer = require('multer');

const app = express();
const PORT = 3000;

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'Media Content'));
    },
    filename: (req, file, cb) => {
        // Keep original filename but ensure it's safe
        const safeName = file.originalname.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        cb(null, Date.now() + '-' + safeName);
    }
});

const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files from server's directory

// Request logging for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// List of all pages for site-wide syncing
const ALL_PAGES = [
    'index.html', 'admissions.html', 'boarding.html', 'club.html',
    'excursions.html', 'fees.html', 'skillsacquisition.html',
    'sports.html', 'students.html', 'tuition.html'
];

// API endpoint to save section changes
app.post('/api/save-section', async (req, res) => {
    try {
        const { page, section, data } = req.body;

        if (!page || !section || !data) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: page, section, data'
            });
        }

        console.log(`\n📝 Universal Sync Triggered: ${section} from ${page}`);

        // Greedily update ALL pages for EVERY section
        // If a page doesn't have the relevant IDs, it simply won't be modified/saved.
        const pagesToUpdate = ALL_PAGES;
        let totalUpdated = 0;
        let modifiedFiles = [];

        for (const targetPage of pagesToUpdate) {
            try {
                const filePath = path.join(__dirname, targetPage);
                let htmlContent = await fs.readFile(filePath, 'utf-8');
                const $ = cheerio.load(htmlContent, { decodeEntities: false });
                let pageWasModified = false;

                // Helper to update and track modification
                const updateEl = (selector, content, useHtml = false) => {
                    const elements = $(selector);
                    if (elements.length > 0) {
                        elements.each((i, el) => {
                            const $el = $(el);
                            let currentContent;
                            let newContent = content;

                            if ($el.is('img')) {
                                currentContent = $el.attr('src');
                                if (currentContent !== newContent) {
                                    $el.attr('src', newContent);
                                    pageWasModified = true;
                                }
                            } else if (useHtml) {
                                currentContent = $el.html();
                                if (currentContent !== newContent) {
                                    $el.html(newContent);
                                    pageWasModified = true;
                                }
                            } else {
                                currentContent = $el.text();
                                if (currentContent !== newContent) {
                                    $el.text(newContent);
                                    pageWasModified = true;
                                }
                            }
                        });
                        return true;
                    }
                    return false;
                };

                // --- Advanced Greedy Universal Sync Engine ---
                // Iterates through all incoming data and matches elements site-wide by ID.
                Object.keys(data).forEach(key => {
                    const content = data[key];
                    if (!content) return;

                    // Match both raw ID and 'live-' prefixed version
                    const selectors = [`#${key}`, `#live-${key}`];

                    selectors.forEach(selector => {
                        const elements = $(selector);
                        if (elements.length > 0) {
                            elements.each((i, el) => {
                                const $el = $(el);
                                let currentContent;
                                let isModified = false;

                                if ($el.is('img')) {
                                    currentContent = $el.attr('src');
                                    if (currentContent !== content) {
                                        $el.attr('src', content);
                                        isModified = true;
                                    }
                                } else if ($el.is('a')) {
                                    // Handle both Text and Href for links
                                    const currentHref = $el.attr('href');
                                    if (key.includes('email') || key.includes('phone')) {
                                        const prefix = key.includes('email') ? 'mailto:' : 'tel:';
                                        const cleanVal = key.includes('phone') ? content.replace(/[^\d+]/g, '') : content;
                                        const newHref = prefix + cleanVal;
                                        if (currentHref !== newHref) {
                                            $el.attr('href', newHref);
                                            isModified = true;
                                        }
                                    }
                                    // Also sync text if it's not a logo/image link
                                    if ($el.contents().length === 1 && $el.contents()[0].type === 'text') {
                                        if ($el.text().trim() !== content) {
                                            $el.text(content);
                                            isModified = true;
                                        }
                                    }
                                } else {
                                    // Handle generic text/html containers
                                    const useHtml = content.includes('<') || content.includes('\n');
                                    const newContent = useHtml ? content.replace(/\n/g, '<br>') : content;
                                    currentContent = useHtml ? $el.html() : $el.text();

                                    if (currentContent !== newContent) {
                                        if (useHtml) $el.html(newContent);
                                        else $el.text(newContent);
                                        isModified = true;
                                    }
                                }

                                if (isModified) pageWasModified = true;
                            });
                        }
                    });
                });

                // --- Legacy Fallback Selectors (Ensures 100% compatibility with older markup) ---
                if (data['hero-heading']) updateEl('h1', data['hero-heading']);
                if (data['about-description']) updateEl('.footer-brand p', data['about-description']);
                if (data['contact-address']) updateEl('.footer-column:contains("Contact") li:last-child', data['contact-address']);


                if (pageWasModified) {
                    console.log(`💾 Writing update to: ${filePath}`);
                    await fs.writeFile(filePath, $.html(), 'utf-8');
                    totalUpdated++;
                    modifiedFiles.push(targetPage);
                }
            } catch (err) {
                console.error(`❌ Sync failed for ${targetPage}:`, err.message);
            }
        }

        if (totalUpdated > 0) {
            console.log(`✅ Success: Updated ${totalUpdated} files.`);
            res.json({
                success: true,
                message: `Updated ${totalUpdated} pages successfully!`,
                details: `Modified: ${section}`
            });
        } else {
            res.json({
                success: false,
                error: 'No matching elements found to update in any target files.'
            });
        }

    } catch (error) {
        console.error('❌ Global error in save-section:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint to list all media files recursively
app.get('/api/media', async (req, res) => {
    try {
        const mediaDir = path.join(__dirname, 'Media Content');
        const results = [];

        async function getFiles(dir, relativePath = '') {
            const files = await fs.readdir(dir, { withFileTypes: true });
            for (const file of files) {
                const resPath = path.resolve(dir, file.name);
                const rel = path.join(relativePath, file.name);
                if (file.isDirectory()) {
                    await getFiles(resPath, rel);
                } else {
                    if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file.name)) {
                        results.push({
                            name: file.name,
                            path: 'Media Content/' + rel.replace(/\\/g, '/')
                        });
                    }
                }
            }
        }

        await getFiles(mediaDir);
        res.json({ success: true, media: results });
    } catch (error) {
        console.error('❌ Error listing media:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint to upload new media
app.post('/api/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }
        res.json({
            success: true,
            message: 'File uploaded successfully',
            filePath: 'Media Content/' + req.file.filename
        });
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Vaatia College CMS API is running' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Vaatia College CMS Backend Running`);
    console.log(`📍 Server: http://localhost:${PORT}`);
    console.log(`📍 API: http://localhost:${PORT}/api/save-section`);
    console.log(`\n✅ Ready to receive section updates!\n`);
});
