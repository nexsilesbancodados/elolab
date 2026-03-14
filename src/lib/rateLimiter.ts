/**
 * Client-side rate limiter for critical operations (auth, payments, etc.)
 * Prevents abuse by limiting the number of attempts within a time window.
 */

interface RateLimitEntry {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  auth: { maxAttempts: 5, windowMs: 60_000, blockDurationMs: 120_000 },
  payment: { maxAttempts: 3, windowMs: 60_000, blockDurationMs: 180_000 },
  api: { maxAttempts: 30, windowMs: 60_000, blockDurationMs: 60_000 },
};

export function checkRateLimit(
  key: string,
  configName: keyof typeof defaultConfigs = 'api'
): { allowed: boolean; retryAfterMs: number } {
  const config = defaultConfigs[configName];
  const now = Date.now();
  const entry = store.get(key);

  if (!entry) {
    store.set(key, { attempts: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true, retryAfterMs: 0 };
  }

  // Check if currently blocked
  if (entry.blockedUntil && now < entry.blockedUntil) {
    return { allowed: false, retryAfterMs: entry.blockedUntil - now };
  }

  // Reset if window expired
  if (now - entry.firstAttempt > config.windowMs) {
    store.set(key, { attempts: 1, firstAttempt: now, blockedUntil: null });
    return { allowed: true, retryAfterMs: 0 };
  }

  entry.attempts++;

  if (entry.attempts > config.maxAttempts) {
    entry.blockedUntil = now + config.blockDurationMs;
    return { allowed: false, retryAfterMs: config.blockDurationMs };
  }

  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimit(key: string) {
  store.delete(key);
}

export function getRemainingAttempts(
  key: string,
  configName: keyof typeof defaultConfigs = 'api'
): number {
  const config = defaultConfigs[configName];
  const entry = store.get(key);
  if (!entry) return config.maxAttempts;
  return Math.max(0, config.maxAttempts - entry.attempts);
}
