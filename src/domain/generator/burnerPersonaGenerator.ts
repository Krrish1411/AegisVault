import type { AddressPayload } from '@/domain/vault/types';

const FIRST_NAMES = [
  'Alex',
  'Taylor',
  'Jordan',
  'Morgan',
  'Casey',
  'Devin',
  'Riley',
  'Sam',
  'Robin',
  'Logan',
  'Avery',
  'Jamie',
  'Cameron',
  'Kendall',
  'Reese',
  'Quinn',
  'Dakota',
  'Peyton',
  'Skyler',
  'Harper',
];

const LAST_NAMES = [
  'Mercer',
  'Sterling',
  'Vance',
  'Carrington',
  'Holloway',
  'Sinclair',
  'Winter',
  'Drake',
  'Cross',
  'Bishop',
  'Hayes',
  'Prescott',
  'Hawthorne',
  'Blackwood',
  'Kensington',
  'Somerset',
  'Archer',
  'Bradford',
  'Ellington',
  'Montgomery',
];

const COMPANIES = [
  'Apex Ventures Ltd',
  'North Star Consulting',
  'CloudPeak Labs',
  'Horizon Data Systems',
  'BlueWave Media',
  'Summit Analytics',
  'Vanguard Digital',
  'Beacon Strategic',
];

const LOCATIONS = [
  {
    street: '742 Evergreen Terrace',
    unit: 'Apt 4B',
    city: 'Springfield',
    state: 'OR',
    postalCode: '97477',
    country: 'United States',
    phonePrefix: '+1 (555) 01',
  },
  {
    street: '1048 Ocean Avenue',
    unit: 'Suite 210',
    city: 'Santa Monica',
    state: 'CA',
    postalCode: '90403',
    country: 'United States',
    phonePrefix: '+1 (555) 01',
  },
  {
    street: '520 Pine Street',
    unit: 'Floor 3',
    city: 'Seattle',
    state: 'WA',
    postalCode: '98101',
    country: 'United States',
    phonePrefix: '+1 (555) 01',
  },
  {
    street: '1842 Congress Avenue',
    unit: 'Unit 504',
    city: 'Austin',
    state: 'TX',
    postalCode: '78701',
    country: 'United States',
    phonePrefix: '+1 (555) 01',
  },
  {
    street: '350 5th Avenue',
    unit: 'Ste 1400',
    city: 'New York',
    state: 'NY',
    postalCode: '10118',
    country: 'United States',
    phonePrefix: '+1 (555) 01',
  },
  {
    street: '88 Baker Street',
    unit: 'Flat 12',
    city: 'London',
    state: 'Greater London',
    postalCode: 'W1U 6TY',
    country: 'United Kingdom',
    phonePrefix: '+44 20 7946 0',
  },
  {
    street: '124 MG Road',
    unit: '4th Floor, Block B',
    city: 'Bengaluru',
    state: 'Karnataka',
    postalCode: '560001',
    country: 'India',
    phonePrefix: '+91 98200 1',
  },
  {
    street: '45 Marine Drive',
    unit: 'Flat 7A',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400020',
    country: 'India',
    phonePrefix: '+91 98199 2',
  },
];

const EMAIL_PROVIDERS = [
  'duck.com',
  'relay.firefox.com',
  'simplelogin.com',
  'anonaddy.me',
  'proton.me',
];

const PURPOSES = [
  'Untrusted / Spam Website Signups',
  'Free Trial Verification',
  'Disposable Shopping / Coupons',
  'Newsletter Subscription',
  'Anonymous Survey / Form',
];

function getRandomElement<T>(array: readonly T[]): T {
  const index = Math.floor(Math.random() * array.length);
  return array[index] as T;
}

function getRandomDigits(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString();
  }
  return result;
}

function getRandomAlpha(length: number): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

/**
 * Generates a realistic disposable persona and burner address.
 */
export function generateBurnerPersona(): AddressPayload & { title: string } {
  const firstName = getRandomElement(FIRST_NAMES);
  const lastName = getRandomElement(LAST_NAMES);
  const fullName = `${firstName} ${lastName}`;
  const loc = getRandomElement(LOCATIONS);
  const company = getRandomElement(COMPANIES);
  const domain = getRandomElement(EMAIL_PROVIDERS);
  const emailAlias = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${getRandomAlpha(4)}@${domain}`;
  const phone = `${loc.phonePrefix}${getRandomDigits(3)}`;
  const purpose = getRandomElement(PURPOSES);

  return {
    title: `Burner Persona (${firstName} - ${loc.city})`,
    profileType: 'temporary',
    fullName,
    company,
    addressLine1: loc.street,
    addressLine2: loc.unit,
    city: loc.city,
    state: loc.state,
    postalCode: loc.postalCode,
    country: loc.country,
    phone,
    email: emailAlias,
    purpose,
    notes: 'Generated burner persona for untrusted sites. Master identity is never exposed.',
  };
}

/**
 * Formats an AddressPayload into a clean, human-readable multiline address string.
 */
export function formatAddress(addr: AddressPayload): string {
  const lines: string[] = [];
  if (addr.fullName) lines.push(addr.fullName);
  if (addr.company) lines.push(addr.company);
  if (addr.addressLine1) lines.push(addr.addressLine1);
  if (addr.addressLine2) lines.push(addr.addressLine2);

  const cityStateZip = [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ');
  if (cityStateZip) lines.push(cityStateZip);

  if (addr.country) lines.push(addr.country);
  if (addr.phone) lines.push(`Phone: ${addr.phone}`);
  if (addr.email) lines.push(`Email: ${addr.email}`);

  return lines.join('\n');
}
