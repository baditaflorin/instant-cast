export function buildSharePageUrl(token: string, passphrase: string, apiBaseUrl: string): string {
  const url = new URL(
    `watch/${encodeURIComponent(token)}`,
    `${window.location.origin}${import.meta.env.BASE_URL}`,
  );
  const fragment = new URLSearchParams({ key: passphrase, api: apiBaseUrl });
  url.hash = fragment.toString();
  return url.toString();
}

export interface ParsedShareUrl {
  href: string;
  token: string;
  passphrase: string | null;
  apiBaseUrl: string | null;
}

export function parseInstantCastShareUrl(input: string): ParsedShareUrl | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  let url: URL;
  try {
    url = new URL(trimmed, window.location.origin);
  } catch {
    return null;
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const watchPrefix = `${base}/watch/`;
  const path = url.pathname;
  const tokenIndex = path.indexOf(watchPrefix);
  if (tokenIndex < 0) return null;

  const token = decodeURIComponent(path.slice(tokenIndex + watchPrefix.length));
  if (!token) return null;

  const fragment = new URLSearchParams(url.hash.replace(/^#/, ""));
  return {
    href: url.toString(),
    token,
    passphrase: fragment.get("key"),
    apiBaseUrl: fragment.get("api"),
  };
}

export async function copyToClipboard(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
