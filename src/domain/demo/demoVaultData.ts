import type {
  VaultItemEnvelope,
  VaultItemType,
  VaultFolder,
  AttachmentMetadata,
} from '@/domain/vault/types';

export const DEMO_FOLDERS: VaultFolder[] = [
  { id: 'f-work', name: 'Work & Infrastructure', createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'f-personal', name: 'Personal & Family', createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'f-finance', name: 'Banking & Investments', createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'f-crypto', name: 'Crypto & Web3 Wallets', createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'f-identity', name: 'Government & Legal IDs', createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'f-travel', name: 'Travel & Healthcare', createdAt: '2026-01-15T08:00:00.000Z' },
  { id: 'f-archive', name: 'Legacy Archive', createdAt: '2026-01-15T08:00:00.000Z' },
];

export const DEMO_ATTACHMENTS: AttachmentMetadata[] = [
  {
    id: 'att-passport-pdf',
    filename: 'Indian_Passport_Scan_2026.pdf',
    mediaType: 'application/pdf',
    sizeBytes: 1024 * 450, // 450 KB
    createdAt: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'att-pan-png',
    filename: 'PAN_Card_eVerified.png',
    mediaType: 'image/png',
    sizeBytes: 1024 * 280, // 280 KB
    createdAt: '2026-02-02T11:30:00.000Z',
  },
  {
    id: 'att-aadhaar-pdf',
    filename: 'eAadhaar_Masked_Signed.pdf',
    mediaType: 'application/pdf',
    sizeBytes: 1024 * 620, // 620 KB
    createdAt: '2026-02-05T14:15:00.000Z',
  },
  {
    id: 'att-health-insurance',
    filename: 'HDFC_Ergo_Health_Policy_2026.pdf',
    mediaType: 'application/pdf',
    sizeBytes: 1024 * 850, // 850 KB
    createdAt: '2026-02-10T09:45:00.000Z',
  },
  {
    id: 'att-ssl-cert',
    filename: 'wildcard_production_cert.pem',
    mediaType: 'text/plain',
    sizeBytes: 1024 * 8, // 8 KB
    createdAt: '2026-02-12T16:20:00.000Z',
  },
  {
    id: 'att-lease-pdf',
    filename: 'Residential_Tenancy_Agreement.pdf',
    mediaType: 'application/pdf',
    sizeBytes: 1024 * 1200, // 1.2 MB
    createdAt: '2026-02-15T13:00:00.000Z',
  },
  {
    id: 'att-driving-license',
    filename: 'Driving_License_FrontBack.png',
    mediaType: 'image/png',
    sizeBytes: 1024 * 340, // 340 KB
    createdAt: '2026-02-18T17:10:00.000Z',
  },
  {
    id: 'att-vehicle-rc',
    filename: 'Vehicle_Registration_SmartCard.pdf',
    mediaType: 'application/pdf',
    sizeBytes: 1024 * 510, // 510 KB
    createdAt: '2026-02-20T08:30:00.000Z',
  },
  {
    id: 'att-crypto-tax',
    filename: 'Koinly_Crypto_Tax_Report_2025.pdf',
    mediaType: 'application/pdf',
    sizeBytes: 1024 * 940, // 940 KB
    createdAt: '2026-02-22T19:00:00.000Z',
  },
  {
    id: 'att-medical-directive',
    filename: 'Advance_Medical_Directives_Will.pdf',
    mediaType: 'application/pdf',
    sizeBytes: 1024 * 780, // 780 KB
    createdAt: '2026-02-25T12:00:00.000Z',
  },
];

/**
 * Builds the 150+ realistic demo entries across all categories.
 */
