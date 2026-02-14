// Comprehensive Section-Based Page Editor for Vaatia College
// This module provides a professional UI for editing site content including text and images.

function renderSectionEditor(page, htmlContent) {
    const commonStyles = "display: flex; flex-direction: column; gap: 20px; max-height: 65vh; overflow-y: auto; padding: 20px; border-radius: 12px; background: rgba(255,255,255,0.02);";
    const cardHeaderStyle = "display: flex; align-items: center; gap: 10px; margin-bottom: 20px; color: var(--accent-blue);";

    // Helper to get current values from HTML using DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');

    const getVal = (selector, fallback = '') => {
        const el = doc.querySelector(selector);
        if (!el) return fallback;
        if (el.tagName === 'IMG') return el.getAttribute('src') || fallback;
        return (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' ? el.value : el.innerText).trim();
    };

    const sectionTemplate = (id, title, icon, fields) => `
        <div class="section-card elite-card" style="margin-bottom: 25px;">
            <div style="${cardHeaderStyle}">
                <i data-feather="${icon}" style="width: 20px; height: 20px;"></i>
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; letter-spacing: 0.05em; text-transform: uppercase;">${title}</h3>
            </div>
            <div class="section-fields-grid" style="display: grid; gap: 15px;">
                ${fields.map(f => `
                    <div class="section-field">
                        <label style="font-size: 0.75rem; color: #888; text-transform: uppercase; font-weight: 700;">${f.label}</label>
                        ${f.type === 'textarea' ?
            `<textarea id="${id}-${f.key}" rows="${f.rows || 3}">${getVal(f.selector)}</textarea>` :
            f.key.includes('image') || f.key.includes('img') ?
                `<div style="display: flex; gap: 10px;">
                    <input type="text" id="${id}-${f.key}" value="${getVal(f.selector)}" style="flex: 1;">
                    <button class="btn-edit" style="width: auto; padding: 0 15px; font-size: 0.7rem;" onclick="switchTab('media'); alert('Select an image from the library and copy its path, then paste it here.')">
                        LIBRARY
                    </button>
                </div>` :
                `<input type="${f.type || 'text'}" id="${id}-${f.key}" value="${getVal(f.selector)}">`
        }
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
                <button class="btn-premium" style="width: auto; padding: 10px 20px;" onclick="saveSectionChanges('${id}')">
                    <i data-feather="save" style="width: 14px; height: 14px; margin-right: 5px;"></i> SAVE ${title}
                </button>
            </div>
        </div>
    `;

    let sections = '';

    // Homepage (index.html)
    if (page === 'index.html') {
        sections += sectionTemplate('hero', 'Hero Section', 'target', [
            { label: 'Main Heading', key: 'heading', selector: '#live-hero-heading' },
            { label: 'Subheading', key: 'subheading', selector: '#live-hero-subheading', type: 'textarea' },
            { label: 'Background Image Path', key: 'image', selector: '#live-hero-image' }
        ]);

        sections += sectionTemplate('philosophy', 'Our Philosophy', 'shield', [
            { label: 'Mission Statement', key: 'mission-text', selector: '#live-mission-text', type: 'textarea' },
            { label: 'Vision Statement', key: 'vision-text', selector: '#live-vision-text', type: 'textarea' },
            { label: 'Core Values', key: 'core-values-text', selector: '#live-core-values-text', type: 'textarea' }
        ]);

        sections += sectionTemplate('bento', 'Bento Highlights', 'layout', [
            { label: 'Academics Description', key: 'academics-desc', selector: '#live-bento-academics-desc', type: 'textarea' },
            { label: 'Skills Description', key: 'skills-desc', selector: '#live-bento-skills-desc', type: 'textarea' },
            { label: 'Sports Description', key: 'sports-desc', selector: '#live-bento-sports-desc', type: 'textarea' }
        ]);

        sections += sectionTemplate('mgmt', 'Management Team', 'users', [
            { label: 'Principal Name', key: 'principal-name', selector: '#live-mgmt-principal-name' },
            { label: 'Principal Image', key: 'principal-img', selector: '#live-mgmt-principal-img' },
            { label: 'VP Academic Name', key: 'vp1-name', selector: '#live-mgmt-vp1-name' },
            { label: 'VP Academic Image', key: 'vp1-img', selector: '#live-mgmt-vp1-img' }
        ]);
    }

    // Admissions
    else if (page === 'admissions.html') {
        sections += sectionTemplate('header', 'Header Section', 'type', [
            { label: 'Page Title', key: 'title', selector: '#live-header-title' },
            { label: 'Description', key: 'description', selector: '#live-header-description', type: 'textarea' }
        ]);
        sections += sectionTemplate('req', 'Requirements', 'clipboard', [
            { label: 'Age Limit', key: 'age', selector: '#live-req-age' },
            { label: 'Required Documents', key: 'documents', selector: '#live-req-documents', type: 'textarea' }
        ]);
    }

    // Boarding
    else if (page === 'boarding.html') {
        sections += sectionTemplate('boarding', 'Hostel Life', 'home', [
            { label: 'Facilities Overview', key: 'facilities', selector: '#live-boarding-facilities', type: 'textarea' },
            { label: 'Security & Safety', key: 'security', selector: '#live-boarding-security', type: 'textarea' },
            { label: 'Laundry Services', key: 'laundry', selector: '#live-boarding-laundry', type: 'textarea' },
            { label: 'Dining Services', key: 'meals', selector: '#live-boarding-meals', type: 'textarea' }
        ]);
    }

    // Admissions
    else if (page === 'admissions.html') {
        sections += sectionTemplate('header', 'Header Section', 'type', [
            { label: 'Page Title', key: 'title', selector: '#live-header-title' },
            { label: 'Description', key: 'description', selector: '#live-header-description', type: 'textarea' }
        ]);
        sections += sectionTemplate('req', 'Requirements', 'clipboard', [
            { label: 'Age Limit', key: 'age', selector: '#live-req-age' },
            { label: 'Entrance Exam Notice', key: 'app-process', selector: '#live-app-notice', type: 'textarea' }
        ]);
        sections += sectionTemplate('faq', 'Admission FAQs', 'help-circle', [
            { label: 'Enrollment Fee', key: 'fee', selector: '#live-faq-fee' },
            { label: 'Acceptance Policy', key: 'acceptance', selector: '#live-faq-acceptance' }
        ]);
    }

    // Activities (Clubs, Sports, Excursions)
    else if (['club.html', 'sports.html', 'excursions.html'].includes(page)) {
        sections += sectionTemplate('activities', 'Activities & Events', 'award', [
            { label: 'Header Title', key: 'title', selector: '#live-header-title' },
            { label: 'Overview Text', key: 'overview', selector: '#live-activities-overview', type: 'textarea' }
        ]);
    }

    // Common Footer / Contact (Available on all pages for global sync)
    sections += sectionTemplate('brand', 'Global Brand Assets', 'command', [
        { label: 'Site Logo Image', key: 'logo-img', selector: '#live-logo-img' }
    ]);

    sections += sectionTemplate('contact', 'Global Contact & Footer', 'info', [
        { label: 'School Email', key: 'email', selector: '#live-footer-email' },
        { label: 'School Phone', key: 'phone', selector: '#live-footer-phone' },
        { label: 'Desktop Address', key: 'address', selector: '#live-footer-address', type: 'textarea' }
    ]);

    return `
        <div class="editor-container" style="${commonStyles}">
            ${sections || '<div style="text-align: center; padding: 40px; color: #888;">Protocol definitions pending for this module.</div>'}
            <div style="text-align: center; margin-top: 20px; padding: 15px; background: rgba(0, 242, 254, 0.05); border-radius: 12px; border: 1px solid rgba(0, 242, 254, 0.1);">
                <p style="color: var(--accent-blue); font-size: 0.8rem; font-weight: 700; margin: 0;">
                    <i data-feather="zap" style="width: 12px; height: 12px; margin-right: 5px;"></i> 
                    LIFESYNC ACTIVE: Changes will propagate to all 10 site blueprints.
                </p>
            </div>
        </div>
    `;
}

// Save section changes
window.saveSectionChanges = async (sectionName) => {
    const values = {};
    const sectionInputs = document.querySelectorAll(`input[id^="${sectionName}-"], textarea[id^="${sectionName}-"]`);
    sectionInputs.forEach(input => {
        values[input.id] = input.value;
    });

    const modalTitle = document.getElementById('modal-title');
    const pageMatch = modalTitle?.innerText.match(/Edit Page: (\w+)/);
    const pageName = pageMatch ? pageMatch[1].toLowerCase() + '.html' : 'index.html';

    console.log(`💾 Syncing ${sectionName} protocol for ${pageName}:`, values);

    // Log action for SuperAdmin oversight
    if (window.logAdminAction) {
        window.logAdminAction(`Modified [${sectionName.toUpperCase()}] on ${pageName}`);
    }

    // Visual feedback on button
    const activeBtn = document.activeElement;
    const originalContent = activeBtn.innerHTML;
    activeBtn.innerHTML = '<i data-feather="loader" class="spin" style="width: 14px; height: 14px; margin-right: 5px;"></i> SYNCING...';
    activeBtn.disabled = true;
    if (typeof feather !== 'undefined') feather.replace();

    if (typeof feather !== 'undefined') feather.replace();

    // Determine Environment (Unified via admin.js)
    let API_BASE = window.API_BASE;

    // Handle Paused State

    // Handle Paused State
    const isPaused = localStorage.getItem('VAATIA_SYNC_PAUSED') === 'true';
    if (isPaused && API_BASE === 'GITHUB_SYNC') {
        alert('Protocol Interrupted: SYNC IS PAUSED. Please resume sync from the dashboard to push changes to GitHub/Vercel.');
        activeBtn.innerHTML = originalContent;
        activeBtn.disabled = false;
        return;
    }

    if (!API_BASE) {
        alert('Protocol Interrupted: Command server unreachable. Link your GitHub Token for Worldwide access or use Local Command Mode.');
        activeBtn.innerHTML = originalContent;
        activeBtn.disabled = false;
        return;
    }

    // Handle GitHub Sync Save (Universal Greedy Sync Mode)
    if (API_BASE === 'GITHUB_SYNC') {
        const ghToken = localStorage.getItem('VAATIA_GH_TOKEN');
        const REPO_OWNER = 'Zilla101';
        const REPO_NAME = 'VaatiaCollege';
        const ALL_PAGES = [
            'index.html', 'admissions.html', 'boarding.html', 'club.html',
            'excursions.html', 'fees.html', 'skillsacquisition.html',
            'sports.html', 'students.html', 'tuition.html'
        ];

        try {
            activeBtn.innerHTML = '<span class="loader-mini"></span> GLOBAL SYNC...';
            let updatedCount = 0;

            for (const targetPage of ALL_PAGES) {
                try {
                    // 1. Fetch current file from GitHub
                    const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${targetPage}`, {
                        headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' }
                    });

                    if (!getRes.ok) continue; // Skip missing files
                    const fileData = await getRes.json();

                    const decodedContent = decodeURIComponent(atob(fileData.content).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));

                    const sha = fileData.sha;

                    // 2. Parse and Update (Greedy Mode)
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(decodedContent, 'text/html');
                    let pageModified = false;

                    Object.keys(values).forEach(id => {
                        // Greedily match both the ID and the live- prefixed version
                        const selectors = [`#${id}`, `#live-${id}`];
                        selectors.forEach(selector => {
                            const elements = doc.querySelectorAll(selector);
                            elements.forEach(el => {
                                let newValue = values[id];
                                let currentVal;

                                if (el.tagName === 'IMG') {
                                    currentVal = el.getAttribute('src');
                                    if (currentVal !== newValue) {
                                        el.src = newValue;
                                        pageModified = true;
                                    }
                                } else if (el.tagName === 'A') {
                                    currentVal = el.getAttribute('href');
                                    if (currentVal !== newValue) {
                                        el.href = newValue;
                                        pageModified = true;
                                    }
                                } else {
                                    currentVal = el.innerHTML;
                                    if (currentVal !== newValue) {
                                        el.innerHTML = newValue;
                                        pageModified = true;
                                    }
                                }
                            });
                        });
                    });

                    if (!pageModified) continue;

                    activeBtn.innerHTML = `<span class="loader-mini"></span> PUSHING ${targetPage.toUpperCase()}...`;
                    const updatedHTML = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;

                    const encodedContent = btoa(encodeURIComponent(updatedHTML).replace(/%([0-9A-F]{2})/g, function (match, p1) {
                        return String.fromCharCode('0x' + p1);
                    }));

                    const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${targetPage}`, {
                        method: 'PUT',
                        headers: { 'Authorization': `token ${ghToken}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: `admin: universal greedy sync [${sectionName}]`,
                            content: encodedContent,
                            sha: sha
                        })
                    });

                    if (putRes.ok) updatedCount++;
                } catch (err) {
                    console.warn(`Sync failed for ${targetPage}:`, err);
                }
            }

            if (updatedCount > 0) {
                activeBtn.innerHTML = '<i data-feather="loader"></i> DEPLOYING (30s)...';
                activeBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';

                let countdown = 30;
                const timer = setInterval(() => {
                    countdown--;
                    if (countdown > 0) {
                        activeBtn.innerHTML = `<i data-feather="loader"></i> LIVE IN ${countdown}s`;
                    } else {
                        clearInterval(timer);
                        activeBtn.innerHTML = '<i data-feather="check"></i> SITE IS LIVE';
                        activeBtn.style.background = 'linear-gradient(135deg, #00f2fe, #4facfe)';

                        setTimeout(() => {
                            if (confirm(`Universal Greedy Sync Complete! ${updatedCount} pages updated.\n\nWould you like to reload the page to verify?`)) {
                                window.open('../' + pageName, '_blank');
                            }
                            activeBtn.innerHTML = originalContent;
                            activeBtn.style.background = '';
                            activeBtn.disabled = false;
                            if (typeof feather !== 'undefined') feather.replace();
                        }, 2000);
                    }
                }, 1000);
            } else {
                alert('No changes detected site-wide.');
                activeBtn.innerHTML = originalContent;
                activeBtn.disabled = false;
            }
            return;
        } catch (err) {
            console.error('Cloud Sync Error:', err);
            alert(`CLOUD SYNC FAILED: ${err.message}`);
            activeBtn.innerHTML = originalContent;
            activeBtn.disabled = false;
            return;
        }
    }

    try {
        const response = await fetch(`${API_BASE}/api/save-section`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ page: pageName, section: sectionName, data: values })
        });

        const result = await response.json();
        if (result.success) {
            activeBtn.innerHTML = '<i data-feather="check" style="width: 14px; height: 14px; margin-right: 5px;"></i> SUCCESS';
            activeBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
            setTimeout(() => {
                activeBtn.innerHTML = originalContent;
                activeBtn.style.background = '';
                activeBtn.disabled = false;
                if (typeof feather !== 'undefined') feather.replace();
            }, 2000);
        } else {
            alert(`⚠️ Protocol Error: ${result.error}`);
            activeBtn.innerHTML = originalContent;
            activeBtn.disabled = false;
            if (typeof feather !== 'undefined') feather.replace();
        }
    } catch (error) {
        console.error('❌ Sync Error:', error);
        alert(`❌ Network Error: Could not reach the command server.`);
        activeBtn.innerHTML = originalContent;
        activeBtn.disabled = false;
        if (typeof feather !== 'undefined') feather.replace();
    }
};

