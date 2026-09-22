// Authentication and Security Service for IT Quiz Pro

// Cryptographic Salt to protect against dictionary and rainbow table attacks
const AUTH_SALT = "CompTIA_Sec_Quiz_Access_Salt_2026_x89Km";

// Cryptographic SHA-256 hash of the master password
// NOTE: Plain-text password is NEVER stored in repository code or comments
const DEFAULT_AUTH_HASH = "bc339b485766f84c1c219595cda754fa81040e4a5ba2650e5263fff034d6a340";

const STORAGE_KEYS = {
  AUTH_TOKEN: "quiz_auth_token",
  CUSTOM_HASH: "quiz_custom_hash",
  FAILED_ATTEMPTS: "quiz_failed_attempts",
  LOCKOUT_UNTIL: "quiz_lockout_until",
};

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

// Fallback pure-JS SHA-256 implementation if crypto.subtle is unavailable
function fallbackSha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let lengthProperty = "length";
  let i, j;
  let result = "";

  const words = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [];
  const k = [];
  let primeCounter = 0;

  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = candidate;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  ascii += "\x80";
  while ((ascii[lengthProperty] % 64) - 56) ascii += "\x00";
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return "";
    words[i >> 2] |= j << ((3 - (i % 4)) * 8);
  }
  words[words[lengthProperty]] = (asciiBitLength / maxWord) | 0;
  words[words[lengthProperty]] = asciiBitLength;

  for (j = 0; j < words[lengthProperty]; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : (w[i - 16] + s0 + w[i - 7] + s1) | 0;

      const s1_maj =
        rightRotate(hash[0], 2) ^
        rightRotate(hash[0], 13) ^
        rightRotate(hash[0], 22);
      const maj =
        (hash[0] & hash[1]) ^
        (hash[0] & hash[2]) ^
        (hash[1] & hash[2]);
      const t2 = (s1_maj + maj) | 0;

      const s1_ch =
        rightRotate(hash[4], 6) ^
        rightRotate(hash[4], 11) ^
        rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const t1 = (hash[7] + s1_ch + ch + k[i] + w[i]) | 0;

      hash = [(t1 + t2) | 0].concat(hash);
      hash[4] = (hash[4] + t1) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (8 * j)) & 255;
      result += (b < 16 ? "0" : "") + b.toString(16);
    }
  }
  return result;
}

/**
 * Computes SHA-256 hex string of any text
 */
export async function sha256(text) {
  if (window.crypto && window.crypto.subtle) {
    try {
      const msgUint8 = new TextEncoder().encode(text);
      const hashBuffer = await window.crypto.subtle.digest("SHA-256", msgUint8);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    } catch {
      // Fallback
    }
  }
  return fallbackSha256(text);
}

/**
 * Computes salted SHA-256 hash for secure password verification
 */
export async function hashPassword(password) {
  return sha256(AUTH_SALT + password);
}

/**
 * Gets the current expected password hash (custom if set, otherwise master default)
 */
export function getExpectedHash() {
  try {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_HASH) || DEFAULT_AUTH_HASH;
  } catch {
    return DEFAULT_AUTH_HASH;
  }
}

/**
 * Checks if the user is currently authenticated
 */
export function isAuthenticated() {
  try {
    const expected = getExpectedHash();
    const localToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const sessionToken = sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    const token = localToken || sessionToken;
    if (!token) return false;

    // Validate that stored token matches current active hash
    return token === expected;
  } catch {
    return false;
  }
}

/**
 * Checks brute-force lockout status
 * @returns {number} Seconds remaining on lockout (0 if not locked)
 */
export function getRemainingLockoutSeconds() {
  try {
    const lockoutUntil = parseInt(localStorage.getItem(STORAGE_KEYS.LOCKOUT_UNTIL) || "0", 10);
    const now = Date.now();
    if (lockoutUntil > now) {
      return Math.ceil((lockoutUntil - now) / 1000);
    }
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Attempts login with provided password
 * @param {string} password
 * @param {boolean} rememberMe - whether to persist across browser sessions
 * @returns {Promise<{success: boolean, error?: string, remainingCooldown?: number}>}
 */
export async function login(password, rememberMe = true) {
  const cooldown = getRemainingLockoutSeconds();
  if (cooldown > 0) {
    return {
      success: false,
      error: `Zu viele Fehlversuche. Bitte warte noch ${cooldown} Sekunden.`,
      remainingCooldown: cooldown,
    };
  }

  if (!password || password.trim() === "") {
    return { success: false, error: "Bitte gib ein Passwort ein." };
  }

  const hash = await hashPassword(password.trim());
  const expectedHash = getExpectedHash();

  if (hash === expectedHash) {
    // Reset failed attempts
    try {
      localStorage.removeItem(STORAGE_KEYS.FAILED_ATTEMPTS);
      localStorage.removeItem(STORAGE_KEYS.LOCKOUT_UNTIL);

      // Save token
      if (rememberMe) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, hash);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, hash);
      }
    } catch (e) {
      console.error("Storage error:", e);
    }
    return { success: true };
  }

  // Failed attempt handling
  let attempts = 1;
  try {
    const storedAttempts = parseInt(localStorage.getItem(STORAGE_KEYS.FAILED_ATTEMPTS) || "0", 10);
    attempts = storedAttempts + 1;
    localStorage.setItem(STORAGE_KEYS.FAILED_ATTEMPTS, String(attempts));

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(STORAGE_KEYS.LOCKOUT_UNTIL, String(lockoutUntil));
      return {
        success: false,
        error: `5 Fehlversuche erreicht. Eingabe für 30 Sekunden gesperrt!`,
        remainingCooldown: 30,
      };
    }
  } catch (e) {
    console.error("Lockout error:", e);
  }

  const attemptsLeft = MAX_FAILED_ATTEMPTS - attempts;
  return {
    success: false,
    error: `Falsches Passwort! Noch ${attemptsLeft} ${attemptsLeft === 1 ? "Versuch" : "Versuche"} übrig.`,
  };
}

/**
 * Logs out and locks the app
 */
export function logout() {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (e) {
    console.error("Logout error:", e);
  }
}

/**
 * Changes master password
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function changePassword(currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Das neue Passwort muss mindestens 6 Zeichen lang sein." };
  }

  const currentHash = await hashPassword(currentPassword.trim());
  const expectedHash = getExpectedHash();

  if (currentHash !== expectedHash) {
    return { success: false, error: "Das aktuelle Passwort ist nicht korrekt!" };
  }

  const newHash = await hashPassword(newPassword.trim());
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_HASH, newHash);
    if (localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)) {
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newHash);
    } else {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, newHash);
    }
    return { success: true };
  } catch {
    return { success: false, error: "Fehler beim Speichern im Browser-Speicher." };
  }
}

/**
 * Resets password to original master hash
 */
export function resetPasswordToDefault() {
  try {
    localStorage.removeItem(STORAGE_KEYS.CUSTOM_HASH);
    logout();
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if custom password is active
 */
export function hasCustomPassword() {
  try {
    return Boolean(localStorage.getItem(STORAGE_KEYS.CUSTOM_HASH));
  } catch {
    return false;
  }
}
