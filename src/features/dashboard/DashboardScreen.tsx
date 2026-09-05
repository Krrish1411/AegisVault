import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Key,
  CreditCard,
  Building2,
  FileText,
  ShieldCheck,
  Plus,
  ArrowRight,
  User,
  Star,
  Shield,
  Eye,
  EyeOff,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import { ListRow } from '@/ui/primitives/ListRow';
import { EmptyState } from '@/ui/primitives/EmptyState';
import { appVaultService } from '@/application/services/AppVaultService';
import { AddEditPasswordModal } from '@/features/passwords/AddEditPasswordModal';
import { PasswordDetailSheet } from '@/features/passwords/PasswordDetailSheet';
import { useUiStore } from '@/state/uiStore';
import type { VaultItemEnvelope, LoginPayload } from '@/domain/vault/types';

export function DashboardScreen() {
  const navigate = useNavigate();
  const vaultRevision = useUiStore((s) => s.vaultRevision);
  const [items, setItems] = React.useState<VaultItemEnvelope[]>([]);
  const [vaultName, setVaultName] = React.useState('Personal Vault');
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<VaultItemEnvelope | null>(null);
  const [showDetail, setShowDetail] = React.useState(false);
  const [privacyMask, setPrivacyMask] = React.useState(false);

  const refreshData = React.useCallback(() => {
    const domain = appVaultService.getDecryptedVault();
    if (domain) {
      setItems(domain.items.filter((i) => !i.archived));
      setVaultName(domain.metadata.name);
    }
  }, []);

  React.useEffect(() => {
    refreshData();
  }, [refreshData, vaultRevision]);

  const loginItems = items.filter((i) => i.type === 'login');
  const cardItems = items.filter((i) => i.type === 'debit_card' || i.type === 'credit_card');
  const bankItems = items.filter((i) => i.type === 'bank_account' || i.type === 'bank_login' || i.type === 'upi');
  const docItems = items.filter((i) => i.type === 'document' || i.type === 'secure_note');
  const idItems = items.filter((i) => i.type === 'identity' || i.type === 'pan' || i.type === 'aadhaar' || i.type === 'passport' || i.type === 'driving_license');
  const walletItems = items.filter((i) => i.type === 'wallet_seed' || i.type === 'private_key' || i.type === 'ssh_key' || i.type === 'api_key');

  const recentLogins = [...loginItems]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 sm:space-y-8 anim-fade-up w-full">
      {/* 🏛️ 1. Hero Weave Card with Traveling Light Sheen & Currency Watermark (SKILL.md) */}
      <div className="relative overflow-hidden rounded-3xl hero-weave hero-sheen border border-pine-700/40 text-white p-6 sm:p-8 shadow-hero">
        {/* Faint Watermark Shield Emblem */}
        <div className="currency-watermark flex items-center justify-center">
          <Shield className="w-80 h-80 opacity-10 text-white" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-mono font-bold tracking-tight text-white shadow-xs">
                <ShieldCheck className="h-3.5 w-3.5 text-pine-300" />
                <span>Argon2id • XChaCha20-Poly1305</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/5 text-[11px] font-mono text-white/80 border border-white/10">
                <CheckCircle2 className="h-3 w-3 text-pine-300" />
                <span>Zero Telemetry</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold tracking-tight text-white">
              {vaultName}
            </h1>
            <p className="text-sm sm:text-base text-white/80 font-normal leading-relaxed">
              Institutional-grade encrypted custody for credentials, banking instruments, identities, and private cryptographic keys.
            </p>
          </div>

          {/* Quick Actions & Privacy Mask Toggle */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setPrivacyMask(!privacyMask)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-mono font-bold text-white transition-all active:scale-95 cursor-pointer backdrop-blur-md shadow-xs"
              title={privacyMask ? 'Unhide numbers' : 'Hide sensitive counts'}
            >
              {privacyMask ? <EyeOff className="h-4 w-4 text-mari-300" /> : <Eye className="h-4 w-4" />}
              <span>{privacyMask ? 'Values Masked' : 'Mask Values'}</span>
            </button>

            <Button
              onClick={() => setShowAddModal(true)}
              className="gap-2 bg-white text-pine-900 hover:bg-white/95 border border-white/20 font-bold shadow-hero active:scale-95"
            >
              <Plus className="h-4 w-4 text-pine-700" />
              <span>Add Entry</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 📊 2. The 4-Card Responsive Grid Pattern (SKILL.md Section 4.1) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Vault Items */}
        <div
          onClick={() => navigate('/passwords')}
          className="p-4 sm:p-5 rounded-2xl bg-card border border-line shadow-card lift min-w-0 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] text-ink/50 font-bold uppercase tracking-wider block truncate">
              Total Custody
            </span>
            <span className="h-2 w-2 rounded-full bg-pine-500" />
          </div>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-1.5 truncate num">
            {privacyMask ? '••••••' : items.length}
          </div>
          <div className="text-[11px] text-ink/50 font-mono mt-1 truncate">
            {items.length} records verified
          </div>
        </div>

        {/* Card 2: Passwords & Credentials */}
        <div
          onClick={() => navigate('/passwords')}
          className="p-4 sm:p-5 rounded-2xl bg-card border border-line shadow-card lift min-w-0 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] text-ink/50 font-bold uppercase tracking-wider block truncate">
              Logins & MFA
            </span>
            <Key className="h-4 w-4 text-pine-600" />
          </div>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-1.5 truncate num">
            {privacyMask ? '••••••' : loginItems.length}
          </div>
          <div className="text-[11px] text-pine-600 font-mono font-medium mt-1 truncate">
            RFC 6238 TOTP Active
          </div>
        </div>

        {/* Card 3: Banking & Cards */}
        <div
          onClick={() => navigate('/banking')}
          className="p-4 sm:p-5 rounded-2xl bg-card border border-line shadow-card lift min-w-0 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] text-ink/50 font-bold uppercase tracking-wider block truncate">
              Financial Assets
            </span>
            <Building2 className="h-4 w-4 text-mari-600" />
          </div>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-1.5 truncate num">
            {privacyMask ? '••••••' : bankItems.length + cardItems.length}
          </div>
          <div className="text-[11px] text-ink/50 font-mono mt-1 truncate">
            {cardItems.length} Cards • {bankItems.length} Accounts/UPI
          </div>
        </div>

        {/* Card 4: Documents & Wallets */}
        <div
          onClick={() => navigate('/documents')}
          className="p-4 sm:p-5 rounded-2xl bg-card border border-line shadow-card lift min-w-0 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] text-ink/50 font-bold uppercase tracking-wider block truncate">
              IDs & Documents
            </span>
            <FileText className="h-4 w-4 text-skyx-600" />
          </div>
          <div className="font-display font-extrabold text-2xl sm:text-3xl text-ink mt-1.5 truncate num">
            {privacyMask ? '••••••' : docItems.length + idItems.length + walletItems.length}
          </div>
          <div className="text-[11px] text-ink/50 font-mono mt-1 truncate">
            {idItems.length} IDs • {walletItems.length} Wallets/Keys
          </div>
        </div>
      </div>

      {/* 🧭 3. Quick Access Ledger Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
        {[
          { label: 'Passwords', count: loginItems.length, path: '/passwords', icon: Key },
          { label: 'Cards', count: cardItems.length, path: '/cards', icon: CreditCard },
          { label: 'Banking & UPI', count: bankItems.length, path: '/banking', icon: Building2 },
          { label: 'Government IDs', count: idItems.length, path: '/identity', icon: Shield },
          { label: 'Crypto & Keys', count: walletItems.length, path: '/wallets', icon: Wallet },
          { label: 'Notes & Files', count: docItems.length, path: '/documents', icon: FileText },
        ].map((pill) => {
          const IconComp = pill.icon;
          return (
            <button
              key={pill.label}
              type="button"
              onClick={() => navigate(pill.path)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-line bg-card hover:bg-moss text-xs font-semibold text-ink/80 hover:text-ink transition-all active:scale-95 shadow-xs cursor-pointer"
            >
              <IconComp className="h-3.5 w-3.5 text-pine-600" />
              <span>{pill.label}</span>
              <span className="ml-0.5 px-1.5 py-0.2 rounded-md bg-moss text-[10px] font-mono text-ink/60 border border-line/60">
                {pill.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 🛡️ 4. Security Center Status Card */}
      <div className="rounded-2xl border border-line bg-card p-5 sm:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-pine-50 dark:bg-pine-950/60 text-pine-600 border border-pine-200/60 dark:border-pine-800/60 shadow-xs">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-ink">
                Cryptographic Isolation Active
              </h3>
              <p className="text-xs text-ink/60 font-mono mt-0.5">
                Argon2id (64MB) • XChaCha20-Poly1305 • IndexedDB v2 Atomic Ledger
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/security-center')}
            className="gap-2 text-xs font-mono font-semibold self-start sm:self-auto"
          >
            <span>Run Security Audit</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* ⚡ 5. Recent Passwords & Quick Access */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-display font-bold tracking-tight text-ink">
              Recent Credentials
            </h2>
            <Badge variant="accent" className="h-5 text-[10px]">
              {loginItems.length} Logins
            </Badge>
          </div>
          {loginItems.length > 5 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/passwords')}
              className="text-xs text-pine-600 hover:text-pine-700 font-semibold"
            >
              View all ({loginItems.length})
            </Button>
          )}
        </div>

        {recentLogins.length === 0 ? (
          <EmptyState
            icon={<Key className="h-7 w-7 text-pine-600" />}
            title="No passwords saved in vault"
            description="All entries are encrypted with zero knowledge before being stored locally in IndexedDB."
            primaryAction={
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                <span>Add First Password</span>
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {recentLogins.map((item) => {
              const payload = item.payload as Partial<LoginPayload>;
              return (
                <ListRow
                  key={item.id}
                  icon={<Key className="h-5 w-5 text-pine-600" />}
                  title={item.title}
                  subtitle={
                    payload.username ? (
                      <span className="flex items-center gap-1 font-mono text-xs">
                        <User className="h-3 w-3 text-ink/40" />
                        <span>{privacyMask ? '••••••••' : payload.username}</span>
                      </span>
                    ) : undefined
                  }
                  badges={
                    item.favorite ? (
                      <Badge variant="accent" className="h-5 px-1.5 text-[10px]">
                        <Star className="h-2.5 w-2.5 fill-current mr-0.5" />
                        Fav
                      </Badge>
                    ) : undefined
                  }
                  onClick={() => {
                    setSelectedItem(item);
                    setShowDetail(true);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Add Password Modal */}
      <AddEditPasswordModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSaved={refreshData}
      />

      {/* Password Detail Sheet */}
      <PasswordDetailSheet
        item={selectedItem}
        open={showDetail}
        onOpenChange={setShowDetail}
        onEdit={() => navigate('/passwords')}
        onDeleted={refreshData}
      />
    </div>
  );
}
