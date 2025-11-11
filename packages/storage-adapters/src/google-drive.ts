import { google, drive_v3 } from 'googleapis';
import { Readable } from 'stream';
import { StorageAdapter, UploadOptions, UploadResult, StorageObject } from './interface.js';

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  folderId?: string; // Optional folder ID to upload to
}

export class GoogleDriveStorageAdapter implements StorageAdapter {
  private drive: drive_v3.Drive;
  private folderId?: string;
  private oauth2Client: any;

  constructor(config: GoogleDriveConfig) {
    if (!config.clientId || !config.clientSecret || !config.refreshToken) {
      throw new Error('Google Drive requires clientId, clientSecret, and refreshToken');
    }

    this.oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      'urn:ietf:wg:oauth:2.0:oob' // For server-side apps
    );

    // Set credentials with only refresh token (no access token)
    // This forces the library to refresh on first request
    this.oauth2Client.setCredentials({
      refresh_token: config.refreshToken,
    });

    // Listen for token refresh events to capture new tokens
    this.oauth2Client.on('tokens', (tokens: any) => {
      if (tokens.refresh_token) {
        // If a new refresh token is provided, log it (though this is rare)
        console.log('[GoogleDrive] New refresh token received (store this securely)');
      }
      if (tokens.access_token) {
        console.log('[GoogleDrive] Access token refreshed successfully', {
          expires_in: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : 'unknown'
        });
      }
    });

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    this.folderId = config.folderId;
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    try {
      const fileMetadata: drive_v3.Schema$File = {
        name: options.path.split('/').pop() || options.path,
        parents: this.folderId ? [this.folderId] : undefined,
      };

      // Check if file already exists
      const existingFile = await this.findFileByPath(options.path);

      let response;
      if (existingFile) {
        // Update existing file
        response = await this.drive.files.update({
          fileId: existingFile.id!,
          media: {
            body: options.stream,
          },
          fields: 'id,name,size,modifiedTime,md5Checksum',
        });
      } else {
        // Create new file
        response = await this.drive.files.create({
          requestBody: fileMetadata,
          media: {
            body: options.stream,
          },
          fields: 'id,name,size,modifiedTime,md5Checksum',
        });
      }

      const file = response.data;

      return {
        path: options.path,
        size: parseInt(file.size || '0', 10),
        etag: file.md5Checksum || undefined,
      };
    } catch (error: any) {
      // Log the full error details for diagnostics
      console.error('[GoogleDrive] Upload failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });

      if (error.response?.status === 401) {
        // Extract more details from the error response
        const errorDetails = error.response?.data?.error;
        const errorDescription = errorDetails?.error_description || errorDetails?.message || '';

        let actionableMessage = 'Google Drive authentication failed during upload. ';

        if (errorDescription.includes('Token has been expired or revoked')) {
          actionableMessage += 'Your refresh token has expired. This commonly happens when:\n' +
            '1. Your OAuth app is in "Testing" mode (tokens expire after 7 days)\n' +
            '2. The user revoked access\n' +
            '3. The refresh token is invalid\n\n' +
            'Actions to fix:\n' +
            '- Publish your OAuth app in Google Cloud Console to remove 7-day limit\n' +
            '- Generate a new refresh token\n' +
            '- See docs/GOOGLE_DRIVE_SETUP.md for detailed instructions';
        } else if (errorDescription.includes('invalid_client')) {
          actionableMessage += 'Invalid Client ID or Client Secret. The credentials do not match.\n' +
            'Verify your Client ID and Client Secret are correct in the Storage Target configuration.';
        } else {
          actionableMessage += `Authentication error: ${errorDescription}\n` +
            'Your refresh token may have expired or been revoked.\n' +
            'See docs/GOOGLE_DRIVE_SETUP.md for troubleshooting steps.';
        }

        throw new Error(actionableMessage);
      } else if (error.response?.status === 403) {
        throw new Error('Insufficient permissions to upload to Google Drive. Check your OAuth scopes.\n' +
          'Required scope: https://www.googleapis.com/auth/drive.file\n' +
          'Ensure the Google Drive API is enabled in your Google Cloud project.');
      } else if (error.response?.status === 404 && this.folderId) {
        throw new Error(`Google Drive folder '${this.folderId}' not found. Please verify the folder ID.\n` +
          'The folder may have been deleted or you may not have access to it.');
      }
      throw new Error(`Failed to upload to Google Drive: ${error.message}`);
    }
  }

  async download(path: string): Promise<Readable> {
    try {
      const file = await this.findFileByPath(path);

      if (!file || !file.id) {
        throw new Error(`File not found: ${path}`);
      }

      const response = await this.drive.files.get(
        {
          fileId: file.id,
          alt: 'media',
        },
        { responseType: 'stream' }
      );

      return response.data as unknown as Readable;
    } catch (error: any) {
      // Log diagnostics for auth errors
      if (error.response?.status === 401) {
        console.error('[GoogleDrive] Download authentication failed:', error.response?.data);
        throw new Error('Google Drive authentication failed during download. Your refresh token may have expired. See upload errors for troubleshooting steps.');
      }
      throw error;
    }
  }

