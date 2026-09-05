import type { VaultItemEnvelope } from '@/domain/vault/types';

export interface EmergencyKitConfig {
  readonly vaultName: string;
  readonly ownerName?: string | undefined;
  readonly instructions?: string | undefined;
  readonly recoveryPhrase?: string | undefined;
  readonly selectedItems: readonly VaultItemEnvelope[];
}

/**
 * Generates an emergency kit printable document for cold storage & next-of-kin access.
 */
export function generateEmergencyKitHtml(config: EmergencyKitConfig): string {
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const renderedItems = config.selectedItems
    .map((item, index) => {
      const payload = (item.payload || {}) as Record<string, string | undefined>;
      const keys = Object.entries(payload)
        .filter(([k, v]) => Boolean(v) && !['notes', 'secret'].includes(k))
        .map(
          ([k, v]) => `<div><strong>${k}:</strong> <span class="mono">${String(v)}</span></div>`
        )
        .join('');

      return `
        <div class="item-card">
          <div class="item-title">${index + 1}. ${item.title} <span class="item-type">(${item.type.replace('_', ' ').toUpperCase()})</span></div>
          ${keys}
          ${payload.notes ? `<div class="notes"><em>Notes:</em> ${payload.notes}</div>` : ''}
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AegisVault Emergency Access Kit — ${config.vaultName}</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      background: #ffffff;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 24px;
      line-height: 1.5;
    }
    .header {
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .logo {
      font-size: 24px;
      font-weight: 800;
      letter-spacing: -0.5px;
      color: #0f172a;
    }
    .logo span {
      color: #0d9488;
    }
    .subtitle {
      font-size: 12px;
      color: #64748b;
      margin-top: 4px;
    }
    .badge {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .alert-box {
      border: 2px dashed #d97706;
      background: #fffbeb;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #92400e;
    }
    .section-title {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 24px 0 12px 0;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
    }
    .recovery-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    .word-cell {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      border-radius: 4px;
    }
    .word-cell span {
      color: #94a3b8;
      margin-right: 6px;
      font-size: 10px;
    }
    .item-card {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      padding: 14px 18px;
      border-radius: 8px;
      margin-bottom: 12px;
      font-size: 12px;
      break-inside: avoid;
    }
    .item-title {
      font-size: 14px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #0f172a;
    }
    .item-type {
      font-size: 10px;
      color: #0d9488;
      font-weight: 600;
    }
    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11px;
    }
    .notes {
      margin-top: 8px;
      padding-top: 6px;
      border-top: 1px dashed #cbd5e1;
      color: #475569;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">Aegis<span>Vault</span></div>
      <div class="subtitle">CONFIDENTIAL EMERGENCY ACCESS KIT • ZERO-KNOWLEDGE ENCRYPTED VAULT</div>
    </div>
    <div class="badge">Date: ${dateStr}</div>
  </div>

  <div class="alert-box">
    <strong>INSTRUCTIONS FOR EXECUTOR / TRUSTED CONTACT:</strong><br>
    This document contains critical offline recovery instructions for <strong>${config.ownerName || config.vaultName}</strong>.
    Store this document in a secure, fireproof physical safe or bank safety deposit box. Do NOT photocopy, scan, or email this document.
  </div>

  ${
    config.instructions
      ? `
    <div class="section-title">Emergency Access Instructions</div>
    <p style="font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap;">${config.instructions}</p>
  `
      : ''
  }

  ${
    config.recoveryPhrase
      ? `
    <div class="section-title">BIP39 Master Account Recovery Phrase (24 Words)</div>
    <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Use these words in order on any AegisVault app instance to restore complete vault ownership.</p>
    <div class="recovery-grid">
      ${config.recoveryPhrase
        .trim()
        .split(/\s+/)
        .map((w, idx) => `<div class="word-cell"><span>${idx + 1}.</span><strong>${w}</strong></div>`)
        .join('')}
    </div>
  `
      : ''
  }

  ${
    config.selectedItems.length > 0
      ? `
    <div class="section-title">Selected Critical Emergency Assets (${config.selectedItems.length} Records)</div>
    ${renderedItems}
  `
      : ''
  }

  <div class="footer">
    Generated with AegisVault Zero-Knowledge Cryptographic Suite • Encrypted locally • Never synced to cloud without user intent.
  </div>
</body>
</html>`;
}
