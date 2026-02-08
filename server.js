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

                // Apply ALL synchronization rules to EVERY page
                // This ensures that if matching IDs exist anywhere, they get synced.

                // 1. Hero / Header Sync
                if (data['hero-heading']) updateEl('#live-hero-heading, h1', data['hero-heading']);
                if (data['hero-subheading']) updateEl('#live-hero-subheading, h1 + p', data['hero-subheading']);
                if (data['hero-image']) updateEl('#live-hero-image', data['hero-image']);
                if (data['header-title']) updateEl('#live-header-title, h1', data['header-title']);
                if (data['header-description']) updateEl('#live-header-description, h1 + p', data['header-description']);
                if (data['logo-img']) updateEl('#live-logo-img', data['logo-img']);

                // 2. About Section / Footer Brand Sync
                if (data['about-title']) updateEl('#live-about-title, #about h2', data['about-title']);
                if (data['about-description']) {
                    updateEl('#live-about-description, #about p', data['about-description']);
                    updateEl('#live-footer-about, .footer-brand p', data['about-description']);
                }

                // 3. Philosophy Section
                if (data['mission-text']) updateEl('#live-mission-text, .glass-card:contains("Mission") p', data['mission-text']);
                if (data['vision-text']) updateEl('#live-vision-text, .glass-card:contains("Vision") p', data['vision-text']);
                if (data['core-values-text']) updateEl('#live-core-values-text, .glass-card:contains("Values") p', data['core-values-text']);

                // 4. Management Team Sync (Slider/Carousel)
                if (data['mgmt-principal-img']) updateEl('#live-mgmt-principal-img', data['mgmt-principal-img']);
                if (data['mgmt-principal-name']) updateEl('#live-mgmt-principal-name', data['mgmt-principal-name']);
                if (data['mgmt-vp1-img']) updateEl('#live-mgmt-vp1-img', data['mgmt-vp1-img']);
                if (data['mgmt-vp1-name']) updateEl('#live-mgmt-vp1-name', data['mgmt-vp1-name']);
                if (data['mgmt-vp2-img']) updateEl('#live-mgmt-vp2-img', data['mgmt-vp2-img']);
                if (data['mgmt-vp2-name']) updateEl('#live-mgmt-vp2-name', data['mgmt-vp2-name']);

                // 5. Academic Dashboard / Bento Sync
                if (data['bento-academics-desc']) updateEl('#live-bento-academics-desc', data['bento-academics-desc']);
                if (data['bento-skills-desc']) updateEl('#live-bento-skills-desc', data['bento-skills-desc']);
                if (data['bento-sports-desc']) updateEl('#live-bento-sports-desc', data['bento-sports-desc']);
                if (data['bento-boarding-desc']) updateEl('#live-bento-boarding-desc', data['bento-boarding-desc']);

                // 6. Contact Info Sync (Site-wide Footer & Links)
                if (data['contact-email']) {
                    updateEl('a[href^="mailto:"], #live-footer-email', data['contact-email']);
                    $('a[href^="mailto:"]').each((i, el) => {
                        const currentHref = $(el).attr('href');
                        const newHref = `mailto:${data['contact-email']}`;
                        if (currentHref !== newHref) {
                            $(el).attr('href', newHref);
                            pageWasModified = true;
                        }
                    });
                }
                if (data['contact-phone']) {
                    updateEl('a[href^="tel:"], #live-footer-phone', data['contact-phone']);
                    const dialNum = data['contact-phone'].replace(/[^\d+]/g, '');
                    $('a[href^="tel:"]').each((i, el) => {
                        const currentHref = $(el).attr('href');
                        const newHref = `tel:${dialNum}`;
                        if (currentHref !== newHref) {
                            $(el).attr('href', newHref);
                            pageWasModified = true;
                        }
                    });
                }
                if (data['contact-address']) {
                    updateEl('#live-contact-address, #live-footer-address, .footer-column:contains("Contact") li:last-child', data['contact-address']);
                }

                // 4. Pricing / Fees Sync
                if (data['price-tuition']) updateEl('#live-price-tuition, .fee-amount', data['price-tuition']);
                if (data['price-other']) updateEl('#live-price-other', data['price-other']);

                // 5. Admissions / Requirements
                if (data['req-age']) updateEl('#live-req-age', data['req-age']);
                if (data['req-documents']) updateEl('#live-req-documents', data['req-documents'].replace(/\n/g, '<br>'), true);
                if (data['app-process']) updateEl('#live-app-notice', data['app-process'], true);
                if (data['app-deadline']) updateEl('#live-app-deadline', data['app-deadline']);

                // 6. Boarding Sync
                if (data['boarding-dorms']) updateEl('#live-boarding-dorms', data['boarding-dorms'].replace(/\n/g, '<br>'), true);
                if (data['boarding-capacity']) updateEl('#live-boarding-capacity', data['boarding-capacity']);
                if (data['boarding-facilities']) updateEl('#live-boarding-facilities, #live-boarding-overview', data['boarding-facilities'].replace(/\n/g, '<br>'), true);
                if (data['boarding-meals']) updateEl('#live-boarding-meals', data['boarding-meals'].replace(/\n/g, '<br>'), true);

                // 7. Activities Sync (Clubs, Sports, Excursions)
                if (data['activities-overview']) updateEl('#live-activities-overview', data['activities-overview'].replace(/\n/g, '<br>'), true);
                if (data['activities-schedule']) updateEl('#live-activities-schedule', data['activities-schedule']);

                // 8. Skills Sync
                if (data['skills-programs']) updateEl('#live-skills-programs', data['skills-programs'].replace(/\n/g, '<br>'), true);
                if (data['skills-duration']) updateEl('#live-skills-duration', data['skills-duration']);

                // 9. Student Life Sync
                if (data['students-info']) updateEl('#live-students-info', data['students-info'].replace(/\n/g, '<br>'), true);
                if (data['students-activities']) updateEl('#live-students-activities', data['students-activities'].replace(/\n/g, '<br>'), true);

                // 10. Payment Info Sync
                if (data['payment-methods']) updateEl('#live-payment-methods', data['payment-methods'].replace(/\n/g, '<br>'), true);
                if (data['payment-installment']) updateEl('#live-payment-installment', data['payment-installment']);

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
