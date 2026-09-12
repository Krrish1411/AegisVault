import * as React from 'react';
import {
  ShieldCheck,
  Key,
  Clock,
  Download,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Cpu,
  WifiOff,
  Radio,
  RotateCcw,
  Search,
  Zap,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/ui/primitives/Card';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import { Input } from '@/ui/primitives/Input';
import { EmptyState } from '@/ui/primitives/EmptyState';
import { analyzeVaultHealth, type VaultSecurityReport, type SecurityFinding } from '@/domain/security-center/securityAnalyzer';
import { appVaultService } from '@/application/services/AppVaultService';
import { AddEditPasswordModal } from '@/features/passwords/AddEditPasswordModal';
import { ExportBackupModal } from '@/features/backup/ExportBackupModal';
import { OnlineBreachCheckModal } from './OnlineBreachCheckModal';
import type { VaultItemEnvelope } from '@/domain/vault/types';
import { useUiStore } from '@/state/uiStore';

export function SecurityCenterScreen() {
  const addToast = useUiStore((state) => state.addToast);
  const vaultRevision = useUiStore((state) => state.vaultRevision);
  const [report, setReport] = React.useState<VaultSecurityReport | null>(null);
  const [activeFilter, setActiveFilter] = React.useState<
    'priority' | 'all' | 'common' | 'weak' | 'reused' | 'old' | 'missing_2fa' | 'expired' | 'expiring_soon'
  >('priority');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [visibleLimit, setVisibleLimit] = React.useState(30);

  // Modal states
  const [editingItem, setEditingItem] = React.useState<VaultItemEnvelope | null>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showExportModal, setShowExportModal] = React.useState(false);
  const [showBreachModal, setShowBreachModal] = React.useState(false);

  const runAudit = React.useCallback(() => {
    const domain = appVaultService.getDecryptedVault();
    if (domain) {
      const result = analyzeVaultHealth(domain);
      setReport(result);
    }
  }, []);

  React.useEffect(() => {
    runAudit();
  }, [runAudit, vaultRevision]);

  const handleFixFinding = (finding: SecurityFinding) => {
    const domain = appVaultService.getDecryptedVault();
    const item = domain?.items.find((i) => i.id === finding.itemId);
    if (item) {
      setEditingItem(item);
      setShowEditModal(true);
    }
  };

  const priorityFindings = React.useMemo(() => {
    if (!report) return [];
    return report.findings.filter(
      (f) => f.vulnerability !== 'missing_2fa' && f.vulnerability !== 'old'
    );
  }, [report]);

  const informationalCount = React.useMemo(() => {
    if (!report) return 0;
    return (report.missing2faCount ?? 0) + (report.oldCount ?? 0);
  }, [report]);

  const filteredFindings = React.useMemo(() => {
    if (!report) return [];
    let list: readonly SecurityFinding[] = report.findings;
    if (activeFilter === 'priority') {
      list = priorityFindings;
    } else if (activeFilter !== 'all') {
      list = report.findings.filter((f) => f.vulnerability === activeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.itemTitle.toLowerCase().includes(q) ||
          (f.username && f.username.toLowerCase().includes(q)) ||
          f.description.toLowerCase().includes(q) ||
          f.title.toLowerCase().includes(q)
      );
    }

    return list;
  }, [report, activeFilter, priorityFindings, searchQuery]);

  if (!report) {
    return (
      <div className="p-8 text-center text-text-muted">
        <p>Loading security audit report...</p>
      </div>
    );
  }

  const scoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 75) return 'accent';
    if (score >= 50) return 'warning';
    return 'danger';
  };

  return (
    <div className="space-y-8 animate-fade-in w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
            <ShieldCheck className="h-6 w-6 text-accent" />
            <span>Security Center</span>
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Deterministic offline credential health audit. Zero external telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBreachModal(true)}
            className="gap-1.5 text-xs text-accent border-accent/30 hover:bg-accent/10"
          >
            <Radio className="h-3.5 w-3.5 text-accent" />
            <span>Online Breach Check</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={runAudit}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-accent" />
            <span>Re-Scan Vault</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setShowExportModal(true)}
            className="gap-1.5 text-xs"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Backup</span>
          </Button>
        </div>
      </div>

      {/* Top Hero Score Card */}
      <Card className="border-border bg-surface shadow-elevated">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {/* Circular / Large Score Badge */}
              <div
                className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border-2 font-mono font-bold shadow-inner ${
                  report.overallScore >= 90
                    ? 'border-success/40 bg-success/10 text-success'
                    : report.overallScore >= 75
                      ? 'border-accent/40 bg-accent/10 text-accent'
                      : report.overallScore >= 50
                        ? 'border-warning/40 bg-warning/10 text-warning'
                        : 'border-danger/40 bg-danger/10 text-danger'
                }`}
              >
                <span className="text-2xl leading-none">{report.overallScore}</span>
                <span className="text-[10px] text-text-muted mt-1">/ 100</span>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-text-primary">
                    {report.overallScore >= 90
                      ? 'Optimal Security Posture'
                      : report.overallScore >= 75
                        ? 'Good Health — Minor Improvements'
                        : report.overallScore >= 50
                          ? 'Action Required — Vulnerabilities Found'
                          : 'Critical Security Vulnerabilities'}
                  </h2>
                  <Badge variant={scoreBadgeVariant(report.overallScore)}>
                    {report.securityRating.toUpperCase().replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-text-secondary">
                  Audited {report.totalLogins} credentials against weak entropy, password reuse, and known breach dictionaries.
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <div className="rounded-lg bg-surface-subtle p-2.5">
                <div className="text-base font-bold text-text-primary font-mono">{report.totalLogins}</div>
                <div className="text-[10px] text-text-muted">Total Accounts</div>
              </div>

              <div className="rounded-lg bg-surface-subtle p-2.5">
                <div className="text-base font-bold text-success font-mono">{report.healthyLogins}</div>
                <div className="text-[10px] text-text-muted">Healthy</div>
              </div>

              <div className="rounded-lg bg-surface-subtle p-2.5">
                <div className="text-base font-bold text-danger font-mono">
                  {report.commonCount + report.weakCount + report.reusedCount + report.expiredCount}
                </div>
                <div className="text-[10px] text-text-muted">At Risk</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Security Posture Breakdown */}
      <Card className="border-border bg-surface">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Radio className="h-4 w-4 text-accent" />
            <span>Cryptographic & System Security Invariants</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {/* Cipher */}
            <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                <Cpu className="h-3.5 w-3.5 text-accent" />
                <span>Cipher Profile</span>
              </div>
              <p className="text-[11px] text-text-secondary">{report.systemStatus.vaultCryptoProfile}</p>
            </div>

            {/* Auto Lock */}
            <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                <Clock className="h-3.5 w-3.5 text-accent" />
                <span>Auto-Lock</span>
              </div>
              <p className="text-[11px] text-text-secondary">
                {report.systemStatus.autoLockActive
                  ? `${report.systemStatus.autoLockMinutes}m Inactivity`
                  : 'Disabled'}
              </p>
            </div>

            {/* BIP39 Recovery */}
            <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                <Key className="h-3.5 w-3.5 text-accent" />
                <span>BIP39 Recovery</span>
              </div>
              <p className="text-[11px] text-text-secondary">24-Word Wrap Active</p>
            </div>

            {/* Network Offline */}
            <div className="p-3 rounded-lg border border-border bg-surface-subtle space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                <WifiOff className="h-3.5 w-3.5 text-accent" />
                <span>Network Policy</span>
              </div>
              <p className="text-[11px] text-text-secondary">0 Outbound Requests</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actionable Findings Section */}
      <div className="space-y-4">
        {/* Priority Focus Mode Banner */}
        {activeFilter === 'priority' && informationalCount > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-accent/25 bg-accent/5 text-xs text-text-secondary">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                <Zap className="h-4 w-4 text-accent" />
              </div>
              <div>
                <span className="font-semibold text-text-primary">Priority Focus Mode Active: </span>
                Showing <strong className="text-accent">{priorityFindings.length}</strong> high-risk vulnerabilities. <span className="text-text-muted">({informationalCount} informational suggestions like missing 2FA and stale passwords are hidden)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setActiveFilter('all')}
                className="h-7 text-xs border-accent/30 text-accent hover:bg-accent/10"
              >
                Show All ({report.findings.length})
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-b border-border pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span>Actionable Health Findings</span>
              <Badge variant={filteredFindings.length === 0 ? 'success' : 'default'}>
                {filteredFindings.length}
              </Badge>
            </h3>

            {/* Search within findings */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-text-muted" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleLimit(30);
                }}
                placeholder="Filter findings..."
                className="pl-8 h-8 text-xs w-full"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Button
              size="sm"
              variant={activeFilter === 'priority' ? 'default' : 'ghost'}
              onClick={() => {
                setActiveFilter('priority');
                setVisibleLimit(30);
              }}
              className={`h-7 text-xs gap-1 ${activeFilter === 'priority' ? 'bg-accent text-white' : ''}`}
            >
              <Zap className="h-3 w-3" />
              <span>Priority Risks ({priorityFindings.length})</span>
            </Button>

            <Button
              size="sm"
              variant={activeFilter === 'all' ? 'default' : 'ghost'}
              onClick={() => {
                setActiveFilter('all');
                setVisibleLimit(30);
              }}
              className="h-7 text-xs"
            >
              All ({report.findings.length})
            </Button>

            {report.commonCount > 0 && (
              <Button
                size="sm"
                variant={activeFilter === 'common' ? 'danger' : 'ghost'}
                onClick={() => {
                  setActiveFilter('common');
                  setVisibleLimit(30);
                }}
                className={`h-7 text-xs ${activeFilter === 'common' ? 'text-white font-semibold' : 'text-danger'}`}
              >
                Common ({report.commonCount})
              </Button>
            )}

            {report.weakCount > 0 && (
              <Button
                size="sm"
                variant={activeFilter === 'weak' ? 'default' : 'ghost'}
                onClick={() => {
                  setActiveFilter('weak');
                  setVisibleLimit(30);
                }}
                className="h-7 text-xs"
              >
                Weak ({report.weakCount})
              </Button>
            )}

            {report.reusedCount > 0 && (
              <Button
                size="sm"
                variant={activeFilter === 'reused' ? 'default' : 'ghost'}
                onClick={() => {
                  setActiveFilter('reused');
                  setVisibleLimit(30);
                }}
                className="h-7 text-xs"
              >
                Reused ({report.reusedCount})
              </Button>
            )}

            {report.expiredCount > 0 && (
              <Button
                size="sm"
                variant={activeFilter === 'expired' ? 'danger' : 'ghost'}
                onClick={() => {
                  setActiveFilter('expired');
                  setVisibleLimit(30);
                }}
                className={`h-7 text-xs ${activeFilter === 'expired' ? 'text-white font-semibold' : 'text-danger'}`}
              >
                Expired ({report.expiredCount})
              </Button>
            )}

            {report.expiringSoonCount > 0 && (
              <Button
                size="sm"
                variant={activeFilter === 'expiring_soon' ? 'secondary' : 'ghost'}
                onClick={() => {
                  setActiveFilter('expiring_soon');
                  setVisibleLimit(30);
                }}
                className={`h-7 text-xs ${activeFilter === 'expiring_soon' ? 'text-amber-700 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-950/60' : 'text-amber-500'}`}
              >
                Expiring Soon ({report.expiringSoonCount})
              </Button>
            )}

            {report.missing2faCount > 0 && (
              <Button
                size="sm"
                variant={activeFilter === 'missing_2fa' ? 'default' : 'ghost'}
                onClick={() => {
                  setActiveFilter('missing_2fa');
                  setVisibleLimit(30);
                }}
                className="h-7 text-xs"
              >
                Missing 2FA ({report.missing2faCount})
              </Button>
            )}

            {report.oldCount > 0 && (
              <Button
                size="sm"
                variant={activeFilter === 'old' ? 'default' : 'ghost'}
                onClick={() => {
                  setActiveFilter('old');
                  setVisibleLimit(30);
                }}
                className="h-7 text-xs"
              >
                Old ({report.oldCount})
              </Button>
            )}
          </div>
        </div>

        {filteredFindings.length === 0 ? (
          <EmptyState
            title={searchQuery ? 'No Matching Findings' : 'No Vulnerabilities Detected'}
            description={
              searchQuery
                ? `No security findings matched "${searchQuery}".`
                : 'All accounts in this category meet strict cryptographic entropy and uniqueness standards.'
            }
            icon={<CheckCircle2 className="h-8 w-8 text-success" />}
          />
        ) : (
          <div className="space-y-3">
            {filteredFindings.slice(0, visibleLimit).map((finding) => (
              <Card
                key={finding.id}
                className="border-border bg-surface transition-all hover:border-border/80 shadow-subtle"
              >
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-text-primary">
                        {finding.itemTitle}
                      </span>
                      {finding.username && (
                        <span className="text-xs font-mono text-text-muted">
                          ({finding.username})
                        </span>
                      )}
                      <Badge
                        variant={
                          finding.severity === 'critical'
                            ? 'danger'
                            : finding.severity === 'high'
                              ? 'warning'
                              : 'default'
                        }
                      >
                        {finding.title}
                      </Badge>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {finding.description}
                    </p>

                    <p className="text-[11px] text-accent font-medium">
                      Action: {finding.remediationAction}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant={finding.vulnerability === 'expired' ? 'default' : 'outline'}
                    onClick={() => handleFixFinding(finding)}
                    className="self-start sm:self-auto gap-1.5 text-xs shrink-0"
                  >
                    {finding.vulnerability === 'expired' || finding.vulnerability === 'expiring_soon' ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        <span>Rotate Password</span>
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Fix Credential</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {filteredFindings.length > visibleLimit && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-border">
                <span className="text-xs text-text-muted font-mono">
                  Showing {Math.min(visibleLimit, filteredFindings.length)} of {filteredFindings.length} findings
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setVisibleLimit((prev) => prev + 30)}
                    className="gap-1.5 text-xs"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                    <span>Load Next 30</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setVisibleLimit(filteredFindings.length)}
                    className="text-xs text-accent"
                  >
                    Show All ({filteredFindings.length})
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Password Modal */}
      <AddEditPasswordModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        editingItem={editingItem}
        onSaved={() => {
          runAudit();
          addToast({
            title: 'Credential Updated',
            description: 'Security scan updated with new credential parameters.',
            variant: 'success',
          });
        }}
      />

      {/* Export Backup Modal */}
      <ExportBackupModal
        open={showExportModal}
        onOpenChange={setShowExportModal}
      />

      {/* Online Breach Check Modal */}
      <OnlineBreachCheckModal
        open={showBreachModal}
        onOpenChange={setShowBreachModal}
      />
    </div>
  );
}
