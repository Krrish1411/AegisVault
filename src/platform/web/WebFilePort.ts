import type { FilePort, ReadFileOptions, SaveFileOptions, SelectedFile } from '../ports/FilePort';

export class WebFilePort implements FilePort {
  async saveFile(data: Uint8Array | string, options: SaveFileOptions): Promise<void> {
    const blob =
      typeof data === 'string'
        ? new Blob([data], { type: options.mimeType ?? 'text/plain;charset=utf-8' })
        : new Blob([data], { type: options.mimeType ?? 'application/octet-stream' });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = options.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async pickAndReadFile(options?: ReadFileOptions): Promise<SelectedFile | null> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      if (options?.accept) {
        input.accept = options.accept;
      }

      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        if (options?.maxSize && file.size > options.maxSize) {
          reject(new Error(`File size ${file.size} exceeds maximum ${options.maxSize}`));
          return;
        }

        try {
          const buffer = await file.arrayBuffer();
          resolve({
            name: file.name,
            size: file.size,
            type: file.type,
            data: new Uint8Array(buffer),
          });
        } catch (err) {
          reject(err);
        }
      };

      input.click();
    });
  }
}

export const webFilePort = new WebFilePort();
