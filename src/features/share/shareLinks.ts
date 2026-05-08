export function buildSharePageUrl(token: string, passphrase: string, apiBaseUrl: string): string {
  const url = new URL(
    `watch/${encodeURIComponent(token)}`,
    `${window.location.origin}${import.meta.env.BASE_URL}`,
  );
  const fragment = new URLSearchParams({ key: passphrase, api: apiBaseUrl });
  url.hash = fragment.toString();
  return url.toString();
}

export async function copyToClipboard(value: string): Promise<void> {
  await navigator.clipboard.writeText(value);
}
