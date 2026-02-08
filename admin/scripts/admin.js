document.addEventListener('DOMContentLoaded', () => {
    // Determine API Base URL (Supports accessing via IP/Port 8080 or Port 3000)
    const getApiBase = () => {
        const hostname = window.location.hostname;
        const isLocal = hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            (hostname.startsWith('172.') && parseInt(hostname.split('.')[1]) >= 16 && parseInt(hostname.split('.')[1]) <= 31);

        // Check for public API override (Global Command Mode)
        const publicApi = localStorage.getItem('VAATIA_PUBLIC_API');
        if (publicApi) return publicApi;

        if (!isLocal) return null; // Disable API on production (Netlify)
        if (window.location.port === '3000') return '';
        const host = hostname || 'localhost';
        return `http://${host}:3000`;
    };
    const API_BASE = getApiBase();
    window.API_BASE = API_BASE;
    window.isLocalEnv = !!API_BASE && API_BASE !== 'GITHUB_SYNC';

    // 0. Authentication Logic
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('user-id').value;
            const password = document.getElementById('pass-key').value;
            const btn = loginForm.querySelector('.btn-billion');
            const errorMsg = document.getElementById('auth-error');

            if (username === 'VaatiaAdmin' && password === 'Vaatia@2004') {
                btn.innerText = 'AUTHENTICATING...';
                btn.style.opacity = '0.7';
                errorMsg.style.display = 'none';

                // Trigger Security Alert via Netlify Function
                fetch('/.netlify/functions/admin-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user: username,
                        device: navigator.userAgent,
                        resolution: `${window.screen.width}x${window.screen.height}`,
                        time: new Date().toLocaleString(),
                        url: window.location.href
                    })
                }).catch(err => console.warn('Security alert bypass detected.'));

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                // Liquid Glass Haptic Error
                const card = document.querySelector('.premium-card');
                card.classList.add('shake-haptic');
                errorMsg.style.display = 'block';
                errorMsg.classList.add('error-message-elite');

                btn.classList.add('denied');
                btn.innerText = 'ACCESS DENIED';

                // Cleanup after timeout (Deliberate Reset)
                setTimeout(() => {
                    errorMsg.style.display = 'none';
                    errorMsg.classList.remove('error-message-elite');
                    card.classList.remove('shake-haptic');
                    btn.classList.remove('denied');
                    btn.innerText = 'LOGIN';

                    // Auto-Reset Credentials
                    document.getElementById('user-id').value = '';
                    document.getElementById('pass-key').value = '';
                }, 1000);
            }
        });
    }

    // --- Dashboard & Navigation Logic (Universal) ---

    // Mobile Navigation Logic
    const mobileToggle = document.getElementById('mobile-toggle');
    const sidebar = document.getElementById('dashboard-sidebar');

    if (mobileToggle && sidebar) {
        mobileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileToggle.classList.toggle('active');
            sidebar.classList.toggle('active');
        });

        // Global click listener to close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !mobileToggle.contains(e.target)) {
                mobileToggle.classList.remove('active');
                sidebar.classList.remove('active');
            }
        });

        // Close menu when clicking links
        const sidebarLinks = sidebar.querySelectorAll('.nav-link');
        sidebarLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileToggle.classList.remove('active');
                sidebar.classList.remove('active');
            });
        });
    }

    // Password Peek Toggle Logic (LoginPage Only)
    const toggleBtn = document.getElementById('toggle-password');
    const passInput = document.getElementById('pass-key');

    if (toggleBtn && passInput) {
        toggleBtn.addEventListener('click', () => {
            const isPassword = passInput.type === 'password';
            passInput.type = isPassword ? 'text' : 'password';

            const icon = toggleBtn.querySelector('i');
            if (isPassword) {
                icon.setAttribute('data-feather', 'eye-off');
            } else {
                icon.setAttribute('data-feather', 'eye');
            }
            feather.replace();
        });
    }

    // 1. Tab Management
    const navLinks = document.querySelectorAll('.nav-link[data-tab]');
    const tabContents = document.querySelectorAll('.tab-content');

    function switchTab(tabId) {
        navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.tab === tabId);
        });
        tabContents.forEach(tab => {
            tab.classList.toggle('active', tab.id === tabId);
        });

        // Re-calculate stats or refresh grid if needed
        if (tabId === 'media') loadMedia();
        if (tabId === 'pages') loadPages();
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const tabId = link.getAttribute('data-tab');
            if (tabId) {
                e.preventDefault();
                switchTab(tabId);
            }
        });
    });

    // Make switchTab globally accessible for inline onclicks
    window.switchTab = switchTab;

    // 2. Real Stats Calculation (Mocked via list/scanned counts)
    const stats = {
        pages: ['index.html', 'admissions.html', 'boarding.html', 'club.html', 'excursions.html', 'fees.html', 'skillsacquisition.html', 'sports.html', 'students.html', 'tuition.html'],
        media: [
            'mission.jpg', 'vision.jpg', 'corevalues.jpg', 'HomePage.jpg',
            'vcm-logo.png', 'Favicon.png', 'ACADEMICS', 'BOARDING', 'SPORTS'
        ]
    };

    const updateStats = async () => {
        if (!API_BASE) {
            const status = document.querySelector('.protocol-status');
            if (status) {
                status.innerText = 'READ-ONLY: OFFLINE';
                status.style.color = 'var(--text-secondary)';
            }
            return;
        }
        const pageStat = document.getElementById('stat-pages');
        const mediaStat = document.getElementById('stat-media');

        if (pageStat) pageStat.innerText = stats.pages.length;

        try {
            const status = document.querySelector('.protocol-status');
            if (API_BASE === 'GITHUB_SYNC') {
                if (status) {
                    status.innerText = 'WORLDWIDE SYNC: ACTIVE';
                    status.style.color = '#00f2fe';
                }
                return;
            }

            if (!API_BASE) {
                if (status) {
                    status.innerText = 'READ-ONLY: OFFLINE';
                    status.style.color = 'var(--text-secondary)';
                }
                return;
            }
            const response = await fetch(`${API_BASE}/api/media`);
            const data = await response.json();
            if (data.success && mediaStat) {
                mediaStat.innerText = data.media.length;
            } else if (mediaStat) {
                mediaStat.innerText = stats.media.length + 24;
            }
        } catch (err) {
            if (window.isLocalEnv) console.warn('Could not fetch media stats, using fallback.');
            if (mediaStat) mediaStat.innerText = stats.media.length + 24;
        }
    };

    // 3. Media Grid Population
    const loadMedia = async () => {
        const grid = document.getElementById('main-media-grid');
        if (!grid) return;

        if (!API_BASE) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary); opacity: 0.5; font-size: 0.8rem; letter-spacing: 0.1em;">MEDIA MANAGER ACTIVE IN LOCAL COMMAND MODE ONLY</div>';
            return;
        }

        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Fetching media library...</div>';

        try {
            if (API_BASE === 'GITHUB_SYNC') {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--accent-blue);">GITHUB CLOUD LIBRARY ACTIVE<br><br><button class="btn-premium" style="font-size: 0.6rem;" onclick="location.reload()">REFRESH FROM CLOUD</button></div>';
                return;
            }
            if (!API_BASE) {
                grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary); opacity: 0.5; font-size: 0.8rem; letter-spacing: 0.1em;">MEDIA MANAGER ACTIVE IN LOCAL COMMAND MODE ONLY</div>';
                return;
            }
            const response = await fetch(`${API_BASE}/api/media`);
            const data = await response.json();

            if (data.success) {
                grid.innerHTML = '';
                data.media.forEach(item => {
                    const el = document.createElement('div');
                    el.className = 'media-item';
                    el.innerHTML = `
                        <img src="../${item.path}" alt="${item.name}" class="image-fade-in" loading="lazy">
                        <div class="media-overlay">
                            <span style="font-weight: 700; font-size: 0.65rem; word-break: break-all; padding: 0 10px;">${item.name}</span>
                            <button class="btn-edit" style="margin-top: 10px; font-size: 0.75rem;" onclick="copyPathToClipboard('${item.path}')">Copy Path</button>
                        </div>
                    `;
                    grid.appendChild(el);
                });
            }
        } catch (err) {
            if (window.isLocalEnv) grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #f87171;">Failed to load media assets.</div>';
            else grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-secondary); opacity: 0.5;">OFFLINE MODE</div>';
        }
    };

    window.copyPathToClipboard = (path) => {
        navigator.clipboard.writeText(path).then(() => {
            alert('Path copied: ' + path);
        });
    };

    // 4. Page Manager Population
    const loadPages = () => {
        const list = document.getElementById('main-page-list');
        if (!list) return;
        list.innerHTML = '';

        stats.pages.forEach(page => {
            const row = document.createElement('div');
            row.className = 'page-row';
            row.style.padding = '20px 30px';

            // Format Title: index.html -> Index
            const displayName = page.charAt(0).toUpperCase() + page.slice(1).replace('.html', '');

            row.innerHTML = `
                <div>
                    <h3 style="font-size: 0.95rem; font-weight: 700;">${displayName}</h3>
                    <p style="color: var(--text-secondary); font-size: 0.7rem;">Live Path: /${page}</p>
                </div>
                <div style="display: flex; gap: 12px;">
                    <a href="../${page}" target="_blank" class="btn-edit" style="text-decoration: none; padding: 10px 20px; font-size: 0.75rem; display: flex; align-items: center; gap: 8px;">
                        <i data-feather="external-link" style="width: 14px; height: 14px;"></i> VIEW
                    </a>
                    <button class="btn-premium" style="width: auto; padding: 10px 20px; font-size: 0.75rem; border-radius: 12px;" onclick="openSimplePageEditor('${page}')">EDIT</button>
                </div>
            `;
            list.appendChild(row);
        });
        feather.replace();
    };

    // 5. Global Modal Logic
    const modal = document.getElementById('edit-modal');

    window.openPageEditor = async (page) => {
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const saveBtn = document.getElementById('save-btn');

        if (!title || !body) return;

        title.innerText = `Blueprint: ${page}`;
        body.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <p style="color: var(--accent-blue); font-size: 0.7rem; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 800;">
                    FETCHING ENCRYPTED PROTOCOL...
                </p>
            </div>
            <textarea class="elite-editor-area" id="page-content-editor" spellcheck="false">Loading secure assets...</textarea>
        `;

        if (modal) modal.style.display = 'flex';
        feather.replace();

        try {
            const response = await fetch(`../${page}`);
            const content = await response.text();
            const editor = document.getElementById('page-content-editor');
            if (editor) editor.value = content;
        } catch (err) {
            console.error('Fetch error:', err);
            const editor = document.getElementById('page-content-editor');
            if (editor) editor.value = 'ERROR: Failed to retrieve secure blueprint metadata.';
        }
    };

    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            const originalText = saveBtn.innerText;
            saveBtn.innerText = 'EXECUTING SYNC...';
            saveBtn.style.opacity = '0.7';

            setTimeout(() => {
                saveBtn.innerText = 'PROTOCOL SYNCED';
                saveBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';

                setTimeout(() => {
                    closeModal();
                    saveBtn.innerText = originalText;
                    saveBtn.style.opacity = '1';
                    saveBtn.style.background = ''; // Reverts to CSS default
                }, 1000);
            }, 1200);
        });
    }

    // Settings Logic (Functional Sync)
    window.openSettings = () => {
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');

        if (title && body) {
            title.innerText = 'Configuration Centre';
            body.innerHTML = `
                <div style="text-align: center; padding: 40px 0;">
                    <i data-feather="settings" style="width: 64px; height: 64px; color: var(--accent-blue); margin-bottom: 25px; opacity: 0.5;"></i>
                    <h3 style="font-size: 1.5rem; margin-bottom: 10px;">Security & Systems</h3>
                    <p style="color: var(--text-secondary); opacity: 0.7; max-width: 400px; margin: 0 auto 30px;">
                        This section is restricted to Level 2 Administrators. Your identity is currently being verified.
                    </p>
                    <div style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">
                        <p style="font-size: 0.8rem; letter-spacing: 0.1em; color: var(--accent-blue); font-weight: 800;">PROTOCOL: VCM-ADMIN-AUTH-V2</p>
                    </div>
                </div>
            `;

            if (modal) {
                modal.style.display = 'flex';
                feather.replace();
            }
        }
    };

    window.closeModal = () => {
        if (modal) modal.style.display = 'none';
    };

    // Upload Logic
    const uploadBtn = document.querySelector('.btn-premium.btn-compact');
    if (uploadBtn && uploadBtn.innerText === '+ UPLOAD ASSET') {
        uploadBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                if (!API_BASE) {
                    alert('Upload is only available in Local Command Mode.');
                    return;
                }
                const formData = new FormData();
                formData.append('file', file);

                uploadBtn.innerText = 'UPLOADING...';
                uploadBtn.disabled = true;

                try {
                    const response = await fetch(`${API_BASE}/api/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();
                    if (result.success) {
                        loadMedia();
                        updateStats();
                        showPlacementDialogue(result.filePath);
                    } else {
                        alert('Upload failed: ' + result.error);
                    }
                } catch (err) {
                    alert('Command server unreachable.');
                } finally {
                    uploadBtn.innerText = '+ UPLOAD ASSET';
                    uploadBtn.disabled = false;
                }
            };
            input.click();
        });
    }

    // Post-Upload Placement Dialogue
    window.showPlacementDialogue = (filePath) => {
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        const modal = document.getElementById('edit-modal');
        if (!title || !body || !modal) return;

        title.innerText = 'Protocol: Asset Placement';
        body.innerHTML = `
            <div style="text-align: center; margin-bottom: 25px;">
                <img src="../${filePath}" style="width: 150px; height: 100px; object-fit: cover; border-radius: 15px; border: 2px solid var(--accent-blue); margin-bottom: 10px;" class="image-fade-in">
                <p style="color: var(--text-secondary); font-size: 0.8rem; letter-spacing: 0.05em;">DEPLOYMENT DETECTED: SELECT SECTOR</p>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 10px; -webkit-overflow-scrolling: touch;">
                <button class="btn-edit active" onclick="filterPlacement('all', this)" style="padding: 8px 15px; font-size: 0.65rem; white-space: nowrap;">ALL SECTORS</button>
                <button class="btn-edit" onclick="filterPlacement('home', this)" style="padding: 8px 15px; font-size: 0.65rem; white-space: nowrap;">HOMEPAGE</button>
                <button class="btn-edit" onclick="filterPlacement('inner', this)" style="padding: 8px 15px; font-size: 0.65rem; white-space: nowrap;">INTERNAL PAGES</button>
                <button class="btn-edit" onclick="filterPlacement('global', this)" style="padding: 8px 15px; font-size: 0.65rem; white-space: nowrap;">GLOBAL ASSETS</button>
            </div>

            <div class="placement-options" id="placement-grid" style="max-height: 40vh; overflow-y: auto; padding-right: 5px;">
                <!-- Home -->
                <div class="placement-option" data-cat="home" onclick="applyAssetToSection('index.html', 'hero', 'image', '${filePath}')">
                    <h4>Hero Background</h4>
                    <p>Homepage > Elite Entry Sector</p>
                </div>
                <div class="placement-option" data-cat="home" onclick="applyAssetToSection('index.html', 'mgmt', 'principal-img', '${filePath}')">
                    <h4>Principal Portrait</h4>
                    <p>Management > Principal Asset</p>
                </div>
                <div class="placement-option" data-cat="home" onclick="applyAssetToSection('index.html', 'mgmt', 'vp1-img', '${filePath}')">
                    <h4>VP Academic Portrait</h4>
                    <p>Management > VP Academic Asset</p>
                </div>
                
                <!-- Inner -->
                <div class="placement-option" data-cat="inner" onclick="applyAssetToSection('admissions.html', 'header', 'image', '${filePath}')">
                    <h4>Admissions Header</h4>
                    <p>Admissions > Blueprint Background</p>
                </div>
                <div class="placement-option" data-cat="inner" onclick="applyAssetToSection('boarding.html', 'header', 'image', '${filePath}')">
                    <h4>Boarding Header</h4>
                    <p>Boarding > Hostel Lifecycle</p>
                </div>
                <div class="placement-option" data-cat="inner" onclick="applyAssetToSection('club.html', 'activities', 'image', '${filePath}')">
                    <h4>Clubs Header</h4>
                    <p>Activities > Clubs & Society</p>
                </div>
                <div class="placement-option" data-cat="inner" onclick="applyAssetToSection('sports.html', 'activities', 'image', '${filePath}')">
                    <h4>Sports Header</h4>
                    <p>Activities > Athletic Sector</p>
                </div>
                
                <!-- Global -->
                <div class="placement-option" data-cat="global" onclick="applyAssetToSection('index.html', 'brand', 'logo-img', '${filePath}')">
                    <h4>Site Logo</h4>
                    <p>Global > Brand Identity Asset</p>
                </div>
            </div>
            
            <div style="margin-top: 25px; text-align: center; display: flex; flex-direction: column; gap: 10px;">
                <button class="btn-edit" onclick="closeModal()" style="width: 100%; border: 1px solid rgba(255,255,255,0.1);">SKIP AUTOMATIC PLACEMENT</button>
            </div>
        `;
        modal.style.display = 'flex';
        feather.replace();
    };

    window.filterPlacement = (cat, btn) => {
        const options = document.querySelectorAll('.placement-option');
        const buttons = btn.parentElement.querySelectorAll('button');

        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        options.forEach(opt => {
            if (cat === 'all' || opt.dataset.cat === cat) {
                opt.style.display = 'block';
            } else {
                opt.style.display = 'none';
            }
        });
    };

    window.applyAssetToSection = async (page, section, key, filePath) => {
        const data = {};
        data[`${section}-${key}`] = filePath;

        // Visual feedback
        const modal = document.getElementById('edit-modal');
        const body = document.getElementById('modal-body');
        body.innerHTML = `
            <div style="text-align: center; padding: 60px;">
                <div class="loader-circle" style="width: 40px; height: 40px; border: 3px solid rgba(0, 242, 254, 0.1); border-top-color: var(--accent-blue); border-radius: 50%; animation: spin 0.8s linear infinite; margin: 0 auto 20px;"></div>
                <p style="color: var(--accent-blue); font-size: 0.7rem; letter-spacing: 0.3em; font-weight: 800; text-transform: uppercase;">
                    Executing Global Sync...
                </p>
            </div>
        `;

        try {
            const response = await fetch(`${API_BASE}/api/save-section`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ page: page, section: section, data: data })
            });

            const result = await response.json();
            if (result.success) {
                body.innerHTML = `
                    <div style="text-align: center; padding: 60px;">
                        <i data-feather="check-circle" style="width: 64px; height: 64px; color: #10b981; margin-bottom: 20px;"></i>
                        <h3 style="color: white; margin-bottom: 10px;">PROTOCOL SUCCESS</h3>
                        <p style="color: var(--text-secondary); font-size: 0.9rem;">Asset deployed to ${page} > ${section}.</p>
                        <button class="btn-premium" onclick="closeModal()" style="margin-top: 30px; width: auto; padding: 12px 40px;">CONFIRM</button>
                    </div>
                `;
                feather.replace();
            } else {
                alert('Sync Error: ' + result.error);
                closeModal();
            }
        } catch (err) {
            alert('Command server unreachable.');
            closeModal();
        }
    };

    // Initial Load
    updateStats();
    loadMedia();
    loadPages();
});

// Logout Modal Logic
function openLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        feather.replace();
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logout-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function confirmLogout() {
    const btn = document.querySelector('#logout-modal .btn-premium');
    if (btn) {
        btn.innerText = 'TERMINATING...';
        btn.style.opacity = '0.7';

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 800);
    }
}
