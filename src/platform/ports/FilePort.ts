export interface SaveFileOptions {
  readonly filename: string;
  readonly mimeType?: string;
}

export interface ReadFileOptions {
  readonly accept?: string;
  readonly maxSize?: number;
}

export interface SelectedFile {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  readonly data: Uint8Array;
}

export interface FilePort {
  saveFile(data: Uint8Array | string, options: SaveFileOptions): Promise<void>;
  pickAndReadFile(options?: ReadFileOptions): Promise<SelectedFile | null>;
}
