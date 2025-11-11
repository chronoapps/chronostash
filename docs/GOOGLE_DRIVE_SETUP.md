# Google Drive Storage Setup Guide

Complete guide to setting up Google Drive as a storage backend for ChronoStash backups.

## Prerequisites

- Google Account
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Step-by-Step Setup

### 1. Create Google Cloud Project

1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Click "Select a project" dropdown at the top
3. Click "New Project"
4. Enter project name (e.g., "ChronoStash Backups")
5. Click "Create"
6. Select your new project from the dropdown

### 2. Enable Google Drive API

1. In the Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Drive API"**
3. Click on "Google Drive API"
4. Click **"Enable"**

### 3. Configure OAuth Consent Screen

1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type (unless you have a Google Workspace)
3. Click **"Create"**
4. Fill in required fields:
   - App name: `ChronoStash Backups`
   - User support email: your email
   - Developer contact: your email
5. Click **"Save and Continue"**
6. **Scopes** section: Click **"Add or Remove Scopes"**
   - Search for "Google Drive API"
   - Select: `https://www.googleapis.com/auth/drive.file`
   - This scope allows: "See, edit, create, and delete only the specific Google Drive files you use with this app"
7. Click **"Update"** then **"Save and Continue"**
8. **Test users** section: Add your email address
9. Click **"Save and Continue"**
10. Review and click **"Back to Dashboard"**

**IMPORTANT:** If your app stays in "Testing" mode, refresh tokens expire after 7 days. To fix:
- Go to **"OAuth consent screen"**
- Click **"Publish App"**
- This removes the 7-day expiration limit

### 4. Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: Select **"Desktop app"**
4. Name: `ChronoStash Desktop Client`
5. Click **"Create"**
6. A popup will show your Client ID and Client Secret
7. **Copy and save both values** - you'll need them later

### 5. Get Refresh Token Using OAuth 2.0 Playground

#### Option A: Using Google's OAuth 2.0 Playground (Recommended)

1. Visit [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)

2. **Configure Settings:**
   - Click the **Settings icon (⚙️)** in the top right
   - Check **"Use your own OAuth credentials"**
   - Enter your **Client ID**
   - Enter your **Client Secret**
   - Close settings

3. **Authorize:**
   - In the left panel under **"Step 1"**, scroll down to **"Drive API v3"**
   - Check: `https://www.googleapis.com/auth/drive.file`
   - Click **"Authorize APIs"**
   - Sign in with your Google account
   - Review permissions and click **"Allow"**

4. **Exchange Code:**
   - In **"Step 2"**, click **"Exchange authorization code for tokens"**
   - The **Refresh token** will appear in the response
   - **Copy the Refresh token** (NOT the Access token!)

#### Option B: Using Custom Script (Advanced)

If you prefer, you can create a Node.js script:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID',
  'YOUR_CLIENT_SECRET',
  'urn:ietf:wg:oauth:2.0:oob'
);

const scopes = ['https://www.googleapis.com/auth/drive.file'];
const url = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes });

