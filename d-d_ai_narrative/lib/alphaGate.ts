import 'server-only';

/** Nom du cookie posé une fois le code alpha validé. */
export const ALPHA_GATE_COOKIE = 'alpha_access';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return toHex(signature);
}

/** La porte alpha est désactivée tant qu'aucun code n'est configuré. */
export function isAlphaGateEnabled(): boolean {
  return Boolean(process.env.ALPHA_ACCESS_CODE);
}

/**
 * Valeur de cookie attendue pour un accès validé (dérivée du code + AUTH_SECRET,
 * pour ne jamais stocker le code en clair côté client).
 */
export async function computeAlphaGateToken(): Promise<string | null> {
  const code = process.env.ALPHA_ACCESS_CODE;
  const secret = process.env.AUTH_SECRET;
  if (!code || !secret) return null;
  return hmacSha256Hex(secret, code);
}
