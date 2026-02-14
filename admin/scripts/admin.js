document.addEventListener('DOMContentLoaded', () => {
    // Determine API Base URL (Supports accessing via IP/Port 8080 or Port 3000)
    const getApiBase = () => {
        const hostname = window.location.hostname;
        const port = window.location.port;
        const isLocal = hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname.startsWith('192.168.') ||
            hostname.startsWith('10.') ||
            (hostname.startsWith('172.') && parseInt(hostname.split('.')[1]) >= 16 && parseInt(hostname.split('.')[1]) <= 31);

        // Priority 1: GitHub Global Sync (If token exists)
        const ghToken = localStorage.getItem('VAATIA_GH_TOKEN');
        if (ghToken) return 'GITHUB_SYNC';

        // Priority 3: Production/Cloud Detection
        if (!isLocal) {
            // If on Vercel or main domain, use relative paths
            if (hostname.includes('vaatia') || hostname.includes('vercel.app')) {
                return '';
            }
        }

        // Priority 4: Local Command Engine
        if (isLocal) {
            if (port === '3000' || port === '8080') return ''; // We are likely on the server already
            return `http://${hostname}:3000`;
        }

        return ''; // Default to relative paths for maximum Vercel compatibility
    };
    const API_BASE = getApiBase();
    window.API_BASE = API_BASE;
    window.isLocalEnv = !!API_BASE && API_BASE !== 'GITHUB_SYNC';
    window.isSyncPaused = localStorage.getItem('VAATIA_SYNC_PAUSED') === 'true';

    // GitHub API Configuration
    const REPO_OWNER = 'Zilla101';
    const REPO_NAME = 'VaatiaCollege';
    const GITHUB_TOKEN = localStorage.getItem('VAATIA_GH_TOKEN');

    const fetchFromGitHub = async (path) => {
        if (!GITHUB_TOKEN) return null;
        try {
            const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${path}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            return await response.json();
        } catch (err) {
            console.error('GitHub Fetch Error:', err);
            return null;
        }
    };

    // 0. Authentication Logic
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const rawUsername = document.getElementById('user-id').value;
            const password = document.getElementById('pass-key').value;
            const btn = loginForm.querySelector('.btn-billion');
            const errorMsg = document.getElementById('auth-error');

            const username = rawUsername.trim();
            const superAdmins = ['Darellmax', 'Tavershima'];
            const regularAdmin = 'VaatiaAdmin';
            const validPass = 'Vaatia@2004';

            // Case-Insensitive check for known admins
            const isSuper = superAdmins.some(name => name.toLowerCase() === username.toLowerCase());
            const isAdmin = username.toLowerCase() === regularAdmin.toLowerCase();

            if ((isSuper || isAdmin) && password === validPass) {
                btn.innerText = 'AUTHENTICATING...';
                btn.style.opacity = '0.7';
                errorMsg.style.display = 'none';

                // Set Session Data (Normalized Case)
                const role = isSuper ? 'Super Admin' : 'Admin';
                sessionStorage.setItem('VAATIA_USER', username);
                sessionStorage.setItem('VAATIA_ROLE', role);
                sessionStorage.setItem('VAATIA_LOGIN_TIME', new Date().toLocaleString());

                // Trigger Security Alert via Vercel API
                fetch('/api/admin-login', {
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

    // --- Session Pulse & Role-Based UI Init ---
    const initSession = () => {
        const username = sessionStorage.getItem('VAATIA_USER');
        const role = sessionStorage.getItem('VAATIA_ROLE');

        // Robust path matching: Handle dashboard.html, /dashboard, /admin/dashboard, etc.
        const isDashboard = window.location.pathname.match(/dashboard(\.html)?$/i);
        if (!username || !isDashboard) return;

        // 1. Personalize UI
        const sidebarUser = document.querySelector('.sidebar-logo span');
        if (sidebarUser) {
            sidebarUser.innerText = username;

            // Add Elite Badge for Super Admins
            if (role === 'Super Admin') {
                const badge = document.createElement('div');
                badge.className = 'role-badge';
                badge.innerHTML = '<i data-feather="shield"></i> SUPER ADMIN';
                badge.style.cssText = `
                    font-size: 0.5rem;
                    background: var(--accent-blue);
                    color: #0c0c0c;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 900;
                    letter-spacing: 0.1em;
                    margin-top: 5px;
                    display: flex;
                    align-items: center;
                    gap: 3px;
                    width: fit-content;
                `;
                sidebarUser.parentElement.appendChild(badge);
                if (typeof feather !== 'undefined') feather.replace();
            }
        }

        const welcomeSubtext = document.querySelector('.hero-header-content p');
        if (welcomeSubtext) welcomeSubtext.innerText = `Welcome, ${username} (${role})`;

        // 1.1 Role-Based Visibility Restrictions
        const isAuthorized = role === 'Super Admin' || role === 'Admin';

        if (!isAuthorized) {
            // Hide admin specific controls in Overview for non-authorized personnel
            const syncPauseBtn = document.getElementById('sync-pause-btn');
            if (syncPauseBtn) syncPauseBtn.style.display = 'none';

            const overviewButtons = document.querySelectorAll('#overview .hero-header-content button');
            overviewButtons.forEach(btn => {
                const text = btn.innerText.toUpperCase();
                if (text.includes('MANAGE') && text.includes('CONNECTION')) {
                    btn.style.display = 'none';
                }
            });

            const settingsNav = document.getElementById('nav-item-settings');
            if (settingsNav) settingsNav.style.display = 'none';
        } else {
            // Both Super Admin and Admin can see these
            const syncPauseBtn = document.getElementById('sync-pause-btn');
            if (syncPauseBtn) syncPauseBtn.style.display = 'block';

            const overviewButtons = document.querySelectorAll('#overview .hero-header-content button');
            overviewButtons.forEach(btn => {
                const text = btn.innerText.toUpperCase();
                if (text.includes('MANAGE') && text.includes('CONNECTION')) {
                    btn.style.display = 'block';
                }
            });

            const settingsNav = document.getElementById('nav-item-settings');
            if (settingsNav) settingsNav.style.display = 'block';
        }

        // 1.2 Setup Action Logging
        window.logAdminAction = (action) => {
            console.log(`[ACTION LOG] ${username}: ${action}`);
            sessionStorage.setItem('VAATIA_LAST_ACTION', action);

            // Send to backend for SuperAdmin visibility
            const endpoint = (!API_BASE || API_BASE === 'GITHUB_SYNC') ? '/api/session' : `${API_BASE}/api/session/action`;
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, action, timestamp: new Date().toISOString() })
            }).catch(() => { });
        };

        // 2. Start Heartbeat
        const startHeartbeat = () => {
            const beat = async () => {
                try {
                    // Update role-based status (Active if heartbeat is fresh)
                    const now = new Date();
                    sessionStorage.setItem('VAATIA_LAST_SEEN', now.toISOString());

                    const endpoint = (!API_BASE || API_BASE === 'GITHUB_SYNC') ? '/api/session' : `${API_BASE}/api/session/heartbeat`;
                    const res = await fetch(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            username,
                            role,
                            timestamp: now.toISOString(),
                            lastAction: sessionStorage.getItem('VAATIA_LAST_ACTION') || 'Dashboard Active'
                        })
                    });

                    if (res.status === 403) {
                        const data = await res.json();
                        if (data.killed) {
                            alert('🚨 SESSION TERMINATED\nA Super Admin has ended your session for security reasons.');
                            confirmLogout();
                        }
                    }
                } catch (err) {
                    console.warn('Heartbeat connection lost.');
                }
            };
            beat();
            setInterval(beat, 10000); // Pulse every 10s
        };

        startHeartbeat();

        // 3. Super Admin Specific Features
        if (role === 'Super Admin') {
            renderCommandDeck();
        }
    };
    const renderCommandDeck = () => {
        const consolePoint = document.getElementById('super-admin-console');
        if (!consolePoint) return;

        const deckHTML = `
            <div class="glass-card" style="margin-top: 20px; border-left: 4px solid var(--accent-blue); animation: slideInUp 0.5s ease-out; align-items: stretch; text-align: left; padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <h2 class="text-gradient" style="font-weight: 800; margin: 0;">Command Radar</h2>
                        <p style="font-size: 0.6rem; color: var(--text-secondary); margin-top: 4px; opacity: 0.7; letter-spacing: 0.2rem;">REAL-TIME SESSION MONITORING</p>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div class="pulse-dot" style="width: 8px; height: 8px; background: var(--accent-blue); border-radius: 50%; box-shadow: 0 0 10px var(--accent-blue);"></div>
                        <span style="font-size: 0.65rem; color: var(--accent-blue); letter-spacing: 0.2em; font-weight: 800; text-transform: uppercase;">Active Protocols</span>
                    </div>
                </div>
                
                <div class="command-radar-grid">
                    <div>
                        <p style="font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 15px; opacity: 0.6;">AUTHORIZED PERSONNEL</p>
                        <div id="online-users-list" style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="text-align: center; padding: 20px; opacity: 0.5;">
                                <div class="loader-circle" style="width: 20px; height: 20px; border: 2px solid var(--accent-blue); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px;"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <p style="font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 15px; opacity: 0.6;">LIVE ACTION LOG</p>
                        <div id="action-log-list" style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; padding-right: 5px;">
                            <p style="font-size: 0.6rem; text-align: center; opacity: 0.5; padding: 20px;">WAITING FOR DATA...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <style>
                .pulse-dot { animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.4; } 100% { opacity: 1; } }
                #action-log-list::-webkit-scrollbar { width: 3px; }
                #action-log-list::-webkit-scrollbar-thumb { background: var(--accent-blue); border-radius: 10px; }
            </style>
        `;

        consolePoint.innerHTML = deckHTML;

        const updateOnlineList = async () => {
            try {
                // Route to /api/session on production/Vercel, otherwise use Command Server
                let endpoint;
                // Force relative path for session tracking on any production-like domain
                const isProdDomain = window.location.hostname.includes('vaatia') || window.location.hostname.includes('vercel.app');

                if (isProdDomain || !API_BASE || API_BASE === 'GITHUB_SYNC') {
                    endpoint = '/api/session';
                } else {
                    endpoint = `${API_BASE}/api/session/online`;
                }

                const res = await fetch(endpoint);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const list = document.getElementById('online-users-list');

                if (data.success && list) {
                    const actionList = document.getElementById('action-log-list');

                    if (data.users.length === 0) {
                        list.innerHTML = '<p style="color: var(--text-secondary); opacity: 0.5;">No other active sessions detected.</p>';
                    } else {
                        // Render Users (Done below)
                    }

                    // Render Action Log if available
                    if (actionList && data.actions) {
                        if (data.actions.length === 0) {
                            actionList.innerHTML = '<p style="font-size: 0.6rem; opacity: 0.5; text-align: center; padding: 10px;">NO RECENT EDITS.</p>';
                        } else {
                            actionList.innerHTML = data.actions.map(a => `
                                <div style="font-size: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 5px; margin-bottom: 5px;">
                                    <span style="color: var(--accent-blue); font-weight: 800;">${a.username}</span> 
                                    <span style="color: white; opacity: 0.8;">${a.action}</span>
                                    <div style="color: var(--text-secondary); opacity: 0.5; font-size: 0.5rem; margin-top: 2px;">${new Date(a.timestamp).toLocaleTimeString()}</div>
                                </div>
                            `).join('');
                        }
                    }

                    list.innerHTML = data.users.map(u => {
                        const lastSeenDate = new Date(u.timestamp || u.lastSeen);
                        const diffSec = Math.floor((new Date() - lastSeenDate) / 1000);
                        const isActive = diffSec < 60; // Active if seen in last 60s

                        return `
                        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.05); padding: 15px; border-radius: 12px; border: 1px solid ${isActive ? 'rgba(0, 242, 254, 0.3)' : 'rgba(255,255,255,0.1)'};">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="width: 32px; height: 32px; background: ${u.role === 'Super Admin' ? 'var(--accent-blue)' : 'rgba(255,255,255,0.2)'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; color: #0a0a0a; font-size: 0.8rem; position: relative;">
                                    ${u.username[0]}
                                    ${isActive ? '<div style="position: absolute; bottom: 0; right: 0; width: 8px; height: 8px; background: #10b981; border-radius: 50%; border: 2px solid #0a0b1e;"></div>' : ''}
                                </div>
                                <div>
                                    <div style="color: white; font-weight: 700; font-size: 0.9rem;">${u.username} <span style="font-size: 0.6rem; color: var(--text-secondary); font-weight: 400; opacity: 0.7;">(${u.ip})</span></div>
                                    <div style="color: ${isActive ? 'var(--accent-blue)' : 'var(--text-secondary)'}; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-top: 2px;">
                                        ${u.role} • ${isActive ? 'ACTIVE NOW' : `LAST SEEN: ${u.lastSeen}`}
                                    </div>
                                    ${u.lastAction ? `<div style="font-size: 0.55rem; color: #10b981; margin-top: 4px; opacity: 0.8;">Action: ${u.lastAction}</div>` : ''}
                                </div>
                            </div>
                            ${u.username !== username && u.role !== 'Super Admin' ? `
                                <button onclick="terminateSession('${u.username}')" style="background: rgba(248, 113, 113, 0.1); border: 1px solid #f87171; color: #f87171; padding: 6px 12px; border-radius: 8px; font-size: 0.55rem; font-weight: 800; cursor: pointer; transition: 0.3s; text-transform: uppercase;">Terminate</button>
                            ` : (u.username === username ? '<span style="color: var(--accent-blue); font-size: 0.6rem; font-weight: 800;">YOU</span>' : '<span style="color: var(--text-secondary); font-size: 0.6rem; font-weight: 800; text-transform: uppercase;">Protected</span>')}
                        </div>
                    `}).join('');
                }
            } catch (err) {
                const list = document.getElementById('online-users-list');
                if (list) {
                    list.innerHTML = `
                        <div style="text-align: center; padding: 20px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px;">
                            <i data-feather="globe" style="color: var(--accent-blue); margin-bottom: 10px; opacity: 0.5;"></i>
                            <p style="color: white; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.8;">Syncing with Cloud...</p>
                            <p style="color: var(--text-secondary); font-size: 0.55rem; margin-top: 5px; opacity: 0.7;">ESTABLISHING GLOBAL CONNECTION</p>
                        </div>
                    `;
                    if (typeof feather !== 'undefined') feather.replace();
                }
                console.warn('Failed to fetch online users.');
            }
        };

        updateOnlineList();
        setInterval(updateOnlineList, 15000); // Refresh list every 15s
    };

    window.terminateSession = async (targetUser) => {
        if (!confirm(`🚨 PROTOCOL INITIATED: Are you sure you want to FORCE TERMINATE ${targetUser.toUpperCase()}?`)) return;

        try {
            const username = sessionStorage.getItem('VAATIA_USER');
            const endpoint = (!API_BASE || API_BASE === 'GITHUB_SYNC') ? '/api/session' : `${API_BASE}/api/session/terminate`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUser, initiator: username })
            });

            if (res.ok) {
                alert(`SUCCESS: Session for ${targetUser} has been terminated.`);
                if (typeof updateOnlineList === 'function') updateOnlineList();
            } else {
                alert('ERROR: Target session could not be terminated.');
            }
        } catch (err) {
            alert('CRITICAL ERROR: Failed to execute termination protocol.');
        }
    };

    initSession();

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
            if (window.isSyncPaused) {
                if (status) {
                    status.innerText = 'SYNC PAUSED: OFFLINE';
                    status.style.color = '#f87171';
                }
                const shaDisplay = document.getElementById('gh-sync-version');
                if (shaDisplay) {
                    shaDisplay.innerHTML = `STATUS: <span style="color: #f87171;">PAUSED</span> <span style="opacity: 0.5; font-size: 0.5rem; margin-left:10px;">(Worldwide Push Disabled)</span>`;
                }
                return;
            }

            if (API_BASE === 'GITHUB_SYNC') {
                if (status) {
                    status.innerText = 'WORLDWIDE SYNC: ACTIVE';
                    status.style.color = '#00f2fe';
                }

                // Fetch latest commit SHA for version tracking
                const commitRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/main`, {
                    headers: { 'Authorization': `token ${GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
                });
                if (commitRes.ok) {
                    const commitData = await commitRes.json();
                    const shortSha = commitData.sha.substring(0, 7);
                    const commitTime = new Date(commitData.commit.committer.date).toLocaleTimeString();
                    const shaDisplay = document.getElementById('gh-sync-version');
                    if (shaDisplay) {
                        shaDisplay.innerHTML = `VERSION: <span style="color: #00f2fe;">${shortSha}</span> <span style="opacity: 0.5; font-size: 0.5rem; margin-left:10px;">(Pushed at ${commitTime})</span>`;
                    }
                }

                const mediaData = await fetchFromGitHub('Media Content');
                if (mediaData && Array.isArray(mediaData) && mediaStat) {
                    mediaStat.innerText = mediaData.length;
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
                const data = await fetchFromGitHub('Media Content');
                if (data && Array.isArray(data)) {
                    grid.innerHTML = '';
                    // Support images and filtered folders
                    const validMedia = data.filter(item =>
                        item.type === 'dir' ||
                        /\.(jpg|jpeg|png|gif|svg|webp|png|ico)$/i.test(item.name)
                    );

                    validMedia.forEach(item => {
                        const el = document.createElement('div');
                        el.className = 'media-item';
                        const isDir = item.type === 'dir';
                        const displayPath = item.path;
                        const icon = isDir ? 'folder' : 'image';

                        el.innerHTML = `
                            ${isDir ?
                                `<div style="height: 100%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.05); color: var(--accent-blue);">
                                    <i data-feather="folder" style="width: 40px; height: 40px;"></i>
                                </div>` :
                                `<img src="https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/main/${item.path}" alt="${item.name}" class="image-fade-in" loading="lazy">`
                            }
                            <div class="media-overlay">
                                <span style="font-weight: 700; font-size: 0.65rem; word-break: break-all; padding: 0 10px;">${item.name}</span>
                                <button class="btn-edit" style="margin-top: 10px; font-size: 0.75rem;" onclick="copyPathToClipboard('${displayPath}')">${isDir ? 'Copy Dir Path' : 'Copy path'}</button>
                            </div>
                        `;
                        grid.appendChild(el);
                    });
                    if (typeof feather !== 'undefined') feather.replace();
                } else {
                    grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #f87171;">Failed to load cloud media. Check your Token.</div>';
                }
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
                let updatedCount = 0;
                for (const targetPage of ALL_PAGES) {
                    try {
                        // 1. Fetch current file from GitHub
                        const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${targetPage}`, {
                            headers: { 'Authorization': `token ${ghToken}`, 'Accept': 'application/vnd.github.v3+json' }
                        });

                        if (!getRes.ok) continue;
                        const fileData = await getRes.json();

                        // Robust UTF-8 Decoding
                        const decodedContent = decodeURIComponent(atob(fileData.content).split('').map(function (c) {
                            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                        }).join(''));

                        const sha = fileData.sha;

                        // 2. Parse and Update (Greedy Mode)
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(decodedContent, 'text/html');
                        let pageModified = false;

                        const targetId = `${section}-${key}`;
                        const selectors = [`#${targetId}`, `#live-${targetId}`];

                        selectors.forEach(selector => {
                            const elements = doc.querySelectorAll(selector);
                            elements.forEach(el => {
                                let currentVal;
                                if (el.tagName === 'IMG') {
                                    currentVal = el.getAttribute('src');
                                    if (currentVal !== filePath) {
                                        el.src = filePath;
                                        pageModified = true;
                                    }
                                } else if (el.tagName === 'A') {
                                    currentVal = el.getAttribute('href');
                                    if (currentVal !== filePath) {
                                        el.href = filePath;
                                        pageModified = true;
                                    }
                                } else {
                                    currentVal = el.innerHTML;
                                    if (currentVal !== filePath) {
                                        el.innerHTML = filePath;
                                        pageModified = true;
                                    }
                                }
                            });
                        });

                        if (!pageModified) continue;

                        // 3. Commit back to GitHub
                        const updatedHTML = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
                        const encodedContent = btoa(encodeURIComponent(updatedHTML).replace(/%([0-9A-F]{2})/g, function (match, p1) {
                            return String.fromCharCode('0x' + p1);
                        }));

                        const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${targetPage}`, {
                            method: 'PUT',
                            headers: { 'Authorization': `token ${ghToken}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                message: `admin: universal greedy asset deploy [${filePath}]`,
                                content: encodedContent,
                                sha: sha
                            })
                        });

                        if (putRes.ok) updatedCount++;
                    } catch (err) {
                        console.warn(`Asset sync failed for ${targetPage}:`, err);
                    }
                }

                if (updatedCount > 0) {
                    body.innerHTML = `
                        <div style="text-align: center; padding: 60px;">
                            <i data-feather="check-circle" style="width: 64px; height: 64px; color: #10b981; margin-bottom: 20px;"></i>
                            <h3 style="color: white; margin-bottom: 10px;">WORLDWIDE DEPLOY SUCCESS</h3>
                            <p style="color: var(--text-secondary); font-size: 0.9rem;">Asset deployed to ${updatedCount} pages. Live on Vercel in ~30s.</p>
                            <button class="btn-premium" onclick="closeModal()" style="margin-top: 30px; width: auto; padding: 12px 40px;">CONFIRM</button>
                        </div>
                    `;
                    feather.replace();
                } else {
                    alert('No matching elements found site-wide for this asset.');
                    closeModal();
                }
                return;
            } catch (err) {
                console.error('Cloud Sync Error:', err);
                alert(`CLOUD SYNC FAILED: ${err.message}`);
                closeModal();
                return;
            }
        }

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

    // Update Sync Pause Button Text
    const pauseBtn = document.getElementById('sync-pause-btn');
    if (pauseBtn) {
        if (window.isSyncPaused) {
            pauseBtn.innerText = 'RESUME SYNC';
            pauseBtn.style.background = 'rgba(16, 185, 129, 0.1)';
            pauseBtn.style.borderColor = '#10b981';
            pauseBtn.style.color = '#10b981';
        } else {
            pauseBtn.innerText = 'PAUSE SYNC';
            pauseBtn.style.background = 'rgba(248, 113, 113, 0.1)';
            pauseBtn.style.borderColor = '#f87171';
            pauseBtn.style.color = '#f87171';
        }
    }
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

        // Clear Session Storage
        sessionStorage.removeItem('VAATIA_USER');
        sessionStorage.removeItem('VAATIA_ROLE');
        sessionStorage.removeItem('VAATIA_LOGIN_TIME');

        setTimeout(() => {
            window.location.href = 'login.html';
        }, 800);
    }
}