// Open the section editor modal (Liquid Prototype)
window.openSimplePageEditor = async (page) => {
    const title = document.getElementById('modal-title');
    const editorBody = document.getElementById('modal-body');
    const modal = document.getElementById('edit-modal');

    if (!title || !editorBody || !modal) return;

    title.innerText = `Edit Page: ${page.replace('.html', '').toUpperCase()}`;
    editorBody.innerHTML = `
        <div style="text-align: center; padding: 60px;">
            <div class="loader-circle" style="width: 40px; height: 40px; border: 3px solid rgba(0, 242, 254, 0.1); border-top-color: var(--accent-blue); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px;"></div>
            <p style="color: var(--accent-blue); font-size: 0.7rem; letter-spacing: 0.3em; font-weight: 800; text-transform: uppercase;">
                Loading Sector Data...
            </p>
        </div>
    `;

    modal.style.display = 'flex';

    try {
        const response = await fetch(`../${page}`);
        const content = await response.text();
        editorBody.innerHTML = renderSectionEditor(page, content);
        if (typeof feather !== 'undefined') feather.replace();
    } catch (err) {
        console.error('Sector Fetch Error:', err);
        editorBody.innerHTML = '<p style="color: #f87171; text-align: center; padding: 40px;">CRITICAL: Failed to load sector blueprint.</p>';
    }
};
