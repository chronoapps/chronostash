import { S3Client, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { StorageAdapter, UploadOptions, UploadResult, StorageObject } from './interface.js';

export interface S3Config {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  accountId?: string; // For R2
}

export class S3StorageAdapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor(config: S3Config) {
    this.bucket = config.bucket;

    // Cloudflare R2 configuration
    const isR2 = config.endpoint?.includes('r2.cloudflarestorage.com') || config.accountId;
    const endpoint = isR2 && config.accountId
      ? `https://${config.accountId}.r2.cloudflarestorage.com`
      : config.endpoint;

    this.client = new S3Client({
      region: isR2 ? 'auto' : (config.region || 'us-east-1'),
      endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      forcePathStyle: !!endpoint, // Required for MinIO/R2/custom endpoints
    });
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: options.path,
        Body: options.stream,
        Metadata: options.metadata,
      },
    });

    if (options.onProgress) {
      upload.on('httpUploadProgress', (progress) => {
        options.onProgress!(progress.loaded || 0, progress.total);
      });
    }

    const result = await upload.done();

    return {
      path: options.path,
      size: 0, // TODO: Get actual size
      etag: result.ETag,
    };
  }

  async download(path: string): Promise<Readable> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    const response = await this.client.send(command);

    if (!response.Body) {
      throw new Error(`Failed to download ${path}: No body in response`);
    }

    return response.Body as Readable;
  }

  async delete(path: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });

    await this.client.send(command);
  }

  async list(prefix: string): Promise<StorageObject[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    });

    const response = await this.client.send(command);

    return (response.Contents || []).map((obj) => ({
      path: obj.Key!,
      size: obj.Size || 0,
      lastModified: obj.LastModified || new Date(),
      etag: obj.ETag,
    }));
  }

  async test(): Promise<boolean> {
    try {
      await this.list('');
      return true;
    } catch (error) {
      return false;
    }
  }
}