console.log('Authorize this app by visiting this URL:', url);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Enter the authorization code: ', async (code) => {
  const { tokens } = await oauth2Client.getToken(code);
  console.log('Refresh Token:', tokens.refresh_token);
  rl.close();
});
```

### 6. (Optional) Create a Dedicated Folder

If you want to store backups in a specific folder:

1. Go to [Google Drive](https://drive.google.com)
2. Create a new folder (e.g., "ChronoStash Backups")
3. Open the folder
4. Copy the folder ID from the URL:
   ```
   https://drive.google.com/drive/folders/1a2B3c4D5e6F7g8H9i0J
                                          ^^^^^^^^^^^^^^^^^^^
                                          This is the Folder ID
   ```

## Configuring ChronoStash

### In the Web UI

1. Navigate to **Storage Targets**
2. Click **"Add Storage Target"**
3. Select **"Google Drive"** as the type
4. Fill in:
   - **Name:** Any descriptive name (e.g., "Production Backups - Google Drive")
   - **Client ID:** From step 4
   - **Client Secret:** From step 4
   - **Refresh Token:** From step 5
   - **Folder ID (optional):** From step 6, or leave empty for root
5. Click **"Test Connection"** to verify
6. If successful, click **"Add Storage Target"**

### Configuration Object

If configuring programmatically, the config object looks like:

```json
{
  "name": "Google Drive Production",
  "type": "GOOGLE_DRIVE",
  "config": {
    "clientId": "123456789-abc123.apps.googleusercontent.com",
    "clientSecret": "GOCSPX-abcd1234efgh5678ijkl",
    "refreshToken": "1//0abcd1234efgh...",
    "folderId": "1a2B3c4D5e6F7g8H9i0J"  // Optional
  },
  "encryptionKey": "optional-32-character-key-here"  // Optional, for AES-256
}
```

## Troubleshooting

### Error: "401 Unauthorized" / "unauthorized_client"

**Causes:**
1. Wrong Client ID or Client Secret
2. Refresh token expired (app in Testing mode)
3. Refresh token from different Client ID

**Solutions:**
1. Verify Client ID and Client Secret match exactly
2. Publish your OAuth app (see step 3 above)
3. Generate a new refresh token using the correct Client ID/Secret

### Error: "403 Forbidden"

**Causes:**
1. Google Drive API not enabled
2. Wrong OAuth scope used
3. Refresh token doesn't have required permissions

**Solutions:**
1. Enable Google Drive API (step 2)
2. Verify you selected `drive.file` scope, not `drive` or `drive.readonly`
3. Generate new refresh token with correct scope

### Error: "404 Not Found" (when using Folder ID)

**Cause:** Folder ID is incorrect or folder was deleted

**Solution:**
1. Verify the folder exists in Google Drive
2. Check you copied the folder ID correctly from the URL
3. Try leaving Folder ID empty (uses root directory)

### Refresh Token Expires After 7 Days

**Cause:** OAuth app is in "Testing" status

**Solution:**
1. Go to OAuth consent screen
2. Click "Publish App"
3. Generate a new refresh token after publishing

### "Access token expired" during backup

**Cause:** This is normal - refresh tokens automatically generate new access tokens

**Solution:** No action needed - the library handles this automatically

## Security Best Practices

1. **Never commit credentials to version control**
   - Store Client ID/Secret in environment variables or secrets manager
   - Never hardcode in source code

2. **Use least-privilege scope**
   - `drive.file` only allows access to files created by the app
   - Avoid `drive` scope (full Google Drive access)

3. **Enable 2FA on Google Account**
   - Protects against unauthorized access

4. **Rotate refresh tokens periodically**
   - Generate new tokens every 90 days
   - Revoke old tokens

5. **Monitor API usage**
   - Check Google Cloud Console for unusual activity
   - Set up usage alerts

6. **Use encryption**
   - Always set an encryption key for sensitive backups
   - Use 32-character random string for AES-256

## API Quotas and Limits

Google Drive API has the following limits:

- **Queries per day:** 1,000,000,000 (1 billion)
- **Queries per 100 seconds per user:** 1,000
- **Upload size:** Up to 5TB per file

For ChronoStash usage:
- Daily backups: Well within limits
- Multiple hourly backups: Should be fine
- Very large databases (>100GB): May take time but supported

To check quota usage:
1. Go to Google Cloud Console
2. **"APIs & Services"** → **"Quotas"**
3. Search for "Google Drive API"

## FAQ

**Q: Can I use a service account instead of OAuth?**
A: Yes, but not recommended. Service accounts work for Google Workspace domains but require additional setup. OAuth is simpler for most use cases.

**Q: What happens if my Google Drive runs out of space?**
A: Backups will fail with a storage quota error. ChronoStash will mark the backup as failed and send notifications if configured.

**Q: Can I share the folder with other users?**
A: Yes, you can share the folder in Google Drive normally. The app will only manage files it created.

**Q: Does ChronoStash delete files from Google Drive?**
A: Only when retention policies delete old backups. Manual backups are never auto-deleted.

**Q: Can I use multiple Google accounts?**
A: Yes, create separate storage targets for each account with different OAuth credentials.

## Additional Resources

- [Google Drive API Documentation](https://developers.google.com/drive/api/guides/about-sdk)
- [OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Quotas](https://developers.google.com/drive/api/guides/limits)
- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)

## Need Help?

If you encounter issues not covered here:

1. Check the ChronoStash backend logs for detailed error messages
2. Verify all steps were followed correctly
3. Test connection in the UI - it provides specific error messages
4. Open an issue with:
   - Error message (redact credentials!)
   - Steps you followed
   - OAuth consent screen status (Testing vs Published)
