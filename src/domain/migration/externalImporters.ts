import { ValidationError } from '@/lib/errors/VaultError';
import type { VaultItemEnvelope, VaultFolder } from '@/domain/vault/types';

export type ExternalFormat =
  | 'bitwarden_json'
  | 'bitwarden_csv'
  | '1password_csv'
  | 'lastpass_csv'
  | 'dashlane_csv'
  | 'keepass_csv'
  | 'chrome_csv'
  | 'firefox_csv'
  | 'safari_csv'
  | 'proton_csv'
  | 'roboform_csv'
  | 'enpass_csv'
  | 'browser_csv'
  | 'generic_csv'
  | 'unknown';

/**
 * Parses CSV text strictly following RFC 4180.
 * Handles multiline quoted fields, escaped quotes (""), commas, and mixed CRLF/LF line endings.
 */
export function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  const len = csvText.length;

  for (let i = 0; i < len; i++) {
    const char = csvText[i];

    if (char === '"') {
      if (inQuotes) {
        if (i + 1 < len && csvText[i + 1] === '"') {
          // Escaped quote: "" -> "
          currentCell += '"';
          i++; // Skip the second quote
        } else {
          // Closing quote
          inQuotes = false;
        }
      } else {
        // Opening quote
        inQuotes = true;
      }
    } else if (char === ',' && !inQuotes) {
      // Cell delimiter
      currentRow.push(currentCell);
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      // Row delimiter
      if (char === '\r' && i + 1 < len && csvText[i + 1] === '\n') {
        i++; // Consume \n in \r\n
      }
      currentRow.push(currentCell);
      currentCell = '';
      if (currentRow.some((cell) => cell.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      // Regular character (or newline within quoted string)
      currentCell += char;
    }
  }

  // Flush remaining cell and row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((cell) => cell.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

/**
 * Matches a column index against an ordered priority list of candidate header names.
 * Tests exact case-insensitive match first to avoid false positives (e.g. "name" vs "login name").
 */
function getColumnIndex(headers: string[], candidates: string[]): number {
  const cleanHeaders = headers.map((h) => h.toLowerCase().trim().replace(/^["']|["']$/g, ''));
  const normalizedHeaders = cleanHeaders.map((h) => h.replace(/[-_]/g, ' ').replace(/\s+/g, ' '));

  // 1. Exact match pass (with separator normalization)
  for (const candidate of candidates) {
    const target = candidate.toLowerCase();
    const targetNorm = target.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
    const idx = cleanHeaders.findIndex((h, i) => h === target || normalizedHeaders[i] === targetNorm);
    if (idx !== -1) return idx;
  }

  // 2. Contains match pass (for compound headers like "login username" or "web site")
  for (const candidate of candidates) {
    const target = candidate.toLowerCase();
    const targetNorm = target.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
    const idx = cleanHeaders.findIndex((h, i) => h.includes(target) || normalizedHeaders[i]!.includes(targetNorm));
    if (idx !== -1) return idx;
  }

  return -1;
}

/**
 * Detects the external file format automatically from header, structure, or signature.
 */
export function detectExternalFormat(content: string): ExternalFormat {
  const clean = content.trim();

  // JSON detection
  if (clean.startsWith('{')) {
    if (clean.includes('"items"') && (clean.includes('"folders"') || clean.includes('"encrypted"'))) {
      return 'bitwarden_json';
    }
    if (clean.includes('"AUTHENTICATOR"') || clean.includes('"accounts"')) {
      return 'dashlane_csv'; // Dashlane export bundle
    }
  }

  const firstLine = clean.split(/\r?\n/)[0]?.toLowerCase() ?? '';

  // 1. Bitwarden CSV
  if (firstLine.includes('login_username') || firstLine.includes('folder,favorite,type,name')) {
    return 'bitwarden_csv';
  }

  // 2. LastPass CSV
  if (firstLine.includes('grouping') && firstLine.includes('fav') && firstLine.includes('extra')) {
    return 'lastpass_csv';
  }

  // 3. Dashlane CSV
  if (firstLine.includes('secondary_password') || (firstLine.includes('company') && firstLine.includes('login'))) {
    return 'dashlane_csv';
  }

  // 4. KeePass CSV
  if (firstLine.includes('group,title') || (firstLine.includes('account') && firstLine.includes('login name'))) {
    return 'keepass_csv';
  }

  // 5. Firefox CSV
  if (firstLine.includes('httprealm') || firstLine.includes('formactionorigin')) {
    return 'firefox_csv';
  }

  // 6. Safari / Apple Passwords CSV
  if (firstLine.includes('otpauth') || (firstLine.includes('title,url,username,password') && firstLine.includes('notes'))) {
    return 'safari_csv';
  }

  // 7. 1Password CSV
  if (firstLine.includes('title,website,username,password') || firstLine.includes('1password')) {
    return '1password_csv';
  }

  // 8. Proton Pass CSV
  if (firstLine.includes('name,url,username,password,note,totp')) {
    return 'proton_csv';
  }

  // 9. RoboForm CSV
  if (firstLine.includes('pwd') && firstLine.includes('login')) {
    return 'roboform_csv';
  }

  // 10. Enpass CSV
  if (firstLine.includes('enpass') || firstLine.includes('field 1')) {
    return 'enpass_csv';
  }

  // 11. Chrome / Generic Browser CSV
  if (
    (firstLine.includes('url') || firstLine.includes('website')) &&
    (firstLine.includes('username') || firstLine.includes('user') || firstLine.includes('login') || firstLine.includes('email') || firstLine.includes('mail')) &&
    (firstLine.includes('password') || firstLine.includes('pwd'))
  ) {
    return 'browser_csv';
  }

  return 'generic_csv';
}

/**
 * Imports and normalizes external credentials from all major password managers:
 * Bitwarden (JSON/CSV), 1Password, LastPass, Dashlane, KeePass, Chrome, Firefox, Safari, Proton Pass, RoboForm, Enpass.
 */
export function importExternalPasswordFile(
  content: string,
  forcedFormat?: ExternalFormat
): {
  items: VaultItemEnvelope[];
  folders: VaultFolder[];
  formatDetected: ExternalFormat;
} {
  const detected = detectExternalFormat(content);
  const format = forcedFormat && forcedFormat !== 'unknown' ? forcedFormat : detected;

  if (format === 'unknown') {
    throw new ValidationError(
      'Unable to detect password file format. Supported formats: Bitwarden (JSON/CSV), 1Password, LastPass, Dashlane, KeePass, Chrome, Firefox, Safari, and Proton Pass.'
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
            const primaryUri = Array.isArray(it.login.uris) && it.login.uris[0] ? it.login.uris[0].uri : '';
            payload.url = primaryUri;
            payload.urls = primaryUri ? [primaryUri] : [];
            if (it.login.totp) {
              payload.totp = it.login.totp;
              payload.totpSecret = it.login.totp;
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
    // RFC 4180 CSV Engine for all CSV-based password managers
    const rows = parseCsvRows(content);
    if (rows.length <= 1) {
      throw new ValidationError('CSV file has no data rows');
    }

    const headers = rows[0]!;

    // Exhaustive candidate lists covering Bitwarden, 1Password, LastPass, Dashlane, KeePass, Safari, Chrome, Firefox, Proton, RoboForm
    const titleIdx = getColumnIndex(headers, ['title', 'name', 'account', 'entry', 'service', 'item name']);
    const userIdx = getColumnIndex(headers, [
      'login_username',
      'username',
      'login name',
      'user name',
      'login',
      'user id',
      'userid',
      'client id',
      'account name',
      'user',
    ]);
    const emailIdx = getColumnIndex(headers, [
      'email id',
      'email_id',
      'email-id',
      'emailid',
      'email address',
      'email_address',
      'e-mail id',
      'e-mail',
      'e-mail address',
      'email',
      'user email',
      'user_email',
      'login email',
      'login_email',
      'mail',
      'account email',
      'account_email',
    ]);
    const passIdx = getColumnIndex(headers, ['login_password', 'password', 'pwd', 'pass', 'code']);
    const urlIdx = getColumnIndex(headers, [
      'login_uri',
      'website',
      'web site',
      'url',
      'login url',
      'link',
      'address',
      'hostname',
    ]);
    const notesIdx = getColumnIndex(headers, ['notes', 'note', 'comments', 'comment', 'extra', 'description']);
    const totpIdx = getColumnIndex(headers, [
      'login_totp',
      'totp',
      'otp',
      'otpauth',
      'one-time password',
      '2fa',
      'auth',
      'secret key',
    ]);
    const folderIdx = getColumnIndex(headers, ['folder', 'group', 'grouping', 'category']);
    const favIdx = getColumnIndex(headers, ['favorite', 'fav']);

    // Map discovered folders
    const folderMap = new Map<string, string>();

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length === 0) continue;

      const rawTitle = titleIdx !== -1 ? (row[titleIdx] ?? '').trim() : '';
      const rawUserCandidate = userIdx !== -1 ? (row[userIdx] ?? '').trim() : '';
      const rawEmailCandidate = emailIdx !== -1 ? (row[emailIdx] ?? '').trim() : '';

      // Fallback: If rawUserCandidate is empty, check rawEmailCandidate
      let finalUser = rawUserCandidate || rawEmailCandidate;

      // Deep fallback: If still empty, scan row cells for any email-like string
      if (!finalUser) {
        for (let c = 0; c < row.length; c++) {
          if (c === passIdx || c === urlIdx || c === totpIdx) continue;
          const cellVal = (row[c] ?? '').trim();
          if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cellVal)) {
            finalUser = cellVal;
            break;
          }
        }
      }

      // Preserve exact password string (do NOT trim whitespace from passwords)
      const rawPass = passIdx !== -1 ? (row[passIdx] ?? '') : '';
      const rawUrl = urlIdx !== -1 ? (row[urlIdx] ?? '').trim() : '';
      const rawNotes = notesIdx !== -1 ? (row[notesIdx] ?? '').trim() : '';
      const rawTotp = totpIdx !== -1 ? (row[totpIdx] ?? '').trim() : '';
      const rawFolder = folderIdx !== -1 ? (row[folderIdx] ?? '').trim() : '';
      const rawFav = favIdx !== -1 ? (row[favIdx] ?? '').trim() : '';

      // Skip completely empty rows
      if (!rawTitle && !finalUser && !rawPass && !rawUrl) continue;

      // Extract title fallback
      const title = rawTitle || (rawUrl ? rawUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0] : '') || 'Imported Account';

      // Folder association
      let folderId: string | undefined = undefined;
      if (rawFolder) {
        if (!folderMap.has(rawFolder)) {
          const newFolderId = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          folders.push({
            id: newFolderId,
            name: rawFolder,
            createdAt: now,
          });
          folderMap.set(rawFolder, newFolderId);
        }
        folderId = folderMap.get(rawFolder);
      }

      const isFavorite = rawFav === '1' || rawFav.toLowerCase() === 'true' || rawFav.toLowerCase() === 'yes';

      const tagSource = format === 'browser_csv' ? 'browser' : format.replace('_csv', '');

      items.push({
        id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${r}`,
        type: 'login',
        title,
        favorite: isFavorite,
        archived: false,
        folderId,
        tags: ['imported', tagSource],
        createdAt: now,
        updatedAt: now,
        payload: {
          username: finalUser,
          ...(rawEmailCandidate && rawEmailCandidate !== finalUser ? { email: rawEmailCandidate } : {}),
          password: rawPass,
          url: rawUrl,
          urls: rawUrl ? [rawUrl] : [],
          notes: rawNotes,
          ...(rawTotp ? { totp: rawTotp, totpSecret: rawTotp } : {}),
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
