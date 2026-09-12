import { describe, it, expect } from 'vitest';
import {
  detectExternalFormat,
  importExternalPasswordFile,
  parseCsvRows,
} from './externalImporters';

describe('externalImporters (Universal Multi-Manager & RFC 4180 Importer)', () => {
  const BITWARDEN_JSON = JSON.stringify({
    folders: [{ id: 'f-1', name: 'Personal' }],
    items: [
      {
        id: 'bw-1',
        type: 1,
        name: 'GitHub Account',
        favorite: true,
        folderId: 'f-1',
        login: {
          username: 'octocat',
          password: 'Password123!',
          uris: [{ uri: 'https://github.com' }],
          totp: 'JBSWY3DPEHPK3PXP',
        },
      },
      {
        id: 'bw-2',
        type: 2,
        name: 'Server SSH Notes',
        notes: 'Private server configuration notes',
      },
    ],
  });

  const BITWARDEN_CSV = `folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp
Personal,1,login,Google,Primary email,,0,https://accounts.google.com,user@gmail.com,GoogleSecretPass123!,otpauth://totp/Google:user?secret=JBSWY3DPEHPK3PXP`;

  const ONEPASSWORD_CSV = `title,website,username,password,notes
AWS Console,https://aws.amazon.com,cloud-admin,AwsPass456!,Root account`;

  const LASTPASS_CSV = `url,username,password,totp,extra,name,grouping,fav
https://netflix.com,krish@example.com,NetflixPass#1,s3cr3t,Shared family account,Netflix,Entertainment,1`;

  const DASHLANE_CSV = `title,company,email,login,password,secondary_password,url,comments
Spotify,Spotify AB,krish@music.com,krish_dj,SpotifyPass!77,,https://spotify.com,Premium family`;

  const KEEPASS_CSV = `Account,Login Name,Password,Web Site,Comments
Chase Bank,chaseuser99,ChaseStrongPass$$,https://chase.com,Personal checking`;

  const BROWSER_CSV = `name,url,username,password
Dropbox,https://dropbox.com,dropboxuser,DropboxPass999!`;

  const SAFARI_CSV = `Title,URL,Username,Password,Notes,OTPAuth
Apple ID,https://appleid.apple.com,krish@icloud.com,AppleSecretPass!,,otpauth://totp/Apple:krish@icloud.com?secret=TEST2FA`;

  const PROTON_CSV = `name,url,username,password,note,totp
Proton Mail,https://proton.me,krish@pm.me,ProtonPass2026!,Encrypted mail,JBSWY3DPEHPK3PXP`;

  const MULTILINE_RFC4180_CSV = `title,url,username,password,notes
"Server Notes","https://ssh.internal","root","  password with spaces  ","Line 1 of multiline notes
Line 2 with ""escaped quotes"" and, commas
Line 3 final"`;

  it('should auto-detect all major password manager formats', () => {
    expect(detectExternalFormat(BITWARDEN_JSON)).toBe('bitwarden_json');
    expect(detectExternalFormat(BITWARDEN_CSV)).toBe('bitwarden_csv');
    expect(detectExternalFormat(ONEPASSWORD_CSV)).toBe('1password_csv');
    expect(detectExternalFormat(LASTPASS_CSV)).toBe('lastpass_csv');
    expect(detectExternalFormat(DASHLANE_CSV)).toBe('dashlane_csv');
    expect(detectExternalFormat(KEEPASS_CSV)).toBe('keepass_csv');
    expect(detectExternalFormat(BROWSER_CSV)).toBe('browser_csv');
    expect(detectExternalFormat(SAFARI_CSV)).toBe('safari_csv');
    expect(detectExternalFormat(PROTON_CSV)).toBe('proton_csv');
  });

  it('should correctly parse RFC 4180 multiline CSV cells with newlines and escaped quotes', () => {
    const rows = parseCsvRows(MULTILINE_RFC4180_CSV);
    expect(rows.length).toBe(2); // Header row + 1 data row
    expect(rows[1]![0]).toBe('Server Notes');
    expect(rows[1]![2]).toBe('root');
    expect(rows[1]![3]).toBe('  password with spaces  '); // Preserves spaces in password
    expect(rows[1]![4]).toContain('Line 1 of multiline notes\nLine 2 with "escaped quotes" and, commas\nLine 3 final');
  });

  it('should import and normalize Bitwarden JSON exports', () => {
    const result = importExternalPasswordFile(BITWARDEN_JSON);
    expect(result.items.length).toBe(2);
    expect(result.folders.length).toBe(1);

    const loginItem = result.items[0];
    expect(loginItem?.title).toBe('GitHub Account');
    expect(loginItem?.type).toBe('login');
    expect(loginItem?.favorite).toBe(true);
    expect((loginItem?.payload as Record<string, unknown>).username).toBe('octocat');
    expect((loginItem?.payload as Record<string, unknown>).totp).toBe('JBSWY3DPEHPK3PXP');
    expect((loginItem?.payload as Record<string, unknown>).totpSecret).toBe('JBSWY3DPEHPK3PXP');
    expect((loginItem?.payload as Record<string, unknown>).urls).toEqual(['https://github.com']);

    const noteItem = result.items[1];
    expect(noteItem?.type).toBe('secure_note');
    expect((noteItem?.payload as Record<string, unknown>).content).toBe('Private server configuration notes');
  });

  it('should correctly extract usernames across Dashlane, KeePass, LastPass, Safari, and Proton', () => {
    // Dashlane: uses "login" header
    const dashResult = importExternalPasswordFile(DASHLANE_CSV);
    expect(dashResult.items.length).toBe(1);
    expect(dashResult.items[0]?.title).toBe('Spotify');
    expect((dashResult.items[0]?.payload as Record<string, unknown>).username).toBe('krish_dj');
    expect((dashResult.items[0]?.payload as Record<string, unknown>).password).toBe('SpotifyPass!77');

    // KeePass: uses "Account" and "Login Name"
    const keepassResult = importExternalPasswordFile(KEEPASS_CSV);
    expect(keepassResult.items.length).toBe(1);
    expect(keepassResult.items[0]?.title).toBe('Chase Bank');
    expect((keepassResult.items[0]?.payload as Record<string, unknown>).username).toBe('chaseuser99');
    expect((keepassResult.items[0]?.payload as Record<string, unknown>).password).toBe('ChaseStrongPass$$');

    // LastPass: uses "grouping" for folder, "fav" for favorite
    const lpResult = importExternalPasswordFile(LASTPASS_CSV);
    expect(lpResult.items.length).toBe(1);
    expect(lpResult.items[0]?.title).toBe('Netflix');
    expect((lpResult.items[0]?.payload as Record<string, unknown>).username).toBe('krish@example.com');
    expect(lpResult.items[0]?.favorite).toBe(true);
    expect(lpResult.folders.length).toBe(1);
    expect(lpResult.folders[0]?.name).toBe('Entertainment');

    // Safari: uses "OTPAuth"
    const safariResult = importExternalPasswordFile(SAFARI_CSV);
    expect(safariResult.items.length).toBe(1);
    expect(safariResult.items[0]?.title).toBe('Apple ID');
    expect((safariResult.items[0]?.payload as Record<string, unknown>).username).toBe('krish@icloud.com');
    expect((safariResult.items[0]?.payload as Record<string, unknown>).totpSecret).toBe('otpauth://totp/Apple:krish@icloud.com?secret=TEST2FA');

    // Proton Pass
    const protonResult = importExternalPasswordFile(PROTON_CSV);
    expect(protonResult.items.length).toBe(1);
    expect(protonResult.items[0]?.title).toBe('Proton Mail');
    expect((protonResult.items[0]?.payload as Record<string, unknown>).username).toBe('krish@pm.me');
  });

  it('should preserve whitespace in imported passwords', () => {
    const result = importExternalPasswordFile(MULTILINE_RFC4180_CSV);
    expect(result.items.length).toBe(1);
    const item = result.items[0]!;
    expect((item.payload as Record<string, unknown>).password).toBe('  password with spaces  ');
  });
});
