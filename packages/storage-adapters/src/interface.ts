import { Readable } from 'stream';

export interface UploadOptions {
  stream: Readable;
  path: string;
  metadata?: Record<string, string>;
  onProgress?: (uploaded: number, total?: number) => void;
}

export interface UploadResult {
  path: string;
  size: number;
  etag?: string;
}

export interface StorageObject {
  path: string;
  size: number;
  lastModified: Date;
  etag?: string;
}

export interface StorageAdapter {
  upload(options: UploadOptions): Promise<UploadResult>;
  download(path: string): Promise<Readable>;
  delete(path: string): Promise<void>;
  list(prefix: string): Promise<StorageObject[]>;
  test(): Promise<boolean>;
}
