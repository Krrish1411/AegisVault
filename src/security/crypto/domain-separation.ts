/**
 * Domain separation contexts to prevent cross-purpose key reuse.
 */
export const DOMAIN_CONTEXTS = {
  VAULT_ENCRYPTION: 'aegis-vault-v1:vault-payload-encryption',
  KEY_WRAP: 'aegis-vault-v1:master-key-wrap',
  RECOVERY_WRAP: 'aegis-vault-v1:recovery-key-wrap',
  ATTACHMENT_ENCRYPTION: 'aegis-vault-v1:attachment-stream-encryption',
  SEARCH_TOKEN: 'aegis-vault-v1:ephemeral-search-hash',
} as const;

export type DomainContext = typeof DOMAIN_CONTEXTS[keyof typeof DOMAIN_CONTEXTS];
