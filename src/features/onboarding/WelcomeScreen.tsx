import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  ArrowRight,
  Key,
  Building2,
  CreditCard,
  FileText,
  Smartphone,
  Sparkles,
  Users,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Check,
  Cpu,
  RefreshCw,
  Wallet,
  HardDrive,
  ShieldCheck,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import { ThemeSelector } from '@/ui/navigation/ThemeSelector';
import { BuyMeACoffeeButton } from '@/ui/primitives/BuyMeACoffeeButton';
import { CreateVaultModal } from './CreateVaultModal';
import { appVaultService } from '@/application/services/AppVaultService';

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [hasVault, setHasVault] = React.useState<boolean | null>(null);
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  // Check if a vault is already created
  React.useEffect(() => {
    appVaultService.isVaultCreated().then((exists) => {
      setHasVault(exists);
    });
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const featurePillars = [
    {
      category: 'Password Manager & Security',
      items: [
        {
          icon: <Key className="h-6 w-6 text-accent" />,
          title: 'Passwords & Web Logins',
          desc: 'Save website credentials, URLs, and multiline secure notes. Automatically logs password change history and alerts on expired passwords.',
          badge: 'History Log',
        },
        {
          icon: <Sparkles className="h-6 w-6 text-mari-600 dark:text-mari-400" />,
          title: 'Strong Password & Passphrase Generator',
          desc: 'Generate mathematically uncrackable passwords (8 to 64 characters) or readable Diceware passphrases with custom character sets.',
          badge: 'Diceware & Entropy',
        },
        {
          icon: <Smartphone className="h-6 w-6 text-flare-500" />,
          title: 'Built-in 2FA Authenticator (TOTP)',
          desc: 'Live 6-digit TOTP token generation with a 30-second rotating countdown. Replaces Google Authenticator and Authy with zero cloud reliance.',
          badge: 'RFC 6238 Live',
        },
        {
          icon: <FileSpreadsheet className="h-6 w-6 text-pine-600 dark:text-pine-400" />,
          title: 'Universal Importer for All Password Managers',
          desc: '1-click import from Bitwarden, 1Password, LastPass, Dashlane, KeePass, Chrome, Safari, Firefox, Proton Pass, RoboForm, and Enpass with RFC 4180 CSV parsing.',
          badge: '11+ Managers',
        },
      ],
    },
    {
      category: 'Indian Financial & Banking Suite',
      items: [
        {
          icon: <Building2 className="h-6 w-6 text-pine-600 dark:text-pine-400" />,
          title: 'Bank Accounts & Net Banking',
          desc: 'Keep account numbers, IFSC codes, bank branch details, net banking logins, profile passwords, and transaction passwords in one safe locker.',
          badge: 'IFSC Lookup',
        },
        {
          icon: <FileText className="h-6 w-6 text-skyx-600 dark:text-skyx-400" />,
          title: 'Cross-Linked Cancelled Cheques & Documents',
          desc: 'Attach encrypted photos or PDF scans of cancelled cheques, passbooks, and certificates directly cross-linked to their parent bank accounts.',
          badge: 'Cross-Linked 50MB',
        },
        {
          icon: <Smartphone className="h-6 w-6 text-accent" />,
          title: 'MPIN & UPI PIN Protection',
          desc: 'Secure your UPI IDs, Mobile Banking MPINs, and UPI PINs with instant, masked clipboard copy and zero risk of spyware screen capture.',
          badge: 'Instant Copy',
        },
        {
          icon: <CreditCard className="h-6 w-6 text-mari-600 dark:text-mari-400" />,
          title: 'Debit & Credit Cards with ATM PINs',
          desc: 'Luhn-validated card numbers, CVVs, expiry dates, and ATM PINs. Filter your top cards with favorite toggles for quick checkout.',
          badge: 'Luhn Validated',
        },
      ],
    },
    {
      category: 'Identities, Crypto & Disaster Recovery',
      items: [
        {
          icon: <ShieldCheck className="h-6 w-6 text-accent" />,
          title: 'Indian Identity Locker (Aadhaar & PAN)',
          desc: 'Store Aadhaar cards with smart masked formatting (•••• •••• 1234), PAN cards, Passports, Voter IDs, and Driving Licenses.',
          badge: 'Masked Preview',
        },
        {
          icon: <Wallet className="h-6 w-6 text-amber-500" />,
          title: 'Cold Storage for Crypto Seed Phrases',
          desc: 'Secure 12-word and 24-word BIP-39 mnemonic wallet seeds, private keys, and SSH credentials completely safe from online malware.',
          badge: 'Cold Storage',
        },
        {
          icon: <Shield className="h-6 w-6 text-flare-500" />,
          title: 'Real-time Security Center & Audit',
          desc: 'Live 0–100% Vault Health Score evaluating weak, short, reused, or compromised passwords with custom rotation policies.',
          badge: 'Health Score',
        },
        {
          icon: <Users className="h-6 w-6 text-pine-600 dark:text-pine-400" />,
          title: 'Emergency Access & Cold Recovery Kit',
          desc: 'Nominate trusted family beneficiaries with a configurable waiting period (0–30 days), and print physical offline recovery documents.',
          badge: 'Digital Legacy',
        },
      ],
    },
  ];

  const comparisonData = [
    {
      feature: 'Where your passwords & data live',
      aegis: '100% Local On Your Device (0 Cloud)',
      cloud: 'Remote company servers (Amazon/Azure)',
      browser: 'Synced to Google/Apple cloud accounts',
    },
    {
      feature: 'Annual Subscription Price',
      aegis: '100% Free Forever (No Subscriptions)',
      cloud: '$36 to $60 every year',
      browser: 'Free (monetized via ecosystem)',
    },
    {
      feature: 'Master Key Derivation (KDF)',
      aegis: 'Argon2id (64MB memory-hard, 3 passes)',
      cloud: 'Often PBKDF2 (weaker GPU resistance)',
      browser: 'Basic device keychain or login',
    },
    {
      feature: 'Built-in 2FA Authenticator (TOTP)',
      aegis: 'Included Free (Live 30s Countdown)',
      cloud: 'Locked behind premium tiers',
      browser: 'Not supported or basic',
    },
    {
      feature: 'Cancelled Cheques & Document Scans',
      aegis: 'Cross-linked to Bank Accounts (50MB/file)',
      cloud: 'Generic file locker ($$$)',
      browser: 'Not supported',
    },
    {
      feature: 'Indian Banking (UPI, MPIN, IFSC, PAN)',
      aegis: 'Native first-class fields & validation',
      cloud: 'Generic custom text fields only',
      browser: 'Not supported',
    },
    {
      feature: 'Risk of Global Cloud Breaches',
      aegis: 'Zero (No cloud server to attack)',
      cloud: 'High (Targeted constantly by hackers)',
      browser: 'Targeted via browser session hijacking',
    },
  ];

  const faqs = [
    {
      q: 'Is AegisVault really 100% free with no hidden charges?',
      a: 'Yes! AegisVault is 100% free and open. There are no premium tiers, no recurring subscriptions, no ads, and no locked features. Everything from the 2FA authenticator to 50MB encrypted attachments is available completely free.',
    },
    {
      q: 'Can anyone else (or the AegisVault team) see my passwords?',
      a: 'Absolutely not. AegisVault uses zero-knowledge architecture. Your passwords, bank details, PINs, and documents are encrypted on your device with XChaCha20-Poly1305 using a 256-bit key derived with Argon2id from your Master Password. Only you hold the decryption key.',
    },
    {
      q: 'Does AegisVault send any data over the internet or cloud?',
      a: 'Never. AegisVault is equipped with a strict Network Guard that traps and blocks unauthorized external network calls. All cryptographic operations and vault records remain strictly inside your browser and device IndexedDB storage.',
    },
    {
      q: 'How does the built-in 2-Factor Authenticator (TOTP) work?',
      a: 'When adding or editing a password, you can paste the Base32 secret key or an otpauth:// URI from any website (like Google, GitHub, or Amazon). AegisVault generates the exact same 6-digit TOTP verification codes with a live 30-second countdown, eliminating the need for a separate authenticator app.',
    },
    {
      q: 'How do I link a cancelled cheque to my bank account?',
      a: 'Open your Bank Account record in AegisVault, scroll to "Linked Documents & Cheques", and click "Attach File". Upload an image or PDF scan of your cancelled cheque or passbook. It is encrypted on-device and permanently linked to that bank account for instant retrieval.',
    },
    {
      q: 'Can I import my data from my existing password manager?',
      a: 'Yes! AegisVault includes an RFC 4180-compliant universal importer supporting 1-click import from Bitwarden, 1Password, LastPass, Dashlane, KeePass, Google Chrome, Safari, Firefox, Proton Pass, RoboForm, and Enpass.',
    },
    {
      q: 'What happens if I forget my master password?',
      a: 'When you create your vault, you receive a 12-word BIP-39 secret recovery phrase. If you ever forget your master password, you can use these 12 words to safely regain access to your vault.',
    },
  ];

  return (
    <div className="min-h-screen page-bg text-ink flex flex-col selection:bg-accent/20">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-card/85 px-4 sm:px-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent border border-accent/25 shadow-xs">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="font-display text-lg font-extrabold tracking-tight">
              AegisVault
            </span>
            <span className="hidden sm:inline text-xs text-ink/50 ml-2 font-mono">
              • Private Digital Locker & Password Manager
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <BuyMeACoffeeButton size="sm" className="hidden sm:inline-flex" />

          <ThemeSelector />

          {hasVault ? (
            <Button
              size="sm"
              onClick={() => navigate('/unlock')}
              className="gap-1.5 shadow-xs cursor-pointer text-xs"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Unlock Vault</span>
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="gap-1.5 shadow-xs cursor-pointer text-xs"
            >
              <span>Create Free Vault</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden px-4 py-14 sm:py-20 text-center">
          {/* Subtle ambient gradient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[380px] bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-4xl mx-auto space-y-6 anim-fade-up">
            {/* Top badges & Creator branding */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-xs font-semibold text-accent shadow-xs">
                <Sparkles className="h-3.5 w-3.5" />
                <span>100% Private • Stored Only On Your Device • Zero Cloud Servers</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-line bg-card/80 text-xs text-ink/75 shadow-xs backdrop-blur-xs">
                <span>Crafted with precision by</span>
                <span className="font-black tracking-wide text-accent bg-accent/10 px-2.5 py-0.5 rounded-md border border-accent/25 shadow-xs">
                  Krish Patel
                </span>
              </div>
              <BuyMeACoffeeButton size="sm" className="sm:hidden" />
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-ink leading-tight">
              Remember All Your Passwords, Bank Details & PINs{' '}
              <span className="text-accent underline decoration-accent/40 decoration-wavy decoration-2">
                With Zero Cloud Servers
              </span>
            </h1>

            <p className="text-base sm:text-lg text-ink/80 max-w-2xl mx-auto leading-relaxed">
              Remember just one Master Password. AegisVault securely remembers all your <span className="font-semibold text-ink">passwords</span>, <span className="font-semibold text-ink">bank account details</span>, <span className="font-semibold text-ink">net banking passwords</span>, <span className="font-semibold text-ink">MPINs</span>, <span className="font-semibold text-ink">UPI PINs</span>, <span className="font-semibold text-ink">ATM card PINs</span>, and sensitive documents like <span className="font-semibold text-ink">cancelled cheques</span> — right on your device with <span className="font-semibold text-accent">zero cloud servers</span>, zero trackers, and zero subscription fees.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto gap-2 px-8 py-3.5 shadow-hero text-sm font-bold cursor-pointer"
              >
                <span>Create My Free Vault</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              {hasVault && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/unlock')}
                  className="w-full sm:w-auto gap-2 px-8 py-3.5 text-sm font-semibold cursor-pointer"
                >
                  <Lock className="h-4 w-4 text-accent" />
                  <span>Already Have a Vault? Unlock Here</span>
                </Button>
              )}

              <BuyMeACoffeeButton size="lg" className="w-full sm:w-auto" />
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-ink/65 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-pine-500" />
                <span>Zero Cloud Servers</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-pine-500" />
                <span>Argon2id (64MB) + XChaCha20</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-pine-500" />
                <span>Built-in 2FA Authenticator</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-pine-500" />
                <span>11+ Major Importers</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-pine-500" />
                <span>100% Free Forever</span>
              </span>
            </div>
          </div>
        </section>

        {/* Feature Pillars: Deep Password Manager Capabilities */}
        <section className="px-4 py-16 sm:px-8 border-t border-line bg-card/40">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-3">
              <Badge variant="accent">Complete Feature Matrix</Badge>
              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-ink">
                Everything You Need in a Modern Password Manager & Safe
              </h2>
              <p className="text-sm sm:text-base text-ink/65 max-w-2xl mx-auto">
                Built specifically to solve the frustration of scattered logins, bank details, ATM PINs, UPI codes, and cancelled cheque photos.
              </p>
            </div>

            {featurePillars.map((pillar, pIdx) => (
              <div key={pIdx} className="space-y-4">
                <div className="flex items-center gap-2 border-b border-line pb-2">
                  <Layers className="h-4 w-4 text-accent" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-ink/80 font-mono">
                    {pillar.category}
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {pillar.items.map((item, iIdx) => (
                    <div
                      key={iIdx}
                      className="rounded-2xl border border-line bg-card p-5 shadow-card hover:shadow-hero hover:border-accent/40 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="p-2.5 rounded-xl bg-moss border border-line">
                            {item.icon}
                          </div>
                          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-moss text-ink/70 border border-line/60">
                            {item.badge}
                          </span>
                        </div>

                        <h4 className="text-base font-display font-bold text-ink group-hover:text-accent transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-xs text-ink/65 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cryptographic Architecture In Detail */}
        <section className="px-4 py-16 sm:px-8 border-t border-line">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <Badge variant="accent">Security Verification</Badge>
              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-ink">
                Military-Grade Cryptography. Verified Locally.
              </h2>
              <p className="text-sm text-ink/65 max-w-xl mx-auto">
                Zero-knowledge architecture verified with authenticated AEAD ciphers and memory-hard key derivation.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 rounded-xl border border-line bg-card space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold">
                  <Cpu className="h-4 w-4 text-accent" />
                  <span>Argon2id KDF</span>
                </div>
                <p className="text-ink/65 leading-relaxed">
                  64 MB memory hardness with 3 computational passes. Impenetrable to GPU clusters and cloud botnets.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-line bg-card space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold">
                  <Shield className="h-4 w-4 text-accent" />
                  <span>XChaCha20-Poly1305</span>
                </div>
                <p className="text-ink/65 leading-relaxed">
                  192-bit extended nonce AEAD cipher preventing nonce-reuse vulnerabilities even across billions of items.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-line bg-card space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold">
                  <HardDrive className="h-4 w-4 text-accent" />
                  <span>Strict Network Guard</span>
                </div>
                <p className="text-ink/65 leading-relaxed">
                  Global fetch interceptor automatically traps and throws on unauthorized external network requests.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-line bg-card space-y-2">
                <div className="flex items-center gap-2 text-ink font-semibold">
                  <RefreshCw className="h-4 w-4 text-accent" />
                  <span>Ephemeral Memory</span>
                </div>
                <p className="text-ink/65 leading-relaxed">
                  Decrypted keys live strictly in memory and are cryptographically scrubbed on lock or tab closure.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Detailed Comparison Table */}
        <section className="px-4 py-16 sm:px-8 border-t border-line bg-card/30">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <Badge variant="accent">Architectural Comparison</Badge>
              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-ink">
                How AegisVault Compares to Cloud Password Managers
              </h2>
              <p className="text-sm text-ink/65 max-w-lg mx-auto">
                Compare local-first data sovereignty with traditional cloud subscription services.
              </p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-line bg-card shadow-card">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line bg-moss/50 text-ink/70">
                    <th className="p-3.5 font-bold uppercase tracking-wider">Feature</th>
                    <th className="p-3.5 font-bold text-accent uppercase tracking-wider bg-accent/5">
                      AegisVault (Safe & Local)
                    </th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Cloud Managers</th>
                    <th className="p-3.5 font-bold uppercase tracking-wider">Browser Autofill</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {comparisonData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-moss/20 transition-colors">
                      <td className="p-3.5 font-semibold text-ink">{row.feature}</td>
                      <td className="p-3.5 font-bold text-accent bg-accent/5">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                          <span>{row.aegis}</span>
                        </div>
                      </td>
                      <td className="p-3.5 text-ink/65">{row.cloud}</td>
                      <td className="p-3.5 text-ink/50">{row.browser}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="px-4 py-16 sm:px-8 border-t border-line">
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold">
                <HelpCircle className="h-4 w-4" />
                <span>Frequently Asked Questions</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-ink">
                Common Questions, Answered Simply
              </h2>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-xl border border-line bg-card overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-ink hover:bg-moss/40 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-ink/50 shrink-0 ml-3" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-ink/50 shrink-0 ml-3" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 text-xs text-ink/70 leading-relaxed border-t border-line/60 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Support Creator & Bottom Call to Action */}
        <section className="px-4 py-16 sm:px-8 border-t border-line bg-accent/5 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-ink">
              Ready to Protect Your Passwords & Bank Accounts?
            </h2>
            <p className="text-sm text-ink/70 leading-relaxed">
              No registration, no email verification, and no cloud risks. Set up your private digital safe in less than a minute.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto gap-2 px-8 py-3.5 shadow-hero text-sm font-bold cursor-pointer"
              >
                <span>Create My Free Vault</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              {hasVault && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/unlock')}
                  className="w-full sm:w-auto gap-2 px-8 py-3.5 text-sm font-semibold cursor-pointer"
                >
                  <Lock className="h-4 w-4 text-accent" />
                  <span>Go to Unlock</span>
                </Button>
              )}
              <BuyMeACoffeeButton size="lg" className="w-full sm:w-auto" />
            </div>

            {/* Highlighted Creator Line */}
            <div className="pt-6 flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/25 bg-card text-xs shadow-xs">
                <span className="text-ink/70 font-medium">Crafted with precision by</span>
                <span className="font-black tracking-wide text-accent bg-accent/15 px-2.5 py-0.5 rounded-md border border-accent/30 shadow-xs">
                  Krish Patel
                </span>
              </div>
              <span className="text-[11px] text-ink/50 font-mono">
                100% On-Device Cryptography • Zero Cloud Servers • Zero Telemetry
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Website Footer */}
      <footer className="border-t border-line bg-card px-4 sm:px-8 py-6 text-center text-xs text-ink/55">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <Shield className="h-4 w-4 text-accent" />
            <span>AegisVault</span>
            <span className="text-ink/40 font-normal">•</span>
            <span className="text-ink/70 font-medium">Crafted by</span>
            <span className="font-black tracking-wide text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/25 shadow-xs">
              Krish Patel
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-ink/60">
            <BuyMeACoffeeButton size="sm" />
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="hover:text-accent transition-colors cursor-pointer"
            >
              Create Vault
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => navigate('/unlock')}
              className="hover:text-accent transition-colors cursor-pointer"
            >
              Unlock
            </button>
            <span>•</span>
            <span className="font-mono text-[11px]">100% Offline & Private</span>
          </div>
        </div>
      </footer>

      {/* Create Vault Modal */}
      <CreateVaultModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </div>
  );
}
