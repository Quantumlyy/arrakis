const URL_SAFE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

/**
 * RFC 7636 `code_verifier`: 43–128 chars from the URL-safe alphabet. 64 bytes
 * of CSPRNG output sits comfortably in range and is what other popular clients
 * (hellojs, auth0) use.
 */
export function generateCodeVerifier(byteLength = 64): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += URL_SAFE_ALPHABET[bytes[i]! % URL_SAFE_ALPHABET.length];
  }
  return out;
}

/**
 * S256 challenge: base64url(SHA-256(verifier)). Dune advertises S256 and that's
 * what `duneConnection` always sends.
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

/** Generic CSPRNG string for OAuth `state`. */
export function generateRandomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
