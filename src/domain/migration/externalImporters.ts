import { ValidationError } from '@/lib/errors/VaultError';
import type { VaultItemEnvelope, VaultFolder } from '@/domain/vault/types';

export type ExternalFormat =
  | 'bitwarden_json'
  | 'bitwarden_csv'
  | '1password_csv'
  | 'keepass_csv'
  | 'browser_csv'
  | 'unknown';

/**
 * Parses CSV text into array of rows (handling quotes and commas).
 */
export function parseCsvRows(csvText: string): string[][] {
  const lines = csvText.trim().split(/\r?\n/);
  const rows: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    rows.push(row);
  }

  return rows;
}

/**
 * Detects the external file format automatically from header or structure.
 */
export function detectExternalFormat(content: string): ExternalFormat {
  const clean = content.trim();
  if (clean.startsWith('{') && clean.includes('"items"')) {
    return 'bitwarden_json';
  }

  const firstLine = clean.split(/\r?\n/)[0]?.toLowerCase() ?? '';
  if (firstLine.includes('folder,favorite,type,name') || firstLine.includes('login_username')) {
    return 'bitwarden_csv';
  }
  if (firstLine.includes('title,website,username,password') || firstLine.includes('1password')) {
    return '1password_csv';
  }
  if (firstLine.includes('group,title,username,password') || firstLine.includes('keepass')) {
    return 'keepass_csv';
  }
  if (
    (firstLine.includes('url') || firstLine.includes('website')) &&
    firstLine.includes('username') &&
    firstLine.includes('password')
  ) {
    return 'browser_csv';
  }

  return 'unknown';
}

/**
 * Imports and normalizes external credentials from Bitwarden, 1Password, KeePass, or Browser CSVs.
 */
export function importExternalPasswordFile(
  content: string,
  forcedFormat?: ExternalFormat
): {
  items: VaultItemEnvelope[];
  folders: VaultFolder[];
  formatDetected: ExternalFormat;
} {
  const format = forcedFormat && forcedFormat !== 'unknown' ? forcedFormat : detectExternalFormat(content);

  if (format === 'unknown') {
    throw new ValidationError(
      'Unable to detect password file format. Supported formats: Bitwarden JSON/CSV, 1Password CSV, KeePass CSV, and Chrome/Firefox/Safari CSV.'
    );
  }

  const items: VaultItemEnvelope[] = [];
  const folders: VaultFolder[] = [];
  const now = new Date().toISOString();

  if (format === 'bitwarden_json') {
    try {
      const data = JSON.parse(content);
      if (Array.isArray(data.folders)) {
        for (const f of data.folders) {
          folders.push({
            id: f.id || `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: f.name || 'Unnamed Folder',
            createdAt: now,
          });
        }
      }

      if (Array.isArray(data.items)) {
        for (const it of data.items) {
          const type = it.type === 2 ? 'secure_note' : it.type === 3 ? 'credit_card' : 'login';
          const payload: Record<string, unknown> = {};

          if (type === 'login' && it.login) {
            payload.username = it.login.username || '';
            payload.password = it.login.password || '';
            if (Array.isArray(it.login.uris) && it.login.uris[0]) {
              payload.url = it.login.uris[0].uri;
            }
            if (it.login.totp) {
              payload.totp = it.login.totp;
            }
          } else if (type === 'secure_note') {
            payload.content = it.notes || '';
          } else if (type === 'credit_card' && it.card) {
            payload.cardholderName = it.card.cardholderName || '';
            payload.cardNumber = it.card.number || '';
            payload.expiryMonth = it.card.expMonth || '';
            payload.expiryYear = it.card.expYear || '';
            payload.cvv = it.card.code || '';
          }

          items.push({
            id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            type,
            title: it.name || 'Untitled Item',
            favorite: Boolean(it.favorite),
            archived: false,
            tags: ['imported', 'bitwarden'],
            folderId: it.folderId || undefined,
            createdAt: now,
            updatedAt: now,
            payload,
          });
        }
      }
    } catch (err) {
      throw new ValidationError('Failed to parse Bitwarden JSON export', err);
    }
  } else {
    // CSV Parsers
    const rows = parseCsvRows(content);
    if (rows.length <= 1) {
      throw new ValidationError('CSV file has no data rows');
    }

    const headers = rows[0]!.map((h) => h.toLowerCase());

    const titleIdx = headers.findIndex((h) => h.includes('name') || h.includes('title'));
    const urlIdx = headers.findIndex((h) => h.includes('url') || h.includes('website') || h.includes('login_uri'));
    const userIdx = headers.findIndex((h) => h.includes('user') || h.includes('login_username'));
    const passIdx = headers.findIndex((h) => h.includes('pass') || h.includes('login_password'));
    const notesIdx = headers.findIndex((h) => h.includes('note'));
    const totpIdx = headers.findIndex((h) => h.includes('totp'));

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const title = (titleIdx !== -1 ? row[titleIdx] : '') || (urlIdx !== -1 ? row[urlIdx] : '') || 'Imported Account';
      const username = userIdx !== -1 ? row[userIdx] || '' : '';
      const password = passIdx !== -1 ? row[passIdx] || '' : '';
      const url = urlIdx !== -1 ? row[urlIdx] || '' : '';
      const notes = notesIdx !== -1 ? row[notesIdx] || '' : '';
      const totp = totpIdx !== -1 ? row[totpIdx] || '' : '';

      if (!title && !username && !password) continue;

      items.push({
        id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        type: 'login',
        title: title || 'Imported Account',
        favorite: false,
        archived: false,
        tags: ['imported', format.replace('_csv', '')],
        createdAt: now,
        updatedAt: now,
        payload: {
          username,
          password,
          url,
          notes,
          ...(totp ? { totp } : {}),
        },
      });
    }
  }

  return {
    items,
    folders,
    formatDetected: format,
  };
}
