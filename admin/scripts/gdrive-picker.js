// --- Google Drive Picker Integration ---
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';
let pickerApiLoaded = false;
let gisLoaded = false;
let tokenClient = null;
let accessToken = null;

// Dynamically load Google APIs
function loadGoogleAPIs() {
    if (document.getElementById('google-api-script')) return; // Already loaded

    const gapiScript = document.createElement('script');
    gapiScript.id = 'google-api-script';
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
        gapi.load('picker', () => {
            pickerApiLoaded = true;
            checkGoogleDriveReady();
        });
    };
    document.body.appendChild(gapiScript);

    const gisScript = document.createElement('script');
    gisScript.id = 'google-gis-script';
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.async = true;
    gisScript.defer = true;
    gisScript.onload = () => {
        gisLoaded = true;
        checkGoogleDriveReady();
    };
    document.body.appendChild(gisScript);
}

function checkGoogleDriveReady() {
    if (pickerApiLoaded && gisLoaded) {
        initGoogleDrive();
    }
}

window.initGoogleDrive = () => {
    const clientId = localStorage.getItem('VAATIA_GOOGLE_CLIENT_ID');
    const apiKey = localStorage.getItem('VAATIA_GOOGLE_API_KEY');

    const gdriveBtn = document.getElementById('gdrive-picker-btn');

    if (!clientId || !apiKey) {
        if (gdriveBtn) gdriveBtn.style.display = 'none';
        return;
    }

    if (!pickerApiLoaded || !gisLoaded) {
        // Scripts not loaded yet, initiate load
        loadGoogleAPIs();
        return;
    }

    try {
        tokenClient = google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: (response) => {
                if (response.error !== undefined) {
                    throw (response);
                }
                accessToken = response.access_token;
                createPicker(apiKey);
            },
        });

        if (gdriveBtn) {
            gdriveBtn.style.display = 'flex'; // Show button
        }
    } catch (err) {
        console.error('Error initializing Google Drive token client', err);
    }
};

window.openGoogleDrivePicker = () => {
    const clientId = localStorage.getItem('VAATIA_GOOGLE_CLIENT_ID');
    const apiKey = localStorage.getItem('VAATIA_GOOGLE_API_KEY');

    if (!clientId || !apiKey) {
        window.showCustomAlert('Please configure Google Drive API keys in System Connections first.', 'Missing Credentials', true);
        return;
    }

    if (accessToken) {
        createPicker(apiKey);
    } else {
        tokenClient.requestAccessToken({ prompt: 'consent' });
    }
};

function createPicker(apiKey) {
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS);
    view.setMimeTypes('image/png,image/jpeg,image/jpg,image/webp,video/mp4');

    const picker = new google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(accessToken)
        .setDeveloperKey(apiKey)
        .setCallback(pickerCallback)
        .build();
    picker.setVisible(true);
}

async function pickerCallback(data) {
    if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const doc = data[google.picker.Response.DOCUMENTS][0];
        const url = doc[google.picker.Document.URL];

        // Pass the picked URL to the existing import function
        importFromPickedLink(url);
    }
}

async function importFromPickedLink(url) {
    try {
        const mediaHeader = document.querySelector('#media .section-header');
        let originalHTML = '';
        if (mediaHeader) {
            originalHTML = mediaHeader.innerHTML;
            mediaHeader.innerHTML = `
                <div>
                    <h1 class="text-gradient">Importing from Drive...</h1>
                    <p style="color: var(--accent-blue); letter-spacing: 0.2em; font-size: 0.7rem; font-weight: 800; animation: pulse 1.5s infinite;">
                        DOWNLOADING SELECTED ASSET
                    </p>
                </div>
                <div class="loader-circle" style="width: 30px; height: 30px; border: 2px solid var(--accent-blue); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            `;
        } else {
            window.showCustomAlert('Importing... Please wait.', 'Downloading Asset');
        }

        const response = await fetch(`${window.API_BASE || ''}/api/import-link`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });

        const result = await response.json();

        if (mediaHeader) {
            mediaHeader.innerHTML = originalHTML;
            if (typeof feather !== 'undefined') feather.replace();
        }

        if (result.success) {
            window.showCustomAlert(`Asset imported successfully: ${result.fileName}`, 'Import Complete');
            if (typeof loadMedia === 'function') loadMedia();
            if (typeof updateStats === 'function') updateStats();
        } else {
            window.showCustomAlert('Failed to import: ' + (result.error || 'Unknown error'), 'Import Failed', true);
        }
    } catch (err) {
        console.error('Import failed', err);
        window.showCustomAlert('Connection error while importing.', 'Import Failed', true);
    }
}

// Call init on load
document.addEventListener('DOMContentLoaded', () => {
    // Only init if credentials exist
    if (localStorage.getItem('VAATIA_GOOGLE_CLIENT_ID') && localStorage.getItem('VAATIA_GOOGLE_API_KEY')) {
        loadGoogleAPIs();
    }
});