  async delete(path: string): Promise<void> {
    try {
      const file = await this.findFileByPath(path);

      if (!file || !file.id) {
        throw new Error(`File not found: ${path}`);
      }

      await this.drive.files.delete({
        fileId: file.id,
      });
    } catch (error: any) {
      // Log diagnostics for auth errors
      if (error.response?.status === 401) {
        console.error('[GoogleDrive] Delete authentication failed:', error.response?.data);
        throw new Error('Google Drive authentication failed during delete. Your refresh token may have expired. See upload errors for troubleshooting steps.');
      }
      throw error;
    }
  }

  async list(prefix: string): Promise<StorageObject[]> {
    const query = this.folderId
      ? `'${this.folderId}' in parents and trashed=false`
      : 'trashed=false';

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id,name,size,modifiedTime,md5Checksum)',
      orderBy: 'modifiedTime desc',
    });

    const files = response.data.files || [];

    return files
      .filter((file: any) => file.name?.startsWith(prefix) || !prefix)
      .map((file: any) => ({
        path: file.name || '',
        size: parseInt(file.size || '0', 10),
        lastModified: file.modifiedTime ? new Date(file.modifiedTime) : new Date(),
        etag: file.md5Checksum || undefined,
      }));
  }

  async test(): Promise<boolean> {
    try {
      // Try to list files to verify credentials
      await this.drive.files.list({
        pageSize: 1,
        fields: 'files(id)',
      });
      console.log('[GoogleDrive] Connection test successful');
      return true;
    } catch (error: any) {
      // Log the full error details for diagnostics
      console.error('[GoogleDrive] Connection test failed:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code,
      });

      // Provide specific error messages for OAuth issues
      if (error.response?.status === 401) {
        const errorDetails = error.response?.data?.error;
        const errorDescription = errorDetails?.error_description || errorDetails?.message || '';

        let actionableMessage = 'Google Drive authentication failed. ';

        if (errorDescription.includes('Token has been expired or revoked')) {
          actionableMessage += 'Your refresh token has expired. This commonly happens when:\n' +
            '1. Your OAuth app is in "Testing" mode (tokens expire after 7 days) - PUBLISH your app to fix\n' +
            '2. The user revoked access in their Google account\n' +
            '3. The refresh token is invalid\n\n' +
            'Actions to fix:\n' +
            '- Go to Google Cloud Console → OAuth consent screen → Click "Publish App"\n' +
            '- Generate a new refresh token using OAuth 2.0 Playground\n' +
            '- See docs/GOOGLE_DRIVE_SETUP.md for step-by-step instructions';
        } else if (errorDescription.includes('invalid_client')) {
          actionableMessage += 'Invalid Client ID or Client Secret.\n' +
            'The Client ID and Client Secret do not match or are incorrect.\n\n' +
            'Actions to fix:\n' +
            '- Verify you copied the correct Client ID and Client Secret from Google Cloud Console\n' +
            '- Ensure the refresh token was generated using the SAME Client ID/Secret\n' +
            '- Check for extra spaces or characters when copying credentials';
        } else {
          actionableMessage += `Authentication error: ${errorDescription || 'Unknown error'}\n\n` +
            'Common issues:\n' +
            '1. Invalid refresh token\n' +
            '2. Client ID/Secret mismatch\n' +
            '3. OAuth consent screen not configured correctly\n' +
            '4. App in Testing mode (tokens expire after 7 days)\n\n' +
            'See docs/GOOGLE_DRIVE_SETUP.md for troubleshooting steps.';
        }

        throw new Error(actionableMessage);
      } else if (error.response?.status === 403) {
        throw new Error(
          'Google Drive access denied. Ensure:\n' +
          '1. The Google Drive API is enabled in your Google Cloud project\n' +
          '2. The OAuth scope includes "https://www.googleapis.com/auth/drive.file"\n' +
          '3. Your refresh token was generated with the correct scope\n\n' +
          'To fix: Go to Google Cloud Console → APIs & Services → Library → Enable "Google Drive API"'
        );
      }
      throw new Error(`Google Drive test failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Find a file by its path/name
   * @private
   */
  private async findFileByPath(path: string): Promise<drive_v3.Schema$File | null> {
    const fileName = path.split('/').pop() || path;
    const query = this.folderId
      ? `name='${fileName}' and '${this.folderId}' in parents and trashed=false`
      : `name='${fileName}' and trashed=false`;

    const response = await this.drive.files.list({
      q: query,
      fields: 'files(id,name,size,modifiedTime,md5Checksum)',
      pageSize: 1,
    });

    const files = response.data.files || [];
    return files.length > 0 ? files[0] : null;
  }
}
