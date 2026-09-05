import { describe, it, expect } from 'vitest';
import {
  detectExternalFormat,
  importExternalPasswordFile,
} from './externalImporters';

describe('externalImporters (Bitwarden, 1Password, KeePass & Browser Importers)', () => {
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
Personal,1,login,Google,Primary email,,0,https://accounts.google.com,user@gmail.com,GoogleSecretPass123!,`;

  const ONEPASSWORD_CSV = `title,website,username,password,notes
AWS Console,https://aws.amazon.com,cloud-admin,AwsPass456!,Root account`;

  const KEEPASS_CSV = `Group,Title,Username,Password,URL,Notes
Banking,Chase,chaseuser,ChasePass789!,https://chase.com,Personal checking`;

  const BROWSER_CSV = `name,url,username,password
Dropbox,https://dropbox.com,dropboxuser,DropboxPass999!`;

  it('should auto-detect Bitwarden, 1Password, KeePass, and Browser CSV formats', () => {
    expect(detectExternalFormat(BITWARDEN_JSON)).toBe('bitwarden_json');
    expect(detectExternalFormat(BITWARDEN_CSV)).toBe('bitwarden_csv');
    expect(detectExternalFormat(ONEPASSWORD_CSV)).toBe('1password_csv');
    expect(detectExternalFormat(KEEPASS_CSV)).toBe('keepass_csv');
    expect(detectExternalFormat(BROWSER_CSV)).toBe('browser_csv');
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

    const noteItem = result.items[1];
    expect(noteItem?.type).toBe('secure_note');
    expect((noteItem?.payload as Record<string, unknown>).content).toBe('Private server configuration notes');
  });

  it('should import and normalize Bitwarden, 1Password, and Browser CSV exports', () => {
    const bwResult = importExternalPasswordFile(BITWARDEN_CSV);
    expect(bwResult.items.length).toBe(1);
    expect(bwResult.items[0]?.title).toBe('Google');
    expect((bwResult.items[0]?.payload as Record<string, unknown>).username).toBe('user@gmail.com');

    const opResult = importExternalPasswordFile(ONEPASSWORD_CSV);
    expect(opResult.items.length).toBe(1);
    expect(opResult.items[0]?.title).toBe('AWS Console');
    expect((opResult.items[0]?.payload as Record<string, unknown>).username).toBe('cloud-admin');

    const browserResult = importExternalPasswordFile(BROWSER_CSV);
    expect(browserResult.items.length).toBe(1);
    expect(browserResult.items[0]?.title).toBe('Dropbox');
    expect((browserResult.items[0]?.payload as Record<string, unknown>).password).toBe('DropboxPass999!');
  });
});
