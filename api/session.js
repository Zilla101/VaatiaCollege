// Session Data (In-memory for Vercel — ephemeral per instance)
let mockUsers = [];

// Global Access State (In-memory fallback)
let adminAccessBlocked = false;

// GitHub Persistence Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.VAATIA_GH_TOKEN; // Ensure this env var is set in Vercel
const REPO_OWNER = 'Zilla101';
const REPO_NAME = 'VaatiaCollege';
const LOCK_FILE_PATH = 'admin-lock.json';

// Helper: Fetch Lock State from GitHub
// Helper: Fetch Lock State from GitHub (with caching)
let lockCache = {
    value: false,
    timestamp: 0
};
const CACHE_TTL = 15000; // 15 seconds

async function getGitHubLockState() {
    if (!GITHUB_TOKEN) return adminAccessBlocked; // Fallback to memory if no token

    // Check Cache
    const now = Date.now();
    if (now - lockCache.timestamp < CACHE_TTL) {
        return lockCache.value;
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${LOCK_FILE_PATH}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            console.error('GitHub Fetch Failed:', response.status);
            // FAIL-SAFE: If we have a stale value, use it. If not, default to TRUE (Locked) for safety.
            return lockCache.timestamp > 0 ? lockCache.value : true;
        }

        const data = await response.json();
        const content = JSON.parse(atob(data.content));

        // Update Cache
        lockCache = {
            value: content.adminAccessBlocked,
            timestamp: now
        };

        return content.adminAccessBlocked;
    } catch (err) {
        console.error('Failed to fetch lock state:', err);
        // FAIL-SAFE on network error
        return lockCache.timestamp > 0 ? lockCache.value : true;
    }
}

// Helper: Update Lock State on GitHub
async function setGitHubLockState(blocked, username) {
    if (!GITHUB_TOKEN) return false;
    try {
        // 1. Get current SHA
        const getRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${LOCK_FILE_PATH}`, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });
        const currentData = await getRes.json();
        const sha = currentData.sha;

        // 2. Update File
        const newContent = JSON.stringify({
            adminAccessBlocked: blocked,
            lastUpdated: new Date().toISOString(),
            updatedBy: username
        }, null, 2);

        const putRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${LOCK_FILE_PATH}`, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `[SYSTEM] ${blocked ? 'LOCKDOWN' : 'UNLOCK'} by ${username}`,
                content: btoa(newContent),
                sha: sha
            })
        });

        if (putRes.ok) {
            // Update Cache Immediately
            lockCache = {
                value: blocked,
                timestamp: Date.now()
            };
        }
        return putRes.ok;
    } catch (err) {
        console.error('Failed to update lock state:', err);
        return false;
    }
}

let mockActions = [];