export function generateDemoVaultItems(): VaultItemEnvelope[] {
  const items: VaultItemEnvelope[] = [];
  const now = '2026-03-01T12:00:00.000Z';

  // Helper to push items
  const push = (
    id: string,
    type: VaultItemType,
    title: string,
    payload: Record<string, unknown>,
    options: {
      favorite?: boolean | undefined;
      folderId?: string | undefined;
      tags?: string[] | undefined;
      vaultId?: string | undefined;
      attachmentIds?: string[] | undefined;
    } = {}
  ) => {
    const isWork =
      options.folderId === 'f-work' ||
      (options.tags &&
        (options.tags.includes('work') ||
          options.tags.includes('dev') ||
          options.tags.includes('devops')));
    const vaultId = options.vaultId || (isWork ? 'vault-work' : 'vault-personal');

    items.push({
      id,
      type,
      title,
      favorite: options.favorite ?? false,
      archived: false,
      vaultId,
      attachmentIds: options.attachmentIds,
      createdAt: now,
      updatedAt: now,
      payload,
    });
  };

  // ==========================================
  // 1. LOGINS & PASSWORDS (55 entries)
  // ==========================================
  const loginsData = [
    { id: 'log-1', title: 'Google Workspace', user: 'krish.developer@gmail.com', pass: 'p@$$w0rd-G00gle#99xL', url: 'https://accounts.google.com', totp: 'JBSWY3DPEHPK3PXP', fav: true, folder: 'f-work', tags: ['work', 'email', 'sso'] },
    { id: 'log-2', title: 'GitHub Enterprise', user: 'krish-dev', pass: 'ghp_super_Secr3t_K3y!9021', url: 'https://github.com/login', totp: 'KRSXG5CTMVRXEZLU', fav: true, folder: 'f-work', tags: ['dev', 'git', 'mfa'] },
    { id: 'log-3', title: 'AWS IAM Root Account', user: 'cloud-admin@aegisvault.io', pass: 'AwsRoot#2026*IronCladVault', url: 'https://aws.amazon.com/console', totp: 'HXDMVJECJJWSRB3H', fav: true, folder: 'f-work', tags: ['cloud', 'aws', 'prod'] },
    { id: 'log-4', title: 'Stripe Live Dashboard', user: 'finance@aegisvault.io', pass: 'StripeLive#77_PaymentEngine!', url: 'https://dashboard.stripe.com', totp: 'GEZDGNBVGY3TQOJQ', fav: true, folder: 'f-finance', tags: ['payments', 'finance'] },
    { id: 'log-5', title: 'Vercel Team Admin', user: 'deploy@aegisvault.io', pass: 'VercelEdge#Deploy2026!$', url: 'https://vercel.com/login', totp: 'MZXW6YTBOJUW4ZY=', folder: 'f-work', tags: ['hosting', 'frontend'] },
    { id: 'log-6', title: 'Cloudflare DNS & ZeroTrust', user: 'admin@aegisvault.io', pass: 'CF#ZeroTrust_99CloudProtect', url: 'https://dash.cloudflare.com', totp: 'NBSWY3DPEHPK3PXP', fav: true, folder: 'f-work', tags: ['dns', 'security'] },
    { id: 'log-7', title: 'Slack Workspace', user: 'krish@team.io', pass: 'SlackCollab#2026!Room', url: 'https://slack.com/signin', folder: 'f-work', tags: ['chat', 'work'] },
    { id: 'log-8', title: 'Notion Team Wiki', user: 'krish.notes@work.com', pass: 'NotionDocs#VaultArchitecture2026', url: 'https://notion.so/login', folder: 'f-work', tags: ['docs', 'wiki'] },
    { id: 'log-9', title: 'Figma Design System', user: 'krish.ui@design.io', pass: 'FigmaVectors#CanvasPixelPerfect!', url: 'https://figma.com/login', folder: 'f-work', tags: ['ui', 'design'] },
    { id: 'log-10', title: 'Linear Project Tracker', user: 'krish@linear.app', pass: 'LinearIssue#RoadmapCycle44', url: 'https://linear.app/login', folder: 'f-work', tags: ['pm', 'linear'] },
    { id: 'log-11', title: 'Supabase Postgres DB', user: 'db-owner@supabase.co', pass: 'PgSql#SupabaseCluster_5432!', url: 'https://supabase.com/dashboard', folder: 'f-work', tags: ['database', 'backend'] },
    { id: 'log-12', title: 'Docker Hub Registry', user: 'krishdocker', pass: 'DockerContainer#Engine9921', url: 'https://hub.docker.com', folder: 'f-work', tags: ['devops', 'docker'] },
    { id: 'log-13', title: 'DigitalOcean Droplets', user: 'infra@aegisvault.io', pass: 'DO_Droplet#Compute_K8s_Cluster', url: 'https://cloud.digitalocean.com', folder: 'f-work', tags: ['vps', 'cloud'] },
    { id: 'log-14', title: 'OpenAI Developer API', user: 'ai-lead@aegisvault.io', pass: 'OpenAI#GPT5_TitanPromptEngine', url: 'https://platform.openai.com', totp: 'OBXXK43VMJSSAZDP', fav: true, folder: 'f-work', tags: ['ai', 'api'] },
    { id: 'log-15', title: 'Anthropic Console', user: 'research@aegisvault.io', pass: 'Claude37#SonnetReasoningCluster', url: 'https://console.anthropic.com', folder: 'f-work', tags: ['ai', 'claude'] },
    { id: 'log-16', title: 'Apple ID (iCloud & Dev)', user: 'krish.apple@icloud.com', pass: 'AppleDev#KeyringSecure2026!', url: 'https://appleid.apple.com', totp: 'ONSWG4TFOR2HI2DF', fav: true, folder: 'f-personal', tags: ['apple', 'personal'] },
    { id: 'log-17', title: 'Netflix 4K Ultra HD', user: 'family.stream@gmail.com', pass: 'CinemaNights#Popcorn2026!', url: 'https://netflix.com', folder: 'f-personal', tags: ['streaming', 'entertainment'] },
    { id: 'log-18', title: 'Spotify Premium Family', user: 'music.krish@gmail.com', pass: 'HiFiAudio#LosslessBeats99', url: 'https://spotify.com', folder: 'f-personal', tags: ['music', 'media'] },
    { id: 'log-19', title: 'Amazon Prime Shopping', user: 'krish.prime@gmail.com', pass: 'PrimeDelivery#ExpressOrder26', url: 'https://amazon.in', totp: 'ORSXG5BAMJ2XEZLU', fav: true, folder: 'f-personal', tags: ['shopping', 'ecommerce'] },
    { id: 'log-20', title: 'Steam Gaming Library', user: 'krish_gamer99', pass: 'SteamDeck#HalfLifeGabe2026', url: 'https://store.steampowered.com', totp: 'OZSXE43BM5SXEZLU', folder: 'f-personal', tags: ['games', 'steam'] },
    { id: 'log-21', title: 'PlayStation Network (PSN)', user: 'krish_psn_pro', pass: 'DualSense#PS5ProGaming2026', url: 'https://my.playstation.com', folder: 'f-personal', tags: ['gaming', 'sony'] },
    { id: 'log-22', title: 'Discord Nitro Account', user: 'krish#0001', pass: 'VoiceChat#DiscordNitroElite26', url: 'https://discord.com/login', totp: 'PBWW63TFMV2GS3DF', folder: 'f-personal', tags: ['social', 'community'] },
    { id: 'log-23', title: 'Reddit Gold Account', user: 'krish_coder', pass: 'UpvoteKarma#SubredditPost2026', url: 'https://reddit.com/login', folder: 'f-personal', tags: ['social', 'news'] },
    { id: 'log-24', title: 'Twitter / X Verified', user: 'krish_dev_x', pass: 'TweetSpace#SocialFeed2026!', url: 'https://x.com/login', totp: 'PCUXI2BAMNQXEZLU', folder: 'f-personal', tags: ['social', 'twitter'] },
    { id: 'log-25', title: 'LinkedIn Executive Profile', user: 'krish.career@gmail.com', pass: 'CareerNetwork#Connections2026', url: 'https://linkedin.com', folder: 'f-work', tags: ['career', 'professional'] },
    { id: 'log-26', title: 'ProtonMail Encrypted Mail', user: 'krish.private@proton.me', pass: 'SwissVault#PGP_Encrypted_Inbox26', url: 'https://mail.proton.me', totp: 'PEUXK3TBO5SWM2DF', fav: true, folder: 'f-personal', tags: ['privacy', 'email'] },
    { id: 'log-27', title: 'Dropbox Plus 2TB', user: 'krish.storage@gmail.com', pass: 'CloudSync#BackupFolders2026', url: 'https://dropbox.com', folder: 'f-personal', tags: ['cloud', 'backup'] },
    { id: 'log-28', title: 'Microsoft 365 Enterprise', user: 'krish@corporate.onmicrosoft.com', pass: 'AzureAD#ExchangeOutlook2026!', url: 'https://login.microsoftonline.com', totp: 'PFRXI43BNRSXG2DF', folder: 'f-work', tags: ['office', 'microsoft'] },
    { id: 'log-29', title: 'Atlassian Jira & Confluence', user: 'krish@techteam.atlassian.net', pass: 'SprintBoard#KanbanAgile2026!', url: 'https://id.atlassian.com', folder: 'f-work', tags: ['jira', 'agile'] },
    { id: 'log-30', title: 'GitLab Ultimate Self-Hosted', user: 'root-admin', pass: 'GitLabCI#DevSecOpsPipeline2026', url: 'https://gitlab.company.internal', totp: 'PGUXG5DFMNXXEZLU', folder: 'f-work', tags: ['gitlab', 'ci-cd'] },
    { id: 'log-31', title: 'Uber Passenger & Eats', user: '+919876543210', pass: 'UberRide#TransitCity2026!', url: 'https://uber.com', folder: 'f-travel', tags: ['rides', 'travel'] },
    { id: 'log-32', title: 'Airbnb Verified Host/Guest', user: 'travel.krish@gmail.com', pass: 'VacationVilla#Getaway2026!', url: 'https://airbnb.com', folder: 'f-travel', tags: ['stays', 'travel'] },
    { id: 'log-33', title: 'MakeMyTrip Flight Portal', user: 'trips.krish@gmail.com', pass: 'FlightBooking#AirTicket2026', url: 'https://makemytrip.com', folder: 'f-travel', tags: ['flights', 'travel'] },
    { id: 'log-34', title: 'IRCTC Railway Booking', user: 'krish_rail99', pass: 'TatkalExpress#TrainBooking26', url: 'https://irctc.co.in', folder: 'f-travel', tags: ['railway', 'india'] },
    { id: 'log-35', title: 'Zomato Gold Delivery', user: '+919876543210', pass: 'GourmetDining#FoodDelivery26', url: 'https://zomato.com', folder: 'f-personal', tags: ['food', 'delivery'] },
    { id: 'log-36', title: 'Swiggy One Membership', user: 'foodie.krish@gmail.com', pass: 'FastDelivery#InstamartSnacks26', url: 'https://swiggy.com', folder: 'f-personal', tags: ['food', 'delivery'] },
    { id: 'log-37', title: 'BookMyShow Movies & Events', user: 'movies.krish@gmail.com', pass: 'CinemaTicket#IMAXPremiere26', url: 'https://bookmyshow.com', folder: 'f-personal', tags: ['entertainment'] },
    { id: 'log-38', title: 'Medium Member Publishing', user: 'krish.writer@gmail.com', pass: 'TechArticle#PublishingStory26', url: 'https://medium.com', folder: 'f-work', tags: ['blog', 'writing'] },
    { id: 'log-39', title: 'Substack Paid Newsletter', user: 'krish.newsletter@gmail.com', pass: 'Newsletter#Subscribers2026', url: 'https://substack.com', folder: 'f-work', tags: ['newsletter'] },
    { id: 'log-40', title: 'Twitch Partner Streamer', user: 'krish_streams', pass: 'Broadcast#LiveStreaming60FPS', url: 'https://twitch.tv', totp: 'PJRXG5CTMNXXEZLU', folder: 'f-personal', tags: ['streaming'] },
    { id: 'log-41', title: 'Epic Games Store', user: 'krish_unreal', pass: 'UnrealEngine#FortniteBattlePass26', url: 'https://epicgames.com', folder: 'f-personal', tags: ['gaming'] },
    { id: 'log-42', title: 'Adobe Creative Cloud', user: 'design.cloud@aegisvault.io', pass: 'Photoshop#IllustratorVector26!', url: 'https://creativecloud.adobe.com', folder: 'f-work', tags: ['adobe', 'creative'] },
    { id: 'log-43', title: 'Canva Pro Enterprise', user: 'marketing@aegisvault.io', pass: 'CanvaTemplate#Graphics2026!', url: 'https://canva.com', folder: 'f-work', tags: ['marketing'] },
    { id: 'log-44', title: 'Shopify Store Admin', user: 'merchant@storefront.io', pass: 'Ecommerce#InventoryCart2026!', url: 'https://admin.shopify.com', totp: 'PKUXK43BMNXXEZLU', folder: 'f-finance', tags: ['ecommerce'] },
    { id: 'log-45', title: 'Coinbase Pro Trading', user: 'crypto.krish@proton.me', pass: 'ExchangeTrading#LimitOrderBTC26', url: 'https://coinbase.com', totp: 'PLUXI2BAMNQXEZLU', fav: true, folder: 'f-crypto', tags: ['crypto', 'exchange'] },
    { id: 'log-46', title: 'Binance Global VIP', user: 'binance.trader@proton.me', pass: 'SpotTrading#BinanceFutures2026!', url: 'https://binance.com', totp: 'PMUXG5DFMNXXEZLU', fav: true, folder: 'f-crypto', tags: ['crypto', 'trading'] },
    { id: 'log-47', title: 'Kraken Institutional Account', user: 'kraken.vault@proton.me', pass: 'SecurityTier4#KrakenStaking2026', url: 'https://kraken.com', totp: 'PNUXK3TBO5SWM2DF', folder: 'f-crypto', tags: ['crypto'] },
    { id: 'log-48', title: 'Ledger Live Sync', user: 'cold.ledger@proton.me', pass: 'HardwareSigner#NanoXSecureElement26', url: 'https://ledger.com', folder: 'f-crypto', tags: ['hardware', 'ledger'] },
    { id: 'log-49', title: 'Perplexity AI Pro', user: 'search.ai@gmail.com', pass: 'DeepResearch#SourceCitations2026', url: 'https://perplexity.ai', folder: 'f-work', tags: ['ai', 'search'] },
    { id: 'log-50', title: 'Midjourney Prompt Studio', user: 'prompt.art@gmail.com', pass: 'GenerativeArt#DiffusionV7_Ultra', url: 'https://midjourney.com', folder: 'f-work', tags: ['ai', 'art'] },
    { id: 'log-51', title: 'Old Forum Account (Weak)', user: 'krish99', pass: 'password123', url: 'https://oldforum.net', folder: 'f-archive', tags: ['weak', 'audit'] },
    { id: 'log-52', title: 'Legacy Blog (Reused Pass)', user: 'krish.blog', pass: 'password123', url: 'https://myoldblog.org', folder: 'f-archive', tags: ['reused', 'audit'] },
    { id: 'log-53', title: 'Old Gaming Portal (Reused)', user: 'gamer_krish', pass: 'password123', url: 'https://classicgames.com', folder: 'f-archive', tags: ['reused', 'audit'] },
    { id: 'log-54', title: 'School Alumni Portal (Old)', user: 'alumni_2018', pass: 'welcome2018', url: 'https://alumninetwork.edu', folder: 'f-archive', tags: ['stale', 'audit'] },
    { id: 'log-55', title: 'Test Staging Sandbox', user: 'stage_test', pass: 'admin', url: 'https://staging.internal.dev', folder: 'f-archive', tags: ['weak', 'audit'] },
  ];

  for (const l of loginsData) {
    push(l.id, 'login', l.title, {
      username: l.user,
      password: l.pass,
      url: l.url,
      totp: l.totp,
    }, {
      favorite: l.fav,
      folderId: l.folder,
      tags: l.tags,
    });
  }

  // ==========================================
  // 2. CREDIT & DEBIT CARDS (20 entries)
  // ==========================================
  const cardsData = [
    { id: 'c-1', title: 'Chase Sapphire Reserve', name: 'KRISH SHARMA', num: '4147202688341029', m: '09', y: '2029', cvv: '482', pin: '4921', brand: 'visa', type: 'credit_card', fav: true },
    { id: 'c-2', title: 'Amex Platinum Metal', name: 'KRISH SHARMA', num: '378282246310005', m: '12', y: '2030', cvv: '9281', pin: '7712', brand: 'amex', type: 'credit_card', fav: true },
    { id: 'c-3', title: 'Apple Card Goldman Sachs', name: 'KRISH SHARMA', num: '5412752699123456', m: '05', y: '2028', cvv: '310', brand: 'mastercard', type: 'credit_card', fav: true },
    { id: 'c-4', title: 'Capital One Venture X', name: 'KRISH SHARMA', num: '4003202611223344', m: '08', y: '2029', cvv: '719', pin: '8832', brand: 'visa', type: 'credit_card' },
    { id: 'c-5', title: 'HDFC Regalia Gold Metal', name: 'KRISH SHARMA', num: '4539123456789012', m: '11', y: '2028', cvv: '621', pin: '1945', brand: 'visa', type: 'credit_card', fav: true },
    { id: 'c-6', title: 'HDFC Millennia Cashback', name: 'KRISH SHARMA', num: '5241882612345678', m: '04', y: '2027', cvv: '992', pin: '5521', brand: 'mastercard', type: 'credit_card' },
    { id: 'c-7', title: 'ICICI Amazon Pay Card', name: 'KRISH SHARMA', num: '4312892698765432', m: '07', y: '2028', cvv: '154', pin: '6723', brand: 'visa', type: 'credit_card' },
    { id: 'c-8', title: 'SBI SimplyCLICK Visa', name: 'KRISH SHARMA', num: '4726192634567890', m: '03', y: '2027', cvv: '820', pin: '3319', brand: 'visa', type: 'credit_card' },
    { id: 'c-9', title: 'Axis Bank Magnus Lounge', name: 'KRISH SHARMA', num: '5120342612345678', m: '10', y: '2029', cvv: '439', pin: '2810', brand: 'mastercard', type: 'credit_card' },
    { id: 'c-10', title: 'RuPay Select Platinum Debit', name: 'KRISH SHARMA', num: '6521502699112233', m: '06', y: '2028', cvv: '277', pin: '9012', brand: 'rupay', type: 'debit_card', fav: true },
    { id: 'c-11', title: 'Kotak 811 Virtual Visa Debit', name: 'KRISH SHARMA', num: '4214882655443322', m: '02', y: '2027', cvv: '519', brand: 'visa', type: 'debit_card' },
    { id: 'c-12', title: 'Bank of America Travel Rewards', name: 'KRISH SHARMA', num: '4800112677889900', m: '01', y: '2029', cvv: '633', pin: '4410', brand: 'visa', type: 'credit_card' },
    { id: 'c-13', title: 'Citi Double Cash 2%', name: 'KRISH SHARMA', num: '5424182600112233', m: '09', y: '2028', cvv: '812', pin: '7729', brand: 'mastercard', type: 'credit_card' },
    { id: 'c-14', title: 'Discover it 5% CashBack', name: 'KRISH SHARMA', num: '6011002611112222', m: '11', y: '2027', cvv: '940', pin: '1209', brand: 'discover', type: 'credit_card' },
    { id: 'c-15', title: 'Barclays Aviator Red AAdvantage', name: 'KRISH SHARMA', num: '5300122633445566', m: '08', y: '2028', cvv: '328', pin: '6532', brand: 'mastercard', type: 'credit_card' },
    { id: 'c-16', title: 'Standard Chartered Ultimate', name: 'KRISH SHARMA', num: '4909182622334455', m: '05', y: '2029', cvv: '190', pin: '9841', brand: 'visa', type: 'credit_card' },
    { id: 'c-17', title: 'Chase Freedom Unlimited', name: 'KRISH SHARMA', num: '4246042688776655', m: '10', y: '2027', cvv: '502', pin: '3190', brand: 'visa', type: 'credit_card' },
    { id: 'c-18', title: 'Wells Fargo Active Cash', name: 'KRISH SHARMA', num: '4024002644332211', m: '04', y: '2029', cvv: '761', pin: '8201', brand: 'visa', type: 'credit_card' },
    { id: 'c-19', title: 'HSBC Premier World Elite', name: 'KRISH SHARMA', num: '5521992611223344', m: '12', y: '2030', cvv: '419', pin: '5612', brand: 'mastercard', type: 'credit_card' },
    { id: 'c-20', title: 'Visa Signature Infinite Diamond', name: 'KRISH SHARMA', num: '4111112611111111', m: '07', y: '2030', cvv: '888', pin: '9999', brand: 'visa', type: 'credit_card' },
  ];

  for (const c of cardsData) {
    push(c.id, c.type as VaultItemType, c.title, {
      cardholderName: c.name,
      cardNumber: c.num,
      expiryMonth: c.m,
      expiryYear: c.y,
      cvv: c.cvv,
      pin: c.pin,
      cardBrand: c.brand,
    }, {
      favorite: c.fav,
      folderId: 'f-finance',
      tags: ['finance', 'cards', c.type],
    });
  }

  // ==========================================
  // 3. BANK ACCOUNTS & NETBANKING (15 entries)
  // ==========================================
  const banksData = [
    { id: 'b-1', title: 'HDFC Bank Salary Advantage', bank: 'HDFC Bank Ltd', acc: '50100293847561', holder: 'Krish Sharma', ifsc: 'HDFC0000240', swift: 'HDFCINBB', type: 'salary', fav: true },
    { id: 'b-2', title: 'ICICI Wealth Management', bank: 'ICICI Bank', acc: '001105029384', holder: 'Krish Sharma', ifsc: 'ICIC0000011', swift: 'ICICINBB', type: 'savings', fav: true },
    { id: 'b-3', title: 'State Bank of India Current', bank: 'State Bank of India', acc: '38291048592', holder: 'Krish Technologies OPC', ifsc: 'SBIN0001234', swift: 'SBININBB', type: 'current' },
    { id: 'b-4', title: 'Chase Premier Checking (US)', bank: 'JPMorgan Chase Bank, N.A.', acc: '984729104', holder: 'Krish Sharma', routing: '021000021', swift: 'CHASUS33', type: 'checking', fav: true },
    { id: 'b-5', title: 'Bank of America Core Checking', bank: 'Bank of America', acc: '48392019485', holder: 'Krish Sharma', routing: '121000358', swift: 'BOFAUS3N', type: 'checking' },
    { id: 'b-6', title: 'Wells Fargo Way2Save', bank: 'Wells Fargo Bank, N.A.', acc: '2948102938', holder: 'Krish Sharma', routing: '121042882', swift: 'WFBIUS6S', type: 'savings' },
    { id: 'b-7', title: 'HSBC Premier Global Expat', bank: 'HSBC Bank UK', acc: '40192837', holder: 'Krish Sharma', routing: '40-02-15', swift: 'MIDLGB22', type: 'checking' },
    { id: 'b-8', title: 'Barclays Everyday Saver', bank: 'Barclays Bank UK', acc: '92837461', holder: 'Krish Sharma', routing: '20-00-00', swift: 'BARCGB22', type: 'savings' },
    { id: 'b-9', title: 'Citibank Wealth Global Hub', bank: 'Citibank N.A.', acc: '839201928', holder: 'Krish Sharma', routing: '021000089', swift: 'CITIUS33', type: 'savings' },
    { id: 'b-10', title: 'Kotak Mahindra Privy League', bank: 'Kotak Mahindra Bank', acc: '8492019483', holder: 'Krish Sharma', ifsc: 'KKBK0000958', type: 'savings' },
    { id: 'b-11', title: 'Axis Bank Burgundy Account', bank: 'Axis Bank', acc: '912010048291029', holder: 'Krish Sharma', ifsc: 'UTIB0000004', type: 'savings' },
    { id: 'b-12', title: 'Charles Schwab High Yield', bank: 'Charles Schwab Bank', acc: '1092837465', holder: 'Krish Sharma', routing: '121202211', type: 'checking', fav: true },
    { id: 'b-13', title: 'Fidelity Cash Management', bank: 'Fidelity Investments', acc: 'Z89201948', holder: 'Krish Sharma', routing: '071923284', type: 'checking' },
    { id: 'b-14', title: 'Standard Chartered Priority', bank: 'Standard Chartered Bank', acc: '2394019284', holder: 'Krish Sharma', ifsc: 'SCBL0036001', type: 'savings' },
    { id: 'b-15', title: 'Union Bank PPF Public Provident', bank: 'Union Bank of India', acc: '520101293847561', holder: 'Krish Sharma', ifsc: 'UBIN0532011', type: 'savings' },
  ];

  for (const b of banksData) {
    push(b.id, 'bank_account', b.title, {
      bankName: b.bank,
      accountNumber: b.acc,
      accountHolderName: b.holder,
      ifscCode: b.ifsc,
      routingNumber: b.routing,
      swiftCode: b.swift,
      accountType: b.type,
    }, {
      favorite: b.fav,
      folderId: 'f-finance',
      tags: ['finance', 'bank', b.type],
    });
  }

  // ==========================================
  // 4. UPI HANDLES & PINS (15 entries)
  // ==========================================
  const upiData = [
    { id: 'u-1', title: 'Google Pay Primary UPI', vpa: 'krish@okhdfcbank', pin: '8921', bank: 'HDFC Bank', fav: true },
    { id: 'u-2', title: 'PhonePe Fast UPI', vpa: '9876543210@ybl', pin: '8921', bank: 'Yes Bank / HDFC', fav: true },
    { id: 'u-3', title: 'ICICI iMobile Direct VPA', vpa: 'krish@icici', pin: '1492', bank: 'ICICI Bank' },
    { id: 'u-4', title: 'Paytm Payments UPI', vpa: 'krish@paytm', pin: '7734', bank: 'Paytm Bank' },
    { id: 'u-5', title: 'Axis Bank Freecharge UPI', vpa: 'business@okaxis', pin: '4920', bank: 'Axis Bank' },
    { id: 'u-6', title: 'Amazon Pay UPI Handle', vpa: 'krish.orders@apl', pin: '8921', bank: 'HDFC Bank' },
    { id: 'u-7', title: 'CRED UPI Special Member', vpa: 'krish@cred', pin: '8921', bank: 'HDFC Bank', fav: true },
    { id: 'u-8', title: 'BHIM Government Standard', vpa: 'krish@upi', pin: '2819', bank: 'SBI Bank' },
    { id: 'u-9', title: 'Slice Super UPI Card', vpa: 'krish@slice', pin: '5512', bank: 'Slice NBFC' },
    { id: 'u-10', title: 'Jupiter Neobank Salary VPA', vpa: 'krish@jupiteraxis', pin: '9041', bank: 'Federal Bank' },
    { id: 'u-11', title: 'Fi Money Federal UPI', vpa: 'krish@fifederal', pin: '3921', bank: 'Federal Bank' },
    { id: 'u-12', title: 'Airtel Payments Bank UPI', vpa: 'krish@airtel', pin: '6712', bank: 'Airtel Bank' },
    { id: 'u-13', title: 'FamPay GenZ Family UPI', vpa: 'family@fam', pin: '4821', bank: 'IDFC First' },
    { id: 'u-14', title: 'Kotak 811 FastPay VPA', vpa: 'krish@kotak', pin: '1904', bank: 'Kotak Mahindra' },
    { id: 'u-15', title: 'India Post Payments UPI', vpa: 'krish@postbank', pin: '8219', bank: 'IPPB' },
  ];

  for (const u of upiData) {
    push(u.id, 'upi', u.title, {
      vpaAddress: u.vpa,
      upiPin: u.pin,
      linkedBankName: u.bank,
      notes: `Secured UPI Virtual Payment Address for ${u.bank}`,
    }, {
      favorite: u.fav,
      folderId: 'f-finance',
      tags: ['upi', 'payments', 'india'],
    });
  }

  // ==========================================
  // 5. GOVERNMENT & IDENTITY RECORDS (15 entries)
  // ==========================================
  const identitiesData = [
    { id: 'id-1', title: 'Indian Permanent Account Number (PAN)', type: 'pan', holder: 'Krish Sharma', num: 'ABCDE1234F', dob: '1995-08-15', fav: true, att: ['att-pan-png'] },
    { id: 'id-2', title: 'Indian Aadhaar Unique ID', type: 'aadhaar', holder: 'Krish Sharma', num: '348291048593', dob: '1995-08-15', fav: true, att: ['att-aadhaar-pdf'] },
    { id: 'id-3', title: 'Republic of India Passport (36 Pages)', type: 'passport', holder: 'Krish Sharma', num: 'Z8920194', dob: '1995-08-15', exp: '2034-05-20', fav: true, att: ['att-passport-pdf'] },
    { id: 'id-4', title: 'United States B1/B2 Tourist Visa', type: 'identity', holder: 'Krish Sharma', num: 'E94820194', exp: '2032-11-10', fav: true },
    { id: 'id-5', title: 'Maharashtra State Driving License', type: 'driving_license', holder: 'Krish Sharma', num: 'MH-02-20160049281', dob: '1995-08-15', exp: '2036-08-14', att: ['att-driving-license'] },
    { id: 'id-6', title: 'California Driver License & REAL ID', type: 'driving_license', holder: 'Krish Sharma', num: 'D9820194', dob: '1995-08-15', exp: '2028-08-15' },
    { id: 'id-7', title: 'Election Commission Voter ID (EPIC)', type: 'voter_id', holder: 'Krish Sharma', num: 'XMK9283746' },
    { id: 'id-8', title: 'US Social Security Card (SSN)', type: 'tax_id', holder: 'Krish Sharma', num: '984-29-1048' },
    { id: 'id-9', title: 'Global Entry & TSA PreCheck PASSID', type: 'identity', holder: 'Krish Sharma', num: '984729104', exp: '2029-04-12' },
    { id: 'id-10', title: 'Schengen Multi-Entry Visa (France)', type: 'identity', holder: 'Krish Sharma', num: 'FRA849201948', exp: '2027-09-30' },
    { id: 'id-11', title: 'UK Standard Visitor Visa (5 Years)', type: 'identity', holder: 'Krish Sharma', num: 'UKV9482019', exp: '2029-01-15' },
    { id: 'id-12', title: 'GST Identification Number (GSTIN)', type: 'tax_id', holder: 'Krish Technologies Pvt Ltd', num: '27ABCDE1234F1Z5' },
    { id: 'id-13', title: 'Corporate Identity Number (CIN)', type: 'identity', holder: 'Krish Technologies Pvt Ltd', num: 'U72900MH2022PTC384920' },
    { id: 'id-14', title: 'Vehicle Registration Certificate (RC)', type: 'identity', holder: 'Krish Sharma', num: 'MH-02-EE-9921', att: ['att-vehicle-rc'] },
    { id: 'id-15', title: 'Ayushman Bharat Digital Health ID (ABHA)', type: 'identity', holder: 'Krish Sharma', num: '91-2094-8291-0485' },
  ];

  for (const idObj of identitiesData) {
    push(idObj.id, idObj.type as VaultItemType, idObj.title, {
      fullName: idObj.holder,
      documentNumber: idObj.num,
      panNumber: idObj.type === 'pan' ? idObj.num : undefined,
      aadhaarNumber: idObj.type === 'aadhaar' ? idObj.num : undefined,
      passportNumber: idObj.type === 'passport' ? idObj.num : undefined,
      licenseNumber: idObj.type === 'driving_license' ? idObj.num : undefined,
      epicNumber: idObj.type === 'voter_id' ? idObj.num : undefined,
      taxIdNumber: idObj.type === 'tax_id' ? idObj.num : undefined,
      dateOfBirth: idObj.dob,
      expiryDate: idObj.exp,
    }, {
      favorite: idObj.fav,
      folderId: 'f-identity',
      tags: ['identity', 'government', idObj.type],
      attachmentIds: idObj.att,
    });
  }

  // ==========================================
  // 6. INSURANCE POLICIES (8 entries)
  // ==========================================
  const insuranceData = [
    { id: 'ins-1', title: 'HDFC ERGO Optima Secure (₹1 Crore)', provider: 'HDFC ERGO General Insurance', policyNum: '2819-1092-3847-00', insured: 'Krish Sharma & Family', sum: '₹1,00,00,000', phone: '1800-2666-4000', type: 'health', fav: true, att: ['att-health-insurance'] },
    { id: 'ins-2', title: 'LIC Tech Term Life Cover (₹2.5 Crore)', provider: 'Life Insurance Corporation of India', policyNum: '948201948', insured: 'Krish Sharma', sum: '₹2,50,00,000', phone: '022-68276827', type: 'life', fav: true },
    { id: 'ins-3', title: 'Care Health Global Supreme', provider: 'Care Health Insurance', policyNum: 'CH-94820194-01', insured: 'Parents (Senior Citizens)', sum: '₹50,00,000', phone: '1800-102-4455', type: 'health' },
    { id: 'ins-4', title: 'ICICI Lombard Zero-Dep Car Shield', provider: 'ICICI Lombard General Insurance', policyNum: '3001/29481029/00/000', insured: 'Hyundai Ioniq 5 (MH-02-EE-9921)', sum: '₹45,00,000', phone: '1800-2666', type: 'vehicle', fav: true },
    { id: 'ins-5', title: 'Tata AIG Worldwide Travel Guard', provider: 'Tata AIG General Insurance', policyNum: 'TG-2026-948201', insured: 'Krish Sharma', sum: '$500,000 USD', phone: '+1-800-828-244', type: 'travel' },
    { id: 'ins-6', title: 'Star Health Comprehensive Family Floater', provider: 'Star Health and Allied Insurance', policyNum: 'P/111111/01/2026/009482', insured: 'Krish Sharma', sum: '₹25,00,000', phone: '1800-425-2255', type: 'health' },
    { id: 'ins-7', title: 'Bajaj Allianz Home Shield Protection', provider: 'Bajaj Allianz General Insurance', policyNum: 'OG-26-9902-1801-00002910', insured: 'Apartment 1402, Mumbai', sum: '₹3,00,00,000', phone: '1800-209-5858', type: 'home' },
    { id: 'ins-8', title: 'Digit Cyber Insurance Fraud Protection', provider: 'Go Digit General Insurance', policyNum: 'DGT-CYB-2026-9482', insured: 'Krish Sharma', sum: '₹10,00,000', phone: '1800-258-4242', type: 'other' },
  ];

  for (const ins of insuranceData) {
    push(ins.id, 'insurance', ins.title, {
      provider: ins.provider,
      policyNumber: ins.policyNum,
      insuredPersonOrAsset: ins.insured,
      coverageAmount: ins.sum,
      emergencyClaimPhone: ins.phone,
      policyType: ins.type,
      startDate: '2026-01-01',
      renewalDate: '2027-01-01',
      notes: `24/7 TPA Cashless Network Hospital Claim Line: ${ins.phone}`,
    }, {
      favorite: ins.fav,
      folderId: 'f-travel',
      tags: ['insurance', ins.type, 'health'],
      attachmentIds: ins.att,
    });
  }

  // ==========================================
  // 7. EMERGENCY CONTACTS (6 entries)
  // ==========================================
  const contactsData = [
    { id: 'ec-1', title: 'Primary Next-of-Kin (Spouse)', name: 'Priya Sharma', rel: 'Spouse & Primary Executor', phone: '+91 98765 00001', email: 'priya.sharma@gmail.com', fav: true },
    { id: 'ec-2', title: 'Secondary Contact (Father)', name: 'Rajesh Sharma', rel: 'Father', phone: '+91 98765 00002', email: 'rajesh.sharma@gmail.com', fav: true },
    { id: 'ec-3', title: 'Family Physician & Doctor', name: 'Dr. Anand Mehta, MD', rel: 'Chief Medical Doctor', phone: '+91 98200 12345', email: 'dr.mehta@mumbaiclinic.org', fav: true },
    { id: 'ec-4', title: 'Corporate Legal Counsel & Attorney', name: 'Advocate Vikram Singhania', rel: 'Legal Advisor & Will Trustee', phone: '+91 98111 98765', email: 'vikram@singhanialaw.com' },
    { id: 'ec-5', title: 'Trusted Tech Co-Founder', name: 'Arjun Verma', rel: 'Co-Founder & Key Custodian', phone: '+91 98333 45678', email: 'arjun@aegisvault.io' },
    { id: 'ec-6', title: 'Emergency SOS 24/7 Helpline', name: 'National Emergency Response (112)', rel: 'Police / Ambulance / Fire', phone: '112', fav: true },
  ];

  for (const c of contactsData) {
    push(c.id, 'emergency_contact', c.title, {
      fullName: c.name,
      relationship: c.rel,
      primaryPhone: c.phone,
      email: c.email,
      notes: 'Authorized in Emergency Access Kit for verification protocol.',
    }, {
      favorite: c.fav,
      folderId: 'f-personal',
      tags: ['emergency', 'contact', 'family'],
    });
  }

  // ==========================================
  // 8. SECURE MARKDOWN NOTES (10 entries)
  // ==========================================
  const notesData = [
    {
      id: 'n-1',
      title: 'Home Wi-Fi & Smart Home Master Passwords',
      content: `# Home Wi-Fi & Network Topology\n\n## 1. Primary Mesh Wi-Fi (Wi-Fi 7)\n- **SSID**: \`IronClad-Mesh-5GHz\`\n- **WPA3 Passphrase**: \`Titan#FiberOptic99_GigabitSpeed\`\n- **Router Admin IP**: \`192.168.1.1\`\n\n## 2. IoT Isolated VLAN (2.4GHz)\n- **SSID**: \`HomeIoT-Isolated\`\n- **Passphrase**: \`SmartBulbs#CameraSensors2026\``,
      fav: true,
      folder: 'f-personal',
      tags: ['home', 'wifi', 'network'],
    },
    {
      id: 'n-2',
      title: 'Server Migration & Disaster Recovery Runbook',
      content: `# Production Disaster Recovery Runbook\n\n## Immediate Failover Checklist\n- [ ] 1. Verify Cloudflare Health Check DNS routing\n- [ ] 2. Spin up standby Postgres replica in AWS us-east-2\n- [ ] 3. Decrypt and mount offsite encrypted snapshots\n- [ ] 4. Run sanity smoke tests: \`curl -I https://api.aegisvault.io/health\``,
      fav: true,
      folder: 'f-work',
      tags: ['devops', 'runbook', 'prod'],
    },
    {
      id: 'n-3',
      title: 'Crypto Cold Storage & Shamir Backup Instructions',
      content: `# Cold Storage Key Custody Instructions\n\n## Storage Locations\n1. **Shard 1 (Physical Steel Plate)**: Safe Deposit Box at HDFC Bank Nariman Point\n2. **Shard 2 (Cryptosteel Capsule)**: Fireproof Home Safe\n3. **Shard 3**: Entrusted to Legal Attorney Advocate Singhania\n\n> Threshold: **2-of-3 Shards** required.`,
      fav: true,
      folder: 'f-crypto',
      tags: ['crypto', 'security', 'cold-storage'],
    },
    {
      id: 'n-4',
      title: 'International Travel Packing & Health Checklist',
      content: `# International Travel Protocol 2026\n\n## Essential Documents\n- [ ] Physical Passport with 6+ months validity\n- [ ] International Driving Permit (IDP)\n- [ ] Travel Insurance Certificate printed`,
      folder: 'f-travel',
      tags: ['travel', 'checklist'],
    },
    {
      id: 'n-5',
      title: 'Legal Will & Power of Attorney Summary',
      content: `# Legal Will & Testament Summary\n\n- **Registered Date**: 12 January 2026\n- **Sole Beneficiary & Executor**: Priya Sharma (Spouse)\n- **Original Physical Document**: Stored in Safe Deposit Locker #214, HDFC Bank`,
      fav: true,
      folder: 'f-identity',
      tags: ['legal', 'will', 'estate'],
    },
    {
      id: 'n-6',
      title: 'Car Maintenance, Fastag & Insurance Record',
      content: `# Vehicle Maintenance Log\n\n- **Vehicle**: Hyundai Ioniq 5 Electric (2024)\n- **VIN / Chassis**: \`MALH8492019485029\`\n- **Fastag ID**: \`FASTAG-ICICI-948201948\``,
      folder: 'f-personal',
      tags: ['car', 'maintenance'],
    },
    {
      id: 'n-7',
      title: 'Tax Filing 2026 Checklist & CA Coordinates',
      content: `# Tax Filing Checklist FY 2025-26\n\n## Chartered Accountant\n- **Firm**: Singhi & Associates CA Firm\n- **Partner**: CA Amit Singhi, FCA`,
      folder: 'f-finance',
      tags: ['tax', 'finance', 'audit'],
    },
    {
      id: 'n-8',
      title: 'Private SSH Config & Server Fingerprints',
      content: `# Infrastructure SSH Config\n\n\`\`\`ssh-config\nHost production-k8s-master\n    HostName 10.0.1.50\n    User ubuntu\n    IdentityFile ~/.ssh/id_ed25519_production\n\`\`\``,
      folder: 'f-work',
      tags: ['ssh', 'dev', 'sysadmin'],
    },
    {
      id: 'n-9',
      title: 'Medical History, Blood Group & Allergy Reference',
      content: `# Family Health Reference\n\n## Krish Sharma\n- **Blood Group**: \`O+ (Positive)\`\n- **Allergies**: Penicillin / Amoxicillin\n- **Emergency Hospital**: Lilavati Hospital Mumbai`,
      fav: true,
      folder: 'f-travel',
      tags: ['health', 'medical', 'emergency'],
    },
    {
      id: 'n-10',
      title: 'Startup Cap Table & SAFE Investor Notes',
      content: `# AegisVault Cap Table Summary\n\n- **Total Authorized Shares**: 10,000,000 Common\n- **Founders Equity**: 75.0%\n- **ESOP Pool**: 15.0%`,
      folder: 'f-work',
      tags: ['business', 'startup', 'investors'],
    },
  ];

  for (const n of notesData) {
    push(n.id, 'secure_note', n.title, {
      content: n.content,
      format: 'markdown',
    }, {
      favorite: n.fav,
      folderId: n.folder,
      tags: n.tags,
    });
  }

  // ==========================================
  // 9. CRYPTO WALLETS & PRIVATE KEYS (10 entries)
  // ==========================================
  const cryptoWalletsData = [
    {
      id: 'cw-1',
      title: 'Ethereum Cold Storage (Ledger 24 Words)',
      phrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art',
      chain: 'Ethereum / Arbitrum / Base',
      addr: '0x71C8366420A092679b5471834cA774239c439281',
      words: 24,
      fav: true,
    },
    {
      id: 'cw-2',
      title: 'Bitcoin Coldcard Vault (12 Words BIP39)',
      phrase: 'zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo zoo wrong',
      chain: 'Bitcoin Native SegWit (bech32)',
      addr: 'bc1q984729104859382019485938201948593820',
      words: 12,
      fav: true,
    },
    {
      id: 'cw-3',
      title: 'Solana Phantom DeFi Seed (12 Words)',
      phrase: 'letter advice cage absurd amount doctor acoustic avoid letter advice cage above',
      chain: 'Solana Mainnet',
      addr: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      words: 12,
    },
    {
      id: 'cw-4',
      title: 'Polygon DeFi Yield Farming (15 Words)',
      phrase: 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon agent',
      chain: 'Polygon PoS',
      addr: '0x9928104859281048592810485928104859281048',
      words: 15,
    },
  ];

  for (const cw of cryptoWalletsData) {
    push(cw.id, 'wallet_seed', cw.title, {
      walletName: cw.title,
      seedPhrase: cw.phrase,
      wordCount: cw.words,
      blockchain: cw.chain,
      publicAddress: cw.addr,
      notes: 'BIP-39 mnemonic seed phrase. Strictly cold storage.',
    }, {
      favorite: cw.fav,
      folderId: 'f-crypto',
      tags: ['crypto', 'web3', 'bip39'],
    });
  }

  // Private Keys / API Keys / SSH
  push('pk-1', 'private_key', 'Ethereum Deployer Hot Private Key', {
    privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
    keyType: 'secp256k1',
    publicKeyOrAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
    blockchain: 'Ethereum / Optimism',
    notes: 'Smart contract deployment private key on Alchemy RPC',
  }, { folderId: 'f-crypto', tags: ['crypto', 'ethereum', 'dev'] });

  push('pk-2', 'private_key', 'Bitcoin Paper Wallet WIF Key', {
    privateKey: '5HueCGU8rMjxEXxiPuD5BDku4MkFqeZyd4dZ1jvhTVqvbTLvyTJ',
    keyType: 'bitcoin',
    publicKeyOrAddress: '1BiTCoiN99WaLLeT1234567890abcdefgh',
    blockchain: 'Bitcoin Legacy',
  }, { folderId: 'f-crypto', tags: ['crypto', 'bitcoin'] });

  push('ssh-1', 'ssh_key', 'Production Ed25519 Root SSH Key', {
    privateKey: `-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\n-----END OPENSSH PRIVATE KEY-----`,
    publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEBWbvNn58rcr2TWrnDoXPi9TWP1sr2wvatzurvLmqqv admin@production.aegisvault.io',
    keyType: 'ed25519',
    fingerprint: 'SHA256:7uK8wZ9mX1pQ2rL5vT8yN3bC6hE4aG9jF0sD2wE8rT4',
  }, { folderId: 'f-work', tags: ['ssh', 'devops', 'server'] });

  push('api-1', 'api_key', 'OpenAI GPT-4 Production API Key', {
    apiKey: 'sk-proj-aegisvault9928104859281048592810485928104859281048592810485928104859281048',
    serviceName: 'OpenAI API Platform',
    endpoint: 'https://api.openai.com/v1',
  }, { folderId: 'f-work', tags: ['api', 'ai', 'openai'] });

  push('api-2', 'api_key', 'Stripe Production Webhook Signing Secret', {
    apiKey: 'whsec_9948201948592810485928104859281048592810485928104859281048592810',
    serviceName: 'Stripe Webhooks',
    endpoint: 'https://api.aegisvault.io/webhooks/stripe',
  }, { folderId: 'f-finance', tags: ['api', 'stripe', 'payments'] });

  return items;
}
