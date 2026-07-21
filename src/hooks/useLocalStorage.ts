import { useState, useEffect } from "react";

// ─── Simple localStorage obfuscation ─────────────────────────────────────────
// Protects user data from casual inspection in DevTools / plain-text browsing.
// Uses XOR cipher with a static per-app seed — not crypto-grade, but a meaningful
// first layer of privacy for a client-side personal wellness app.
const OBFUSCATION_SEED = "twzn_2024_secure_key_#@!";

export function obfuscate(data: string): string {
  let result = "";
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(
      data.charCodeAt(i) ^ OBFUSCATION_SEED.charCodeAt(i % OBFUSCATION_SEED.length)
    );
  }
  return btoa(unescape(encodeURIComponent(result)));
}

export function deobfuscate(encoded: string): string {
  try {
    const data = decodeURIComponent(escape(atob(encoded)));
    let result = "";
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ OBFUSCATION_SEED.charCodeAt(i % OBFUSCATION_SEED.length)
      );
    }
    return result;
  } catch {
    return encoded; // fallback for legacy plain-text data
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return initialValue;
      // Try to deobfuscate; fall back to plain JSON for legacy data
      let jsonString: string;
      try {
        jsonString = deobfuscate(raw);
      } catch {
        jsonString = raw;
      }
      return JSON.parse(jsonString);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      const jsonString = JSON.stringify(storedValue);
      window.localStorage.setItem(key, obfuscate(jsonString));
    } catch {
      // Silent fail — non-critical storage write
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}