export default async function handler(req, res) {
    // 🛡️ Enhanced CORS Handler for Unified Command Hub
    const origin = req.headers.origin;
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // If origin is present, echo it. If not (simple GET), default to production domain
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', 'https://vaatiacollege.vercel.app');
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { method } = req;
    const now = Date.now();

    // GET: Return full state snapshot (used by Super Admin radar + regular admin access check)
    if (method === 'GET') {
        // Sync with GitHub before responding
        adminAccessBlocked = await getGitHubLockState();

        return res.status(200).json({
            success: true,
            users: mockUsers.map(u => ({ ...u, isActive: (now - u.timestamp) < 90000 })),
            actions: (mockActions || []).slice(-15).reverse(),
            adminAccessBlocked
        });
    }

    if (method === 'POST') {
        const { username, targetUser, action, role, toggleAccess, device, isLogout } = req.body;

        // 0. Handle Admin Access Toggle (Super Admin only)
        if (toggleAccess !== undefined) {
            adminAccessBlocked = toggleAccess;

            // Persist to GitHub
            await setGitHubLockState(toggleAccess, username || 'SUPER_ADMIN');

            mockActions.push({
                username: 'SYSTEM',
                action: `${toggleAccess ? 'DENIED' : 'RESTORED'} access for regular admins`,
                timestamp: new Date().toISOString()
            });
            return res.status(200).json({ success: true, adminAccessBlocked });
        }

        // 1. Handle Terminate Protocol (Unified with Lockdown)
        if (targetUser) {
            mockUsers = mockUsers.filter(u => u.username.toLowerCase() !== targetUser.toLowerCase());
            adminAccessBlocked = true; // Ejecting an admin now triggers a system-wide block

            // Persist Lockdown
            await setGitHubLockState(true, 'SYSTEM_TERMINATOR');

            mockActions.push({
                username: 'SYSTEM',
                action: `Terminated ${targetUser} session & INITIATED LOCKDOWN`,
                timestamp: new Date().toISOString()
            });
            return res.status(200).json({ success: true, adminAccessBlocked: true });
        }

        // 2. Handle Heartbeat & Identity tracking
        // 0.1 Handle Manual Logout Signal
        if (isLogout) {
            const existingIndex = mockUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
            if (existingIndex > -1) {
                mockUsers[existingIndex].timestamp = now - 120000; // Mark as offline (outside 90s window)
                mockUsers[existingIndex].lastAction = 'Logged Out';
            }
            mockActions.push({
                username,
                action: 'Logged Out',
                timestamp: new Date().toISOString()
            });
            return res.status(200).json({ success: true, loggedOut: true });
        }

        const userRole = (role || '').trim() || 'Admin';

        // Re-sync lock state for login attempts
        adminAccessBlocked = await getGitHubLockState();

        // Block regular admins if flag is active
        if (adminAccessBlocked && !userRole.includes('Super')) {
            return res.status(403).json({
                success: false,
                blocked: true,
                adminAccessBlocked: true,
                message: 'ACCESS RESTRICTED BY SUPER ADMIN'
            });
        }

        const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'Unknown';
        const existingIndex = mockUsers.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
        const currentLoginTime = req.body.loginTime || new Date().toLocaleTimeString();

        // Parse device string into something readable
        const rawDevice = device || req.headers['user-agent'] || 'Unknown Device';
        const deviceShort = parseDevice(rawDevice);

        if (existingIndex > -1) {
            mockUsers[existingIndex] = {
                ...mockUsers[existingIndex],
                role: userRole,
                loginTime: mockUsers[existingIndex].loginTime || currentLoginTime,
                lastEdit: req.body.lastEdit || mockUsers[existingIndex].lastEdit || 'Monitoring',
                device: deviceShort,
                ip: clientIP,
                lastSeen: new Date().toLocaleTimeString(),
                timestamp: now,
                lastAction: action || mockUsers[existingIndex].lastAction || 'Active'
            };
        } else {
            mockUsers.push({
                username,
                role: userRole,
                loginTime: currentLoginTime,
                lastEdit: req.body.lastEdit || 'Session Started',
                device: deviceShort,
                ip: clientIP,
                lastSeen: new Date().toLocaleTimeString(),
                timestamp: now,
                lastAction: action || 'Login'
            });
        }

        // Action Log
        if (action) {
            mockActions.push({
                username,
                action,
                timestamp: new Date().toISOString()
            });
        }

        // Cleanup stale sessions (10 min threshold for better Vercel persistence)
        const STALE_THRESHOLD = 10 * 60 * 1000;
        mockUsers = mockUsers.filter(u => (now - u.timestamp) < STALE_THRESHOLD);

        return res.status(200).json({
            success: true,
            adminAccessBlocked,
            users: mockUsers.map(u => ({ ...u, isActive: (now - u.timestamp) < 90000 }))
        });
    }
    return res.status(405).json({ message: 'Method Not Allowed' });
}

// Parse user-agent into friendly device name (Precise OS Intelligence)
function parseDevice(ua) {
    let browser = 'Browser';
    let os = 'Unknown OS';

    // 1. Browser Detection
    if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
    else if (ua.includes('Edg')) browser = 'Edge';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';

    // 2. OS Detection (Precise)
    if (ua.includes('Windows NT 10.0')) {
        // Windows 11 uses NT 10.0 too, but some newer UAs might specify or we can infer
        os = ua.includes('Windows NT 10.0; Win64; x64') ? 'Windows 11' : 'Windows 10';
    } else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (ua.includes('iPhone')) {
        const version = ua.match(/OS (\d+)_/);
        os = version ? `iPhone(iOS ${version[1]})` : 'iPhone';
    } else if (ua.includes('iPad')) {
        const version = ua.match(/OS (\d+)_/);
        os = version ? `iPad(iOS ${version[1]})` : 'iPad';
    } else if (ua.includes('Android')) {
        const version = ua.match(/Android (\d+)/);
        os = version ? `Android ${version[1]} ` : 'Android';
    } else if (ua.includes('Mac OS X')) {
        os = 'macOS';
    } else if (ua.includes('Linux')) {
        os = 'Linux';
    }

    return `${os} (${browser})`;
}
