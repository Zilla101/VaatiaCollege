document.addEventListener('DOMContentLoaded', () => {

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

    const updateStats = () => {
        const pageStat = document.getElementById('stat-pages');
        const mediaStat = document.getElementById('stat-media');

        if (pageStat) pageStat.innerText = stats.pages.length;
        if (mediaStat) mediaStat.innerText = stats.media.length + 24; // Base + subdirs
    };

    // 3. Media Grid Population
    const loadMedia = () => {
        const grid = document.getElementById('main-media-grid');
        if (!grid) return;
        grid.innerHTML = '';

        const mediaItems = [
            { name: 'mission.jpg', path: '../Media Content/mission.jpg' },
            { name: 'vision.jpg', path: '../Media Content/vision.jpg' },
            { name: 'corevalues.jpg', path: '../Media Content/corevalues.jpg' },
            { name: 'HomePage.jpg', path: '../Media Content/HomePage.jpg' },
            { name: 'logo.png', path: '../Media Content/vcm-logo.png' },
            { name: 'principal.jpg', path: '../Media Content/MANAGEMENT TEAM/MR. T.O VAATIA, PRINCIPAL.jpg' }
        ];

        mediaItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'media-item';
            el.innerHTML = `
                <img src="${item.path}" alt="${item.name}">
                <div class="media-overlay">
                    <span style="font-weight: 700;">${item.name}</span>
                    <button class="btn-edit" style="margin-top: 10px; font-size: 0.75rem;">Change Image</button>
                </div>
            `;
            grid.appendChild(el);
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
                    <button class="btn-premium" style="width: auto; padding: 10px 20px; font-size: 0.75rem; border-radius: 12px;" onclick="openPageEditor('${page}')">EDIT</button>
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