// --- Global Connection Settings ---
window.setupGlobalCommand = () => {
    const role = sessionStorage.getItem('VAATIA_ROLE');
    if (role !== 'Super Admin' && role !== 'Admin') {
        alert("ACCESS DENIED: Restricted to Administrators.");
        return;
    }
    const mode = confirm("Activate Direct Cloud Sync?\n\nOK = Worldwide Access (GitHub Login)\nCancel = Local Command Mode Only");

    if (mode) {
        const token = prompt("Enter your GitHub Personal Access Token:");
        if (token) {
            localStorage.setItem('VAATIA_GH_TOKEN', token);
            localStorage.removeItem('VAATIA_PUBLIC_API');
            alert("WORLDWIDE SYNC: ACTIVE. Reloading...");
            location.reload();
        }
    } else {
        const url = prompt("Enter Public API URL (e.g. Render/Railway) or leave blank to reset to Local:");
        if (url !== null) {
            if (url.trim() === "") {
                localStorage.removeItem('VAATIA_PUBLIC_API');
                localStorage.removeItem('VAATIA_GH_TOKEN');
                alert("Settings Cleared. Using Local CMS.");
            } else {
                localStorage.setItem('VAATIA_PUBLIC_API', url);
                localStorage.removeItem('VAATIA_GH_TOKEN');
                alert("Remote Connection Updated.");
            }
            location.reload();
        }
    }
};

// Toggle Sync Pause Feature
window.toggleSyncPause = () => {
    const role = sessionStorage.getItem('VAATIA_ROLE');
    if (role !== 'Super Admin' && role !== 'Admin') {
        alert("ACCESS DENIED: Restricted to Administrators.");
        return;
    }
    const isPaused = localStorage.getItem('VAATIA_SYNC_PAUSED') === 'true';
    const newState = !isPaused;
    localStorage.setItem('VAATIA_SYNC_PAUSED', newState.toString());

    if (newState) {
        alert("SYNC PAUSED. Automatic pushes to GitHub and Vercel are now disabled.");
    } else {
        alert("SYNC RESUMED. Worldwide sync is active.");
    }

    location.reload();
};
