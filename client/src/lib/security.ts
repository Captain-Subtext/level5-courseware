/**
 * Security utilities for client-side application
 */

// Regular expressions for validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/;

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate password strength
 * Requires at least 8 characters, one uppercase, one lowercase, one number, and one special character
 */
export function isStrongPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

/**
 * Get password strength score (0-4)
 * 0: Very weak, 1: Weak, 2: Medium, 3: Strong, 4: Very strong
 */
export function getPasswordStrength(password: string): number {
  if (!password) return 0;
  
  let score = 0;
  
  // Length check
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  
  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Normalize score to 0-4
  return Math.min(4, Math.floor(score / 1.5));
}

/**
 * Generate a secure random token
 */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  return URL_REGEX.test(url);
}

/**
 * Store client identifier for tracking login attempts
 * Uses a combination of browser fingerprinting techniques
 */
export function setupClientIdentifier(): string {
  const storedId = window.sessionStorage.getItem('client_id');
  if (storedId) return storedId;
  
  // Generate a simple fingerprint based on available browser info
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 1,
    'deviceMemory' in navigator ? (navigator as any).deviceMemory : 'unknown',
    navigator.platform,
  ].join('|');
  
  // Hash the fingerprint
  const hashCode = Array.from(fingerprint).reduce(
    (hash, char) => (hash << 5) - hash + char.charCodeAt(0), 0);
  
  const clientId = Math.abs(hashCode).toString(36);
  window.sessionStorage.setItem('client_id', clientId);
  
  return clientId;
}

/**
 * Safe JSON parse with type checking
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    const parsed = JSON.parse(json);
    return parsed as T;
  } catch (e) {
    console.error('JSON parse error:', e);
    return fallback;
  }
}

/**
 * Initialize security measures
 */
export function initSecurity(): void {
  // Set up client identifier for tracking login attempts
  setupClientIdentifier();
  
  // Add event listener for storage events to detect multiple tabs/windows
  window.addEventListener('storage', (event) => {
    // Detect authentication changes in other tabs
    if (event.key === 'supabase.auth.token') {
      window.location.reload();
    }
  });
  
  // Content Security Policy report handler
  window.addEventListener('securitypolicyviolation', (e) => {
    console.error('CSP violation:', {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy,
    });
    
    // In production we would send this to a reporting endpoint
  });
} 