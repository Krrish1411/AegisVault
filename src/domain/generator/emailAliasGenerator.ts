/**
 * DuckDuckGo Email Disguise Generator
 * Generates private, untrackable @duck.com email aliases for zero-spam account signups.
 * 100% offline, privacy-first, zero cloud calls required.
 */

const ADJECTIVES = [
  'swift', 'safe', 'iron', 'crisp', 'silent', 'aegis', 'frost', 'shadow',
  'bright', 'amber', 'noble', 'secure', 'shield', 'quiet', 'bold', 'mystic',
];

const NOUNS = [
  'vault', 'guard', 'fox', 'lynx', 'raven', 'beacon', 'haven', 'crest',
  'pulse', 'forge', 'orbit', 'cliff', 'nexus', 'spark', 'ridge', 'ward',
];

/**
 * Generates a random crypto-secure hex/alphanumeric string of given length.
 */
function randomToken(length = 6): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'; // omit easily confused chars: 0, 1, l, o, i
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join('');
}

export interface DuckEmailOptions {
  /** Optional service/site name, e.g. "netflix", "github", "amazon" */
  serviceHint?: string | undefined;
  /** Format style: 'memorable' (e.g. safe-lynx-8f2k@duck.com) or 'compact' (e.g. vlt-7x9q@duck.com) */
  style?: ('memorable' | 'compact' | 'service') | undefined;
}

/**
 * Generates a private DuckDuckGo email disguise (@duck.com).
 */
export function generateDuckAlias(options: DuckEmailOptions = {}): string {
  const { serviceHint, style = 'memorable' } = options;

  let localPart: string;

  if (serviceHint && serviceHint.trim().length > 0 && (style === 'service' || !options.style)) {
    // Sanitize service name to clean alphanumeric
    const sanitized = serviceHint
      .toLowerCase()
      .replace(/https?:\/\//, '')
      .replace(/www\./, '')
      .split('.')[0]
      ?.replace(/[^a-z0-9]/g, '')
      .slice(0, 12) || 'svc';
    localPart = `${sanitized}-${randomToken(6)}`;
  } else if (style === 'compact') {
    localPart = `vlt-${randomToken(8)}`;
  } else {
    // Memorable adjective-noun-token
    const randAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]!;
    const randNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)]!;
    localPart = `${randAdj}-${randNoun}-${randomToken(4)}`;
  }

  return `${localPart}@duck.com`;
}

/**
 * Checks whether an email address is a DuckDuckGo disguise address.
 */
export function isDuckAlias(email: string): boolean {
  return /^[a-z0-9._%+-]+@duck\.com$/i.test(email.trim());
}

export interface AggregatedAlias {
  readonly id: string;
  readonly alias: string;
  readonly title: string;
  readonly source: 'vault' | 'standalone';
  readonly createdAt: string;
  readonly linkedItemId?: string | undefined;
  readonly notes?: string | undefined;
}

/**
 * Extracts all @duck.com aliases present across decrypted vault item envelopes.
 */
export function extractAliasesFromVault(
  items: readonly {
    readonly id: string;
    readonly title: string;
    readonly archived?: boolean;
    readonly createdAt: string;
    readonly payload?: Record<string, unknown>;
  }[]
): AggregatedAlias[] {
  const aliases: AggregatedAlias[] = [];
  const seen = new Set<string>();

  for (const item of items) {
    if (item.archived) continue;
    const payload = (item.payload || {}) as Record<string, unknown>;
    const candidates = [payload.username, payload.email].filter(
      (v): v is string => typeof v === 'string'
    );

    for (const cand of candidates) {
      const trimmed = cand.trim();
      if (isDuckAlias(trimmed) && !seen.has(`${item.id}:${trimmed}`)) {
        seen.add(`${item.id}:${trimmed}`);
        aliases.push({
          id: `vault-${item.id}-${trimmed}`,
          alias: trimmed,
          title: item.title,
          source: 'vault',
          createdAt: item.createdAt,
          linkedItemId: item.id,
        });
      }
    }
  }

  return aliases;
}
