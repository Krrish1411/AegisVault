/**
 * Curated offline list of top compromised / common passwords.
 * Zero network requests required for breach/common checks.
 */
export const COMMON_COMPROMISED_PASSWORDS: ReadonlySet<string> = new Set([
  'password', 'password1', 'password123', '123456', '12345678', '123456789', '12345', '1234',
  'qwerty', 'qwertyuiop', '111111', '123123', 'admin', 'admin123', 'admin1234', 'administrator',
  'welcome', 'welcome1', 'welcome123', 'letmein', 'iloveyou', 'monkey', 'dragon', 'football',
  'baseball', 'soccer', 'superman', 'batman', 'starwars', 'princess', 'solo', 'master',
  'secret', 'login', 'access', 'default', 'root', 'guest', 'pass123', 'pass1234',
  'test', 'testing', 'charlie', 'shadow', 'sunshine', 'trustno1', 'michael', 'jordan',
  'hunter', 'hunter2', 'daniel', 'jessica', 'ashley', 'thomas', 'computer', 'freedom',
  'cookie', 'matrix', 'super', 'winner', 'hello', 'helloworld', 'killer', 'orange',
  'summer', 'spring', 'autumn', 'winter', 'january', 'december', 'supersecret', 'secret123',
  'p@ssword', 'p@ssw0rd', 'passw0rd', 'p@ssword1', 'password!', 'changeme', 'donttell',
  'abc123', 'abcdef', '123456a', '654321', '000000', '987654321', '1q2w3e4r', 'zaq12wsx',
  'qazwsx', 'qazwsxedc', 'wsxedc', 'asdfgh', 'asdfghjkl', 'zxcvbn', 'zxcvbnm', 'poiuyt',
  'love', 'lover', 'forever', 'angel', 'beauty', 'sweet', 'baby', 'honey',
  'google', 'yahoo', 'apple', 'microsoft', 'amazon', 'facebook', 'twitter', 'github',
  'pokemon', 'minecraft', 'roblox', 'fortnite', 'netflix', 'spotify', 'disney', 'marvel',
  'whatever', 'nothing', 'nobody', 'anyone', 'family', 'friends', 'coffee', 'pizza',
]);

/**
 * Checks whether a candidate password matches the known common compromised list.
 */
export function isCommonPassword(password: string): boolean {
  if (!password) return false;
  const normalized = password.toLowerCase().trim();
  if (COMMON_COMPROMISED_PASSWORDS.has(normalized)) {
    return true;
  }
  // Check common trailing substitutions (e.g. password1, admin2024)
  const baseWithoutDigits = normalized.replace(/\d+$/, '');
  if (baseWithoutDigits && COMMON_COMPROMISED_PASSWORDS.has(baseWithoutDigits)) {
    return true;
  }
  return false;
}
