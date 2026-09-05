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
} from 'lucide-react';
import { Button } from '@/ui/primitives/Button';
import { Badge } from '@/ui/primitives/Badge';
import { ThemeSelector } from '@/ui/navigation/ThemeSelector';
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

  const featureCards = [
    {
      icon: <Key className="h-6 w-6 text-accent" />,
      title: 'Passwords & Logins',
      desc: 'Store all website usernames and passwords. Copy passwords in 1-click or generate strong, uncrackable passwords.',
      badge: 'Autofill Ready',
    },
    {
      icon: <Building2 className="h-6 w-6 text-pine-600" />,
      title: 'Bank Accounts & Net Banking',
      desc: 'Keep account numbers, IFSC codes, profile passwords, net banking logins, and UPI PINs safely organized in one place.',
      badge: 'Banking Safe',
    },
    {
      icon: <FileText className="h-6 w-6 text-skyx-600" />,
      title: 'Cancelled Cheques & Documents',
      desc: 'Attach photos or PDF scans of cancelled cheques, passbooks, and certificates directly linked to your bank accounts.',
      badge: 'Cross-Linked',
    },
    {
      icon: <CreditCard className="h-6 w-6 text-mari-600" />,
      title: 'Debit & Credit Cards',
      desc: 'Store card numbers, CVVs, expiry dates, and ATM PINs. Filter your favourite cards so they show right at the top.',
      badge: 'Favorites Filter',
    },
    {
      icon: <Smartphone className="h-6 w-6 text-flare-500" />,
      title: 'Built-in 2-Factor Codes (2FA)',
      desc: 'Generate 6-digit authenticator security codes directly inside AegisVault. You do not need a separate authenticator app.',
      badge: 'Built-in TOTP',
    },
    {
      icon: <Shield className="h-6 w-6 text-accent" />,
      title: 'Aadhaar, PAN & ID Cards',
      desc: 'Securely store identity documents including Aadhaar, PAN card, Passport, and Voter ID numbers with instant copy tools.',
      badge: 'Identity Vault',
    },
    {
      icon: <Lock className="h-6 w-6 text-amber-500" />,
      title: 'Crypto Wallets & Seed Phrases',
      desc: 'Keep your 12 or 24-word recovery phrases, private keys, and SSH credentials completely safe from online malware.',
      badge: 'Cold Storage',
    },
    {
      icon: <Users className="h-6 w-6 text-pine-600" />,
      title: 'Emergency Family Access',
      desc: 'Nominate a trusted family member who can request access to your vault if an emergency happens, with a safe waiting period.',
      badge: 'Peace of Mind',
    },
  ];

  const faqs = [
    {
      q: 'Is AegisVault really 100% free?',
      a: 'Yes! AegisVault is completely free forever. There are no paid tiers, no trial periods, no ads, and no recurring monthly fees.',
    },
    {
      q: 'Can anyone else (or AegisVault team) see my passwords?',
      a: 'No. AegisVault uses zero-knowledge architecture. Your passwords and bank details are scrambled into unreadable gibberish using your master password before anything is saved. Nobody on the internet can see your data.',
    },
    {
      q: 'Does this app send my passwords to the cloud or internet?',
      a: 'Never. AegisVault runs 100% offline inside your browser or device storage. Zero external network calls are made. Your data stays entirely in your own hands.',
    },
    {
      q: 'How can I link a cancelled cheque to my bank account?',
      a: 'Open your Bank Account in the app, scroll to "Linked Documents & Cheques", and click "Attach File". Upload a photo or PDF of your cancelled cheque or passbook, and it will be safely linked and ready to view or download anytime.',
    },
    {
      q: 'What happens if I forget my master password?',
      a: 'When you create your vault, AegisVault gives you a 12-word secret recovery phrase. If you ever forget your master password, you can enter these 12 words to safely regain access to your locker.',
    },
    {
      q: 'Can I move my passwords to another computer or phone?',
      a: 'Yes! You can export an encrypted backup file from the Settings page and import it onto any other device in seconds. It also supports importing from Chrome, Bitwarden, and 1Password.',
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
              • Private Digital Locker
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
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
        <section className="relative overflow-hidden px-4 py-16 sm:py-24 text-center">
          {/* Subtle ambient gradient glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />

          <div className="max-w-3xl mx-auto space-y-6 anim-fade-up">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/30 bg-accent/10 text-xs font-semibold text-accent shadow-xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>100% Private • Stored Only On Your Device • Free Forever</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-ink leading-tight">
              Your Safe Digital Locker for{' '}
              <span className="text-accent underline decoration-accent/40 decoration-wavy decoration-2">
                Passwords & Bank Accounts
              </span>
            </h1>

            <p className="text-base sm:text-lg text-ink/70 max-w-2xl mx-auto leading-relaxed">
              Remembering passwords and hunting for bank details or cancelled cheques is frustrating.
              AegisVault stores all your sensitive credentials safely on your device — with zero cloud servers, zero ads, and zero risk of internet data leaks.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto gap-2 px-6 py-3 shadow-hero text-sm font-bold cursor-pointer"
              >
                <span>Create My Free Vault</span>
                <ArrowRight className="h-4 w-4" />
              </Button>

              {hasVault && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/unlock')}
                  className="w-full sm:w-auto gap-2 px-6 py-3 text-sm font-semibold cursor-pointer"
                >
                  <Lock className="h-4 w-4 text-accent" />
                  <span>Already Have a Vault? Unlock Here</span>
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-xs text-ink/60 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-pine-500" />
                <span>Zero Cloud Servers</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-pine-500" />
                <span>Works 100% Offline</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-pine-500" />
                <span>Military-Grade Encryption</span>
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-pine-500" />
                <span>No Email Required</span>
              </span>
            </div>
          </div>
        </section>

        {/* What Can You Store in AegisVault */}
        <section className="px-4 py-16 sm:px-8 border-t border-line bg-card/40">
          <div className="max-w-5xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-ink">
                Everything You Can Store In AegisVault
              </h2>
              <p className="text-sm sm:text-base text-ink/65 max-w-xl mx-auto">
                Organized neatly into clear categories so you can find any account or secret in seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featureCards.map((f, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-line bg-card p-5 shadow-card hover:shadow-hero hover:border-accent/40 transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-moss border border-line">
                        {f.icon}
                      </div>
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-moss text-ink/70 border border-line/60">
                        {f.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-display font-bold text-ink group-hover:text-accent transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs text-ink/65 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why AegisVault is Different (Comparison in simple English) */}
        <section className="px-4 py-16 sm:px-8 border-t border-line">
          <div className="max-w-4xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <Badge variant="accent">True Privacy</Badge>
              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-ink">
                Why Offline Storage Beats Traditional Cloud Apps
              </h2>
              <p className="text-sm text-ink/65 max-w-lg mx-auto">
                Big cloud companies suffer massive data breaches every year. AegisVault takes a completely different approach.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5 space-y-3">
                <h3 className="text-sm font-bold text-danger uppercase tracking-wider font-mono">
                  Cloud Password Managers
                </h3>
                <ul className="space-y-2.5 text-xs text-ink/70">
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span>Your passwords live on external company servers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span>Hackers target company databases to steal master databases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span>Requires monthly or yearly subscription fees</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-danger font-bold">✕</span>
                    <span>If company servers go down, you cannot log in</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-pine-500/40 bg-pine-500/5 p-5 space-y-3">
                <h3 className="text-sm font-bold text-pine-600 dark:text-pine-400 uppercase tracking-wider font-mono">
                  AegisVault (Safe & Local)
                </h3>
                <ul className="space-y-2.5 text-xs text-ink/85">
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-pine-600 dark:text-pine-400 shrink-0" />
                    <span><strong>100% on your device</strong> — zero data ever sent to any server</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-pine-600 dark:text-pine-400 shrink-0" />
                    <span><strong>Immune to cloud breaches</strong> because nothing is in the cloud</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-pine-600 dark:text-pine-400 shrink-0" />
                    <span><strong>100% Free</strong> with no subscriptions, trials, or hidden charges</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-pine-600 dark:text-pine-400 shrink-0" />
                    <span><strong>Works anytime offline</strong>, on flights, trains, and during outages</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works in 3 Steps */}
        <section className="px-4 py-16 sm:px-8 border-t border-line bg-card/30">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-ink">
                How AegisVault Works in 3 Simple Steps
              </h2>
              <p className="text-sm text-ink/65">
                Get up and running in less than 60 seconds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <div className="rounded-2xl border border-line bg-card p-5 space-y-3 relative shadow-card">
                <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs font-mono">
                  1
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  Pick a Master Password
                </h3>
                <p className="text-xs text-ink/65 leading-relaxed">
                  This is the only password you ever need to remember. It turns your vault into a locked safe.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-card p-5 space-y-3 relative shadow-card">
                <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs font-mono">
                  2
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  Add Passwords & Accounts
                </h3>
                <p className="text-xs text-ink/65 leading-relaxed">
                  Save your logins, bank accounts, cancelled cheque photos, credit cards, or private notes.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-card p-5 space-y-3 relative shadow-card">
                <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-xs font-mono">
                  3
                </div>
                <h3 className="font-display font-bold text-base text-ink">
                  Enjoy Complete Peace of Mind
                </h3>
                <p className="text-xs text-ink/65 leading-relaxed">
                  Lock the vault in one click with hotkey (Ctrl+L). Your data is impenetrable until you return.
                </p>
              </div>
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

        {/* Bottom Call to Action */}
        <section className="px-4 py-16 sm:px-8 border-t border-line bg-accent/5 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl sm:text-4xl font-display font-extrabold text-ink">
              Ready to Protect Your Digital Life?
            </h2>
            <p className="text-sm text-ink/65 leading-relaxed">
              No registration, no email verification, and no cloud risks. Set up your private safe in less than a minute.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:w-auto gap-2 px-8 py-3 shadow-hero text-sm font-bold cursor-pointer"
              >
                <span>Create My Free Vault</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              {hasVault && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/unlock')}
                  className="w-full sm:w-auto gap-2 px-8 py-3 text-sm font-semibold cursor-pointer"
                >
                  <Lock className="h-4 w-4 text-accent" />
                  <span>Go to Unlock</span>
                </Button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Website Footer */}
      <footer className="border-t border-line bg-card px-4 sm:px-8 py-6 text-center text-xs text-ink/55">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-ink">
            <Shield className="h-4 w-4 text-accent" />
            <span>AegisVault</span>
            <span className="text-ink/40 font-normal">• Crafted by Krish Patel</span>
          </div>

          <div className="flex items-center gap-4 text-xs text-ink/60">
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
