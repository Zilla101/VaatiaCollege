# Installing Node.js for Backend CMS

Node.js is required to run the backend server that enables live section saving.

## Quick Install Guide

### Option 1: Official Installer (Recommended - 5 minutes)

1. **Download Node.js**: [https://nodejs.org](https://nodejs.org)
   - Click the **LTS** button (Long Term Support)
   - Download for Windows
   
2. **Run the Installer**
   - Double-click the downloaded `.msi` file
   - Click "Next" through the setup
   - Accept the license agreement
   - Install with default settings
   
3. **Verify Installation**
   ```powershell
   node --version
   npm --version
   ```

4. **Install Dependencies**
   ```powershell
   cd "C:\Users\VCM SECRETARY\Desktop\VaatiaCollege"
   npm install
   ```

5. **Start the Server**
   ```powershell
   npm start
   ```

### Option 2: Portable Node.js (No Admin Required)

If you can't run installers:

1. Download portable Node.js: [https://nodejs.org/dist/latest/](https://nodejs.org/dist/latest/)
   - Get `node-vXX.X.X-win-x64.zip`
   
2. Extract to your project folder

3. Add to PATH temporarily:
   ```powershell
   $env:PATH = "C:\Users\VCM SECRETARY\Desktop\VaatiaCollege\node;$env:PATH"
   ```

## After Installation

Once Node.js is installed, you'll be able to:

✅ **Edit sections in admin panel**
✅ **Click save button**  
✅ **See changes INSTANTLY on the live website**

No manual file copying needed!

## Files Already Created

✅ `package.json` - Dependencies configuration  
✅ `server.js` - Backend API server  
✅ `admin/scripts/section-editor.js` - Updated with API calls

**Everything is ready** - just need Node.js installed!
